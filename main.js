// main.js — Step 1 (dark mode + nicer grid + angled camera)
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// Scene, camera, renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // dark

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 200);
camera.position.set(10, 12, 20);          // angled and pulled back
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();
controls.maxDistance = 50;   // optional: prevent flying too far out
controls.minDistance = 2;    // optional: prevent zooming through the grid

// Lights (subtle; we'll add more later if needed)
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(6, 10, 8);
scene.add(dir);

// --------- Nicer "thicker" grid: fine + coarse to fake thickness ----------
// Default GridHelper lies on the XZ plane at y=0 (ground).
const size = 20;

// Fine grid (faint)
const fineDiv = 40;
const fineGrid = new THREE.GridHelper(size, fineDiv, 0x303030, 0x202020); // dark greys
fineGrid.position.y = 0;
scene.add(fineGrid);

// Coarse grid (brighter, slightly lifted to avoid z-fighting)
const coarseDiv = 8;
const coarseGrid = new THREE.GridHelper(size, coarseDiv, 0xaaaaaa, 0x888888);
coarseGrid.position.y = 0.001; // tiny lift so lines don't flicker
scene.add(coarseGrid);

// GUI shell (empty folders for upcoming steps)
const state = {
  // Step 2 (loop)
  drawingMode: true,
  autoGenerateLoop: () => {},
  closeAndSmooth: () => {},
  // Step 3 (pair)
  a: 0.1, b: 0.6,
  // Step 4 (surface)
  buildSurface: () => {},
  removeSurface: () => {},
  width: 0.8, M: 400, S: 40
};

const gui = new GUI({ title: 'Controls' });
gui.addFolder('1) Loop').open();
gui.addFolder('2) Pair (a,b)').open();
gui.addFolder('3) Surface').open();

// Resize
addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Animate
function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

