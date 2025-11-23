// src/main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import state from './state.js';
import { LoopManager } from './loop.js';
import { PairManager } from './pair.js';

// ----- scene / camera / renderer -----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 200);
camera.position.set(10, 12, 20); // your preferred start
camera.lookAt(0,0,0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0,0,0);
controls.update();
controls.maxDistance = 60;
controls.minDistance = 2.5;

// lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(6, 10, 8);
scene.add(dir);

// ground grid (fine + coarse)
const size = 20;
const fineGrid = new THREE.GridHelper(size, 40, 0x303030, 0x202020);
fineGrid.position.y = 0;
scene.add(fineGrid);

const coarseGrid = new THREE.GridHelper(size, 8, 0xaaaaaa, 0x888888);
coarseGrid.position.y = 0.001; // avoid z-fighting
scene.add(coarseGrid);

// ----- modules -----
const loops = new LoopManager({ scene, camera, renderer });
loops.enableDrawingMode(state.drawingMode);

const pair = new PairManager({ scene });

// ----- GUI -----
const gui = new GUI({ title: 'Controls' });

// Loop folder (same as before but now also updates the pair module)
const fLoop = gui.addFolder('1) Loop');

const drawingCtrl = fLoop.add(state, 'drawingMode')
  .name('Drawing Mode')
  .onChange(v => loops.enableDrawingMode(v));

fLoop.add(
  { closeAndSmooth: () => {
      loops.buildSmoothClosedCurve();
      drawingCtrl.setValue(false);
      // hand the new curve to the pair module
      pair.useLoop(loops.getCurve());
    }
  },
  'closeAndSmooth'
).name('Close & Smooth');

fLoop.add(
  { autoGenerateLoop: () => {
      drawingCtrl.setValue(false);
      loops.autoGenerateLoop();
      pair.useLoop(loops.getCurve());
    }
  },
  'autoGenerateLoop'
).name('Generate Random Loop');

fLoop.add(
  { clearLoop: () => {
      loops.clearLoopGraphics();
      drawingCtrl.setValue(true);
      // remove curve from pair module
      pair.useLoop(null);
    }
  },
  'clearLoop'
).name('Clear Loop');

fLoop.open();

// Pair folder — sliders for a and b
const fPair = gui.addFolder('2) Pair (a,b)');
fPair.add(state, 'a', 0, 1, 0.001).name('a (0..1)').onChange(v => pair.setParameters(v, state.b));
fPair.add(state, 'b', 0, 1, 0.001).name('b (0..1)').onChange(v => pair.setParameters(state.a, v));
fPair.open();

// ----- resize / render loop -----
addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);

  // let the pair module update its fat-line resolution
  pair.handleResize();
});

function animate(){
  requestAnimationFrame(animate);
  // keep pair markers updated if the loop exists
  pair.updateGraphics();
  controls.update();
  renderer.render(scene, camera);
}
animate();

// For later steps you’ll import and wire more modules here (pair points, surface, etc.).

