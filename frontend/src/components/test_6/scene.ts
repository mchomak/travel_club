import * as THREE from "three";
import { BASE_TOKENS } from "../design-system/tokens";
import { createArtwork } from "./artwork";
import { deformPage, PAGE_HEIGHT, PAGE_WIDTH } from "./deformation";
import { DEFAULT_PARAMS, type SceneParams } from "./parameters";
import { sampleTimeline, timelineDuration, type TimelineFrame } from "./timeline";

export type SceneReport = { phase: string; paused: boolean; elapsed: number; total: number; progress: number; fps: number; frames: number; columns: number };
export type SceneController = {
  update(params: SceneParams): void; replay(): void; togglePause(): void;
  final(): void; reset(): void; seek(fraction: number): void; dispose(): void;
};

/** A closed, two-sided shell. The back UV is reversed, so it reads normally after crossing the spine. */
function leafGeometry(columns: number, rows: number) {
  const geometry = new THREE.BufferGeometry();
  const count = (columns + 1) * (rows + 1);
  const positions = new Float32Array(count * 2 * 3), uv = new Float32Array(count * 2 * 2);
  const front: number[] = [], back: number[] = [], edge: number[] = [];
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    const index = row * (columns + 1) + col;
    uv[index * 2] = col / columns; uv[index * 2 + 1] = row / rows;
    uv[(index + count) * 2] = 1 - col / columns; uv[(index + count) * 2 + 1] = row / rows;
    if (row < rows && col < columns) {
      const a = index, b = a + 1, c = a + columns + 1, d = c + 1;
      front.push(a, b, c, b, d, c);
      back.push(a + count, c + count, b + count, b + count, c + count, d + count);
    }
  }
  const rim: number[] = [];
  for (let col = 0; col <= columns; col++) rim.push(col);
  for (let row = 1; row <= rows; row++) rim.push(row * (columns + 1) + columns);
  for (let col = columns - 1; col >= 0; col--) rim.push(rows * (columns + 1) + col);
  for (let row = rows - 1; row > 0; row--) rim.push(row * (columns + 1));
  rim.forEach((a, index) => { const b = rim[(index + 1) % rim.length]; edge.push(a, a + count, b, b, a + count, b + count); });
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex([...front, ...back, ...edge]);
  geometry.addGroup(0, front.length, 0); geometry.addGroup(front.length, back.length, 1); geometry.addGroup(front.length + back.length, edge.length, 2);
  return geometry;
}

export async function createScene(host: HTMLElement, initial: SceneParams, report: (state: SceneReport) => void, failure: (message: string) => void, signal: AbortSignal): Promise<SceneController> {
  const art = await createArtwork();
  if (signal.aborted) { art.dispose(); throw new DOMException("Aborted", "AbortError"); }
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" }); }
  catch { art.dispose(); throw new Error("WebGL недоступен. Включите аппаратное ускорение или откройте страницу в другом браузере."); }
  renderer.setClearColor(BASE_TOKENS.colors.cloud);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute("aria-label", "Трёхмерный журнал Travel Club");
  renderer.domElement.setAttribute("role", "img");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BASE_TOKENS.colors.cloud);
  const camera = new THREE.PerspectiveCamera(initial.fov, 1, .1, 80);
  camera.up.set(0, 1, 0);
  const magazine = new THREE.Group(); scene.add(magazine);
  const leftGroup = new THREE.Group(), rightGroup = new THREE.Group(); magazine.add(leftGroup, rightGroup);
  const materials: THREE.Material[] = [], geometries: THREE.BufferGeometry[] = [];
  const register = <T extends THREE.BufferGeometry>(geometry: T): T => { geometries.push(geometry); return geometry; };
  const paper = (map?: THREE.Texture, color = BASE_TOKENS.colors.cloud) => {
    const material = new THREE.MeshStandardMaterial({ ...(map ? { map } : {}), color: map ? "#ffffff" : color, roughness: 1, metalness: 0 });
    materials.push(material); return material;
  };
  const frontMaterial = paper(art.cover), backMaterial = paper(art.spreads[0].left), edgeMaterial = paper(undefined, "#dedcd4");
  const columns = host.clientWidth < 600 ? 32 : 56, rows = 16;
  const movingGeometry = register(leafGeometry(columns, rows));
  const leaf = new THREE.Mesh(movingGeometry, [frontMaterial, backMaterial, edgeMaterial]);
  leaf.castShadow = true; leaf.receiveShadow = true; leaf.frustumCulled = false; magazine.add(leaf);
  const leftMaterial = paper(art.spreads[0].left), rightMaterial = paper(art.spreads[0].right);
  const planeGeometry = register(new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT));
  const leftPage = new THREE.Mesh(planeGeometry, leftMaterial), rightPage = new THREE.Mesh(planeGeometry, rightMaterial);
  leftPage.position.set(-PAGE_WIDTH / 2, 0, .075); rightPage.position.set(PAGE_WIDTH / 2, 0, .075);
  leftPage.receiveShadow = true; rightPage.receiveShadow = true; leftGroup.add(leftPage); rightGroup.add(rightPage);
  const stackGeometry = register(new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, .008));
  const stackMaterial = paper(undefined, "#e7e4dc");
  const stackLayers: { mesh: THREE.Mesh; layer: number }[] = [];
  for (const side of [-1, 1]) {
    const group = side < 0 ? leftGroup : rightGroup;
    for (let layer = 0; layer < 5; layer++) {
      const stack = new THREE.Mesh(stackGeometry, stackMaterial);
      stack.position.set(side * (PAGE_WIDTH / 2 + .003 * layer), 0, .02 + layer * .01);
      stack.castShadow = true; stack.receiveShadow = true; group.add(stack);
      stackLayers.push({ mesh: stack, layer });
    }
    const cover = new THREE.Mesh(register(new THREE.BoxGeometry(PAGE_WIDTH + .024, PAGE_HEIGHT + .024, .012)), paper(undefined, "#292c2b"));
    cover.position.set(side * PAGE_WIDTH / 2, 0, .01); cover.castShadow = true; group.add(cover);
  }
  // Very narrow gutter separation. The actual turning leaf remains attached to x=0.
  const spine = new THREE.Mesh(register(new THREE.PlaneGeometry(.019, PAGE_HEIGHT)), paper(undefined, "#a09f98"));
  spine.position.z = .073; magazine.add(spine);
  const floorMaterial = new THREE.ShadowMaterial({ opacity: .3 }); materials.push(floorMaterial);
  const floor = new THREE.Mesh(register(new THREE.PlaneGeometry(100, 100)), floorMaterial); floor.receiveShadow = true; floor.position.z = -.018; scene.add(floor);
  const contactCanvas = document.createElement("canvas"); contactCanvas.width = 256; contactCanvas.height = 256;
  const contactCtx = contactCanvas.getContext("2d")!;
  const gradient = contactCtx.createRadialGradient(128, 128, 30, 128, 128, 128);
  gradient.addColorStop(0, "rgba(52,48,41,.13)"); gradient.addColorStop(.7, "rgba(52,48,41,.06)"); gradient.addColorStop(1, "rgba(52,48,41,0)");
  contactCtx.fillStyle = gradient; contactCtx.fillRect(0, 0, 256, 256);
  const contactTexture = new THREE.CanvasTexture(contactCanvas);
  const contactMaterial = new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, depthWrite: false }); materials.push(contactMaterial);
  const contact = new THREE.Mesh(register(new THREE.PlaneGeometry(PAGE_WIDTH * 2.18, PAGE_HEIGHT * 1.2)), contactMaterial); contact.position.z = -.014; scene.add(contact);
  const ambient = new THREE.HemisphereLight("#ffffff", "#b8b4a9", initial.ambient); ambient.position.set(0, 0, 5); scene.add(ambient);
  const key = new THREE.DirectionalLight("#fffdf7", initial.key); key.castShadow = true;
  key.shadow.mapSize.set(host.clientWidth < 600 ? 1024 : 2048, host.clientWidth < 600 ? 1024 : 2048);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.camera.near = .5; key.shadow.camera.far = 25; key.shadow.bias = -.0003; key.shadow.normalBias = .013;
  scene.add(key, key.target);
  const debug = new THREE.Group(); magazine.add(debug); debug.add(new THREE.AxesHelper(1));
  const lineGeometry = register(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -PAGE_HEIGHT / 2, .09), new THREE.Vector3(0, PAGE_HEIGHT / 2, .09)]));
  const lineMaterial = new THREE.LineBasicMaterial({ color: "#bd4a38", depthTest: false }); materials.push(lineMaterial);
  debug.add(new THREE.Line(lineGeometry, lineMaterial));
  let params = { ...initial }, elapsed = 0, paused = false, disposed = false, raf = 0, lastTime: number | null = null;
  let frameCount = 0, fpsFrames = 0, fpsStart = 0, fps = 0, lastReport = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches) { elapsed = timelineDuration(params); paused = true; }
  let current: TimelineFrame;

  function cameraFit() {
    const width = host.clientWidth, height = host.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 600 ? 1.25 : 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1); camera.fov = params.fov;
    // Reserve room for the rising leaf, independently of its current phase.
    const halfFov = THREE.MathUtils.degToRad(params.fov / 2);
    const horizontalFit = (PAGE_WIDTH * 1.18 * params.scale) / (Math.tan(halfFov) * camera.aspect);
    const verticalFit = (PAGE_HEIGHT * .72 * params.scale) / Math.tan(halfFov);
    const distance = Math.max(params.distance, horizontalFit, verticalFit);
    const pitch = THREE.MathUtils.degToRad(params.pitch), yaw = THREE.MathUtils.degToRad(params.yaw);
    camera.position.set(Math.sin(yaw) * Math.sin(pitch) * distance, -Math.cos(yaw) * Math.sin(pitch) * distance, Math.cos(pitch) * distance);
    camera.lookAt(0, 0, .28); camera.rotateZ(THREE.MathUtils.degToRad(params.roll)); camera.updateProjectionMatrix();
  }
  function applyParams() {
    cameraFit(); magazine.scale.setScalar(params.scale); magazine.rotation.z = THREE.MathUtils.degToRad(params.tilt);
    ambient.intensity = params.ambient; key.intensity = params.key; key.position.set(params.lightX, params.lightY, params.lightZ);
    key.shadow.intensity = params.shadowStrength; key.shadow.radius = params.shadowSoftness;
    contactMaterial.opacity = params.shadowStrength / .19;
    debug.visible = params.debug; frontMaterial.wireframe = params.debug; backMaterial.wireframe = params.debug;
    const top = .025 + params.thickness * 12.5;
    leftPage.position.z = top; rightPage.position.z = top; spine.position.z = top - .002;
    stackLayers.forEach(({ mesh, layer }) => {
      mesh.scale.z = params.thickness / .004;
      mesh.position.z = .02 + layer * params.thickness * 2.5;
    });
  }
  function deform(frame: TimelineFrame) {
    const shape = frame.cover ? { ...params, stiffness: .97, bend: params.bend * .45, curl: params.curl * .25 } : params;
    const centers = deformPage(frame.progress, shape, columns, rows);
    const positions = movingGeometry.getAttribute("position") as THREE.BufferAttribute;
    const count = centers.length / 3, thickness = params.thickness * (frame.cover ? 2 : 1);
    for (let index = 0; index < count; index++) {
      const col = index % (columns + 1), prev = Math.max(0, col - 1), next = Math.min(columns, col + 1), row = Math.floor(index / (columns + 1));
      const a = (row * (columns + 1) + prev) * 3, b = (row * (columns + 1) + next) * 3;
      const dx = centers[b] - centers[a], dz = centers[b + 2] - centers[a + 2], length = Math.hypot(dx, dz);
      const nx = -dz / length, nz = dx / length;
      for (const face of [0, 1]) {
        const offset = face === 0 ? thickness / 2 : -thickness / 2;
        positions.setXYZ(index + face * count, centers[index * 3] + nx * offset, centers[index * 3 + 1], centers[index * 3 + 2] + nz * offset);
      }
    }
    positions.needsUpdate = true; movingGeometry.computeVertexNormals();
  }
  function render() {
    if (disposed) return;
    current = sampleTimeline(elapsed, params);
    // Balance the closed single leaf, then gently release the offset as it opens.
    // The object starts in place; this is the changing centre of its footprint.
    const opening = current.cover ? current.progress * current.progress * (3 - 2 * current.progress) : 1;
    const openingOffset = -PAGE_WIDTH * .46 * (1 - opening) * params.scale;
    magazine.position.x = openingOffset;
    leftGroup.visible = !current.cover || current.progress > .55;
    contact.scale.x = current.cover ? .54 : 1;
    contact.position.x = openingOffset + (current.cover ? PAGE_WIDTH / 2 * params.scale : 0);
    contact.rotation.z = magazine.rotation.z;
    leftMaterial.map = art.spreads[current.spread].left;
    rightMaterial.map = art.spreads[Math.min(3, current.spread + (current.turning && !current.cover ? 1 : 0))].right;
    leaf.visible = current.turning;
    leaf.position.z = leftPage.position.z + .008 + params.thickness;
    if (current.turning) {
      frontMaterial.map = current.cover ? art.cover : art.spreads[current.spread].right;
      backMaterial.map = art.spreads[Math.min(3, current.cover ? 0 : current.spread + 1)].left;
      deform(current);
    }
    renderer.render(scene, camera); frameCount++;
    host.dataset.phase = current.phase; host.dataset.elapsed = elapsed.toFixed(4); host.dataset.frames = String(frameCount);
    host.dataset.activeProgress = current.progress.toFixed(4); host.dataset.paused = String(paused);
  }
  function publish() { report({ phase: current.phase, paused, elapsed: current.elapsed, total: current.total, progress: current.progress, fps, frames: frameCount, columns }); }
  function tick(time: number) {
    raf = 0;
    if (disposed || paused || document.hidden) { lastTime = null; return; }
    if (lastTime !== null) elapsed = Math.min(timelineDuration(params), elapsed + (time - lastTime) / 1000);
    lastTime = time;
    if (!fpsStart) fpsStart = time;
    fpsFrames++;
    if (time - fpsStart >= 500) { fps = fpsFrames * 1000 / (time - fpsStart); fpsFrames = 0; fpsStart = time; }
    if (elapsed >= timelineDuration(params)) paused = true;
    render();
    if (paused) { lastTime = null; publish(); return; }
    if (time - lastReport > 100) { publish(); lastReport = time; }
    raf = requestAnimationFrame(tick);
  }
  function wake() { if (!disposed && !paused && !document.hidden && !raf) raf = requestAnimationFrame(tick); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; lastTime = null; }
  function visibility() { if (document.hidden) stop(); else wake(); }
  function preference() { if (reduced.matches) controller.final(); }
  function contextLost(event: Event) { event.preventDefault(); controller.dispose(); failure("Контекст WebGL потерян. Повторите загрузку сцены."); }
  const resize = new ResizeObserver(() => { if (disposed) return; cameraFit(); render(); publish(); }); resize.observe(host);
  document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", preference); renderer.domElement.addEventListener("webglcontextlost", contextLost);
  const controller: SceneController = {
    update(next) {
      const durationChanged = next.flipDuration !== params.flipDuration || next.delay !== params.delay;
      const fraction = elapsed / timelineDuration(params);
      params = { ...next };
      // Duration tuning preserves normalized sequence position and current play/pause state.
      if (durationChanged) elapsed = fraction * timelineDuration(params);
      applyParams(); render(); publish(); wake();
    },
    replay() { stop(); elapsed = reduced.matches ? timelineDuration(params) : 0; paused = reduced.matches; fpsFrames = 0; fpsStart = 0; render(); publish(); wake(); },
    togglePause() { if (reduced.matches) return; if (elapsed >= timelineDuration(params)) { controller.replay(); return; } paused = !paused; stop(); render(); publish(); wake(); },
    final() { stop(); elapsed = timelineDuration(params); paused = true; render(); publish(); },
    reset() { params = { ...DEFAULT_PARAMS }; applyParams(); controller.replay(); },
    seek(fraction) { stop(); elapsed = Math.max(0, Math.min(1, fraction)) * timelineDuration(params); paused = true; render(); publish(); },
    dispose() {
      if (disposed) return; disposed = true; stop(); resize.disconnect();
      document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", preference); renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      debug.traverse(object => { if (object instanceof THREE.AxesHelper) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } });
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); art.dispose(); contactTexture.dispose();
      renderer.renderLists.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
  applyParams(); render(); publish(); wake();
  return controller;
}
