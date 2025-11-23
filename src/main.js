// src/main.js — with trail persistence + reset on loop changes
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

import state from './state.js';
import { LoopManager } from './loop.js';
import { PairManager } from './pair.js';
import { LiftManager } from './lift.js';

// ---------- Scene / Camera / Renderer ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);
camera.position.set(10, 12, 20);
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
controls.maxDistance = 60;
controls.minDistance = 2.5;

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(6, 10, 8);
scene.add(dir);

// Ground grid (fine + coarse)
const size = 20;
const fineGrid = new THREE.GridHelper(size, 40, 0x303030, 0x202020);
fineGrid.position.y = 0;
scene.add(fineGrid);

const coarseGrid = new THREE.GridHelper(size, 8, 0xaaaaaa, 0x888888);
coarseGrid.position.y = 0.001; // avoid z-fighting
scene.add(coarseGrid);

// ---------- Modules ----------
const loops = new LoopManager({ scene, camera, renderer });
loops.enableDrawingMode(state.drawingMode);

const pair = new PairManager({ scene });

const lift = new LiftManager({
  scene,
  getCurve: () => loops.getCurve(),
  getAB: () => ({ a: state.a, b: state.b }),
  setAB: (a, b) => {
    state.a = a; state.b = b;
    pair.setParameters(a, b); // keep ground visuals synced
  },
  trailMax: state.trailMax,
  trailMinStep: state.trailMinStep,
});

// ---------- GUI ----------
const gui = new GUI({ title: 'Controls' });

// 1) Loop
const fLoop = gui.addFolder('1) Loop');
const drawingCtrl = fLoop.add(state, 'drawingMode')
  .name('Drawing Mode')
  .onChange(v => loops.enableDrawingMode(v));

fLoop.add({
  closeAndSmooth: () => {
    // reset old trail when building a fresh loop
    lift.clearTrail();
    loops.buildSmoothClosedCurve();
    drawingCtrl.setValue(false);
    pair.useLoop(loops.getCurve());
    lift.setPlaying(state.playing); // show/hide lifted marker based on Play
  }
}, 'closeAndSmooth').name('Close & Smooth');

fLoop.add({
  autoGenerateLoop: () => {
    drawingCtrl.setValue(false);
    // reset trail when generating a new loop
    lift.clearTrail();
    loops.autoGenerateLoop();
    pair.useLoop(loops.getCurve());
    lift.setPlaying(state.playing);
  }
}, 'autoGenerateLoop').name('Generate Random Loop');

fLoop.add({
  clearLoop: () => {
    // reset trail when clearing the loop
    lift.clearTrail();
    loops.clearLoopGraphics();
    drawingCtrl.setValue(true);
    pair.useLoop(null);
    lift.setPlaying(false);
  }
}, 'clearLoop').name('Clear Loop');

fLoop.open();

// 2) Pair (a,b)
const fPair = gui.addFolder('2) Pair (a,b)');
fPair.add(state, 'a', 0, 1, 0.001).name('a (0..1)').onChange(v => pair.setParameters(v, state.b));
fPair.add(state, 'b', 0, 1, 0.001).name('b (0..1)').onChange(v => pair.setParameters(state.a, v));
fPair.open();

// 3) Animation (lifted midpoint + trail)
const fAnim = gui.addFolder('3) Animation');
fAnim.add(state, 'playing').name('Play / Pause').onChange(v => lift.setPlaying(v));
fAnim.add(state, 'speedA', 0.01, 1.0, 0.01).name('Speed a (cycles/s)').onChange(() => lift.setSpeeds(state.speedA, state.speedB));
fAnim.add(state, 'speedB', 0.01, 1.0, 0.01).name('Speed b (cycles/s)').onChange(() => lift.setSpeeds(state.speedA, state.speedB));
fAnim.add({ clearTrail: () => lift.clearTrail() }, 'clearTrail').name('Clear Trail');
fAnim.open();

// ---------- Resize & Animate ----------
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let last = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.max(0, (now - last) / 1000);
  last = now;

  pair.updateGraphics();
  lift.update(dt);

  controls.update();
  renderer.render(scene, camera);
}
animate();

