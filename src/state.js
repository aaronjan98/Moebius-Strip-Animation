// src/state.js
const state = {
  // Step 2 (loop)
  drawingMode: true,

  // Step 3 (pair)
  a: 0.15,
  b: 0.65,

  // Step 4A (animation + lifted point + trail)
  playing: false,
  speedA: 0.18,       // cycles/sec for 'a'
  speedB: 0.23,       // cycles/sec for 'b'
  trailMax: 4000,     // initial capacity (will auto-grow now)
  trailMinStep: 0.01, // min world distance between samples

  // Step 4B (transparent surface)
  showSurface: false,
  resA: 400,          // <-- default resolution A
  resB: 400,          // <-- default resolution B
  surfaceOpacity: 0.35,
  wireframe: false,
};

export default state;

