// src/main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import state from './state.js';
import { LoopManager } from './loop.js';

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

// ----- GUI -----
const gui = new GUI({ title: 'Controls' });

const fLoop = gui.addFolder('1) Loop');

// keep a handle so we can toggle it programmatically
const drawingCtrl = fLoop.add(state, 'drawingMode')
  .name('Drawing Mode')
  .onChange(v => loops.enableDrawingMode(v));

fLoop.add(
  { closeAndSmooth: () => {
      // build the smooth loop
      loops.buildSmoothClosedCurve();
      // turn drawing mode OFF (updates checkbox + disables click handler)
      drawingCtrl.setValue(false);
    }
  },
  'closeAndSmooth'
).name('Close & Smooth');

fLoop.add(
  { autoGenerateLoop: () => {
      // ensure drawing mode is OFF, then generate
      drawingCtrl.setValue(false);
      loops.autoGenerateLoop();
    }
  },
  'autoGenerateLoop'
).name('Generate Random Loop');

fLoop.add(
  { clearLoop: () => {
      // clear visuals and turn drawing mode back ON
      loops.clearLoopGraphics();
      drawingCtrl.setValue(true);
    }
  },
  'clearLoop'
).name('Clear Loop');

fLoop.open();

// ----- resize / render loop -----
addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// For later steps you’ll import and wire more modules here (pair points, surface, etc.).

