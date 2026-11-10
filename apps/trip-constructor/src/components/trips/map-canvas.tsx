"use client";

import type { MapPlace } from "@/lib/contracts";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import styles from "./day-route-map.module.css";

export interface MapCanvasProps {
  mapsKey: string;
  nodes: { key: string; label: string; place: MapPlace | null; itemId?: string }[];
  selectedItemId?: string | null;
  onSelectItem?: (itemId: string) => void;
  geometries?: { type: "LineString"; coordinates: number[][] }[];
  onPick?: (latitude: number, longitude: number) => void;
  label?: string;
}

type LayerData = Pick<MapCanvasProps, "nodes" | "geometries" | "selectedItemId">;
type MapRuntime = {
  update: (data: LayerData) => void;
  select: (selectedItemId: string | null | undefined) => void;
  retry: () => void;
};

export function MapCanvas({ mapsKey, nodes, geometries = [], onPick, selectedItemId, onSelectItem, label = "Карта маршрута" }: MapCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const pick = useRef(onPick);
  const select = useRef(onSelectItem);
  const latest = useRef<LayerData>({ nodes, geometries, selectedItemId });
  const runtime = useRef<MapRuntime | null>(null);
  const data = JSON.stringify({ nodes, geometries });
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => { pick.current = onPick; select.current = onSelectItem; }, [onPick, onSelectItem]);
  useEffect(() => {
    latest.current = { ...latest.current, ...(JSON.parse(data) as Pick<LayerData, "nodes" | "geometries">) };
    runtime.current?.update(latest.current);
  }, [data]);
  useEffect(() => {
    latest.current = { ...latest.current, selectedItemId };
    runtime.current?.select(selectedItemId);
  }, [selectedItemId]);

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void import("leaflet").then(L => {
      if (cancelled || !host.current) return;
      setError(null);
      const map = L.map(host.current, { scrollWheelZoom: false, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView([20, 0], 2);
      map.attributionControl.setPrefix(false);
      const tiles = L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(mapsKey)}`, {
        maxZoom: 20,
        crossOrigin: "anonymous",
        referrerPolicy: "strict-origin-when-cross-origin",
        attribution: '<a href="https://www.geoapify.com/">Geoapify</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://openmaptiles.org/">OpenMapTiles</a>',
      });
      tiles.on("tileloadstart", (event: import("leaflet").TileEvent) => event.tile.setAttribute("referrerpolicy", "strict-origin-when-cross-origin"));
      tiles.on("tileerror", () => { if (!cancelled) setError("Подложка недоступна. Проверьте соединение и повторите. Места и текстовый маршрут сохранены."); });
      tiles.addTo(map);
      const layers = L.layerGroup().addTo(map);
      const markers: { marker: import("leaflet").Marker; itemId?: string }[] = [];
      let points: import("leaflet").LatLngExpression[] = [];
      let boundsSignature = "";
      const fit = () => { if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15, animate: false }); };

      function updateSelection(id: string | null | undefined) {
        markers.forEach(({ marker, itemId }) => {
          if (!itemId) return;
          const element = marker.getElement();
          if (!element) return;
          const isSelected = itemId === id;
          element.classList.toggle(styles.selectedPin, isSelected);
          element.setAttribute("aria-pressed", String(isSelected));
        });
      }

      function update({ nodes, geometries, selectedItemId }: LayerData) {
        layers.clearLayers();
        markers.length = 0;
        points = [];
        nodes.forEach((node, index) => {
          if (!node.place) return;
          const point: import("leaflet").LatLngExpression = [node.place.latitude, node.place.longitude];
          points.push(point);
          const iconText = document.createElement("span");
          iconText.textContent = String(index + 1);
          const popup = document.createElement("span");
          popup.textContent = `${index + 1}. ${node.label}`;
          const marker = L.marker(point, {
            title: node.label,
            draggable: !!pick.current,
            icon: L.divIcon({ html: iconText, className: styles.pin, iconSize: [30, 30], iconAnchor: [15, 15] }),
          }).bindPopup(popup).addTo(layers);
          markers.push({ marker, itemId: node.itemId });
          marker.on("click", () => { if (node.itemId) select.current?.(node.itemId); });
          marker.on("keypress", event => { if (event.originalEvent.key === "Enter" && node.itemId) select.current?.(node.itemId); });
          marker.on("keydown", event => {
            if (event.originalEvent.key !== " " && event.originalEvent.key !== "Spacebar") return;
            event.originalEvent.preventDefault();
            marker.openPopup();
            if (node.itemId) select.current?.(node.itemId);
          });
          marker.on("dragend", () => { const value = marker.getLatLng(); pick.current?.(value.lat, value.lng); });
        });
        geometries?.forEach(geometry => {
          const line = geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
          L.polyline(line, { color: "#225740", weight: 4 }).addTo(layers);
          points.push(...line);
        });
        updateSelection(selectedItemId);
        const signature = JSON.stringify({ nodes: nodes.map(node => [node.key, node.place?.latitude, node.place?.longitude]), geometries });
        if (signature !== boundsSignature) { boundsSignature = signature; fit(); }
      }

      runtime.current = { update, select: updateSelection, retry: () => { setError(null); tiles.redraw(); } };
      update(latest.current);
      map.on("click", (event: import("leaflet").LeafletMouseEvent) => pick.current?.(event.latlng.lat, event.latlng.lng));
      let width = host.current.clientWidth;
      let height = host.current.clientHeight;
      const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
        if (!host.current) return;
        const nextWidth = host.current.clientWidth;
        const nextHeight = host.current.clientHeight;
        if (nextWidth === width && nextHeight === height) return;
        width = nextWidth;
        height = nextHeight;
        map.invalidateSize({ pan: false });
        fit();
      });
      observer?.observe(host.current);
      dispose = () => { runtime.current = null; observer?.disconnect(); map.remove(); };
    }).catch(() => { if (!cancelled) setError("Не удалось загрузить карту. Текстовый маршрут доступен."); });
    return () => { cancelled = true; dispose?.(); };
  }, [mapsKey, attempt]);

  return <div className={styles.canvasWrap}>
    <div className={styles.canvas} ref={host} aria-label={label} />
    {error && <p role="status">{error} <button type="button" className="text-link" onClick={() => { if (runtime.current) runtime.current.retry(); else setAttempt(value => value + 1); }}>Повторить загрузку карты</button></p>}
  </div>;
}
