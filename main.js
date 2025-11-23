import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls so you can rotate the scene
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Add a simple light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// Example: draw a unit circle loop (approximation)
const loopPoints = [];
const segments = 128;
for (let i = 0; i <= segments; i++) {
  const theta = (i / segments) * Math.PI * 2;
  loopPoints.push(new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0));
}
const loopGeometry = new THREE.BufferGeometry().setFromPoints(loopPoints);
const loopMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
const loopLine = new THREE.Line(loopGeometry, loopMaterial);
scene.add(loopLine);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

