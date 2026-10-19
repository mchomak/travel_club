import * as THREE from "three";
import { deformPage, DEFAULT_SHAPE, PAGE_HEIGHT, PAGE_WIDTH } from "../test_7/deformation";

/** Owns exactly one textured leaf and its finite 1000 ms reading motion. */
export function createReadingTurn(host: HTMLElement, source: HTMLCanvasElement, target: HTMLCanvasElement, direction: number, complete: () => void, interrupted = complete): () => void {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.setClearColor(0, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-PAGE_WIDTH, PAGE_WIDTH, PAGE_HEIGHT / 2, -PAGE_HEIGHT / 2, .1, 25);
  camera.position.set(0, 0, 10); camera.lookAt(0, 0, 0);
  const columns = 64, rows = 16, count = (columns + 1) * (rows + 1);
  const geometry = new THREE.BufferGeometry(), positions = new Float32Array(count * 2 * 3), uv = new Float32Array(count * 2 * 2);
  const faces: number[] = [], backs: number[] = [];
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    const i = row * (columns + 1) + col;
    uv[i * 2] = direction > 0 ? col / columns : 1 - col / columns; uv[i * 2 + 1] = row / rows;
    uv[(i + count) * 2] = 1 - uv[i * 2]; uv[(i + count) * 2 + 1] = row / rows;
    if (row < rows && col < columns) {
      const a = i, b = a + 1, c = a + columns + 1, d = c + 1;
      faces.push(a, b, c, b, d, c); backs.push(a + count, c + count, b + count, b + count, c + count, d + count);
    }
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage)); geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex([...faces, ...backs]); geometry.addGroup(0, faces.length, 0); geometry.addGroup(faces.length, backs.length, 1);
  const textures = [source, target].map(canvas => {
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return texture;
  });
  const materials = textures.map(map => new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: "#ffffff", emissiveIntensity: 0, roughness: 1, metalness: 0 }));
  const leaf = new THREE.Mesh(geometry, materials); leaf.scale.x = direction; leaf.castShadow = true; leaf.frustumCulled = false; scene.add(leaf);
  const receiverGeometry = new THREE.PlaneGeometry(PAGE_WIDTH * 2, PAGE_HEIGHT), shadowMaterial = new THREE.ShadowMaterial({ opacity: .3, depthWrite: false });
  const receiver = new THREE.Mesh(receiverGeometry, shadowMaterial); receiver.receiveShadow = true; receiver.position.z = -.006; scene.add(receiver);
  scene.add(new THREE.HemisphereLight("#ffffff", "#d4d0c6", 2.2));
  const light = new THREE.DirectionalLight("#ffffff", 1.35); light.position.set(-3, 4, 9); light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024); Object.assign(light.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: .5, far: 20 });
  light.shadow.bias = -.00015; light.shadow.normalBias = .005; light.shadow.radius = 3; scene.add(light);
  let disposed = false, frame = 0, elapsed = 0, previous: number | null = null;
  function render(progress: number) {
    // Flat printed endpoints must use the exact snapshot colors. Lighting is
    // blended in only while the sheet bends, so removing it cannot flash.
    const edge = Math.min(1, Math.min(progress, 1 - progress) * 8);
    const lit = edge * edge * (3 - 2 * edge);
    materials.forEach(material => { material.color.setScalar(lit); material.emissiveIntensity = 1 - lit; });
    shadowMaterial.opacity = .3 * lit;
    const centers = deformPage(progress, { ...DEFAULT_SHAPE, bend: 2.4, curl: 1.05, stiffness: .18 }, columns, rows);
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const col = i % (columns + 1), row = Math.floor(i / (columns + 1));
      const a = (row * (columns + 1) + Math.max(0, col - 1)) * 3, b = (row * (columns + 1) + Math.min(columns, col + 1)) * 3;
      const dx = centers[b] - centers[a], dz = centers[b + 2] - centers[a + 2], length = Math.hypot(dx, dz);
      for (let face = 0; face < 2; face++) {
        const thickness = face ? -.001 : .001;
        position.setXYZ(i + face * count, centers[i * 3] - dz / length * thickness, centers[i * 3 + 1], centers[i * 3 + 2] + dx / length * thickness + .004);
      }
    }
    position.needsUpdate = true; geometry.computeVertexNormals(); renderer.render(scene, camera);
    const row = Math.floor(rows / 2) * (columns + 1), root = row * 3, tip = (row + columns) * 3;
    const tx = centers[tip], tz = centers[tip + 2], length = Math.hypot(tx, tz);
    let curvature = 0;
    for (let col = 1; col < columns; col++) {
      const offset = (row + col) * 3;
      curvature = Math.max(curvature, Math.abs(tx * centers[offset + 2] - tz * centers[offset]) / (length || 1));
    }
    if (progress === 1) {
      const bounds = host.getBoundingClientRect();
      const corners = [0, columns, rows * (columns + 1) + columns, rows * (columns + 1)].map(i => {
        const point = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i)).applyMatrix4(leaf.matrixWorld).project(camera);
        return { x: bounds.left + (point.x + 1) * bounds.width / 2, y: bounds.top + (1 - point.y) * bounds.height / 2 };
      });
      const expectedLeft = bounds.left + (direction > 0 ? 0 : bounds.width / 2);
      const xs = corners.map(point => point.x), ys = corners.map(point => point.y);
      const error = Math.max(Math.abs(Math.min(...xs) - expectedLeft), Math.abs(Math.max(...xs) - expectedLeft - bounds.width / 2), Math.abs(Math.min(...ys) - bounds.top), Math.abs(Math.max(...ys) - bounds.bottom));
      const root = host.closest<HTMLElement>("main"); if (root) root.dataset.readingEndpoint = JSON.stringify({ error, curvature, corners });
    }
    host.dataset.progress = progress.toFixed(4);
    host.dataset.geometry = JSON.stringify({ curvature, spineError: Math.hypot(centers[root], centers[root + 2]), vertexCount: count * 2, tip: [direction * tx, tz] });
  }
  function dispose() {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", visibility); renderer.domElement.removeEventListener("webglcontextlost", lost);
    geometry.dispose(); receiverGeometry.dispose(); materials.forEach(material => material.dispose()); shadowMaterial.dispose(); textures.forEach(texture => texture.dispose());
    light.shadow.map?.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
  }
  function lost(event: Event) { event.preventDefault(); if (!disposed) interrupted(); }
  function tick(now: number) {
    if (disposed) return;
    if (previous !== null) elapsed += now - previous;
    previous = now; const progress = Math.min(1, elapsed / 1000); render(progress);
    if (progress === 1) { complete(); return; }
    frame = requestAnimationFrame(tick);
  }
  function visibility() { cancelAnimationFrame(frame); previous = null; if (!document.hidden && !disposed) frame = requestAnimationFrame(tick); }
  renderer.domElement.addEventListener("webglcontextlost", lost); document.addEventListener("visibilitychange", visibility);
  try { render(0); } catch (error) { dispose(); throw error; }
  host.appendChild(renderer.domElement); host.dataset.readingTurn = "webgl";
  const sample = (canvas: HTMLCanvasElement) => [...canvas.getContext("2d")!.getImageData(Math.floor(canvas.width * .2), Math.floor(canvas.height * .2), 1, 1).data];
  host.dataset.textureColors = JSON.stringify({ front: sample(source), back: sample(target) });
  if (!document.hidden) frame = requestAnimationFrame(tick);
  return dispose;
}

