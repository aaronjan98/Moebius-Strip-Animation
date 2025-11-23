// src/state.js
const state = {
  // Step 2 (loop)
  drawingMode: true,

  // Step 3 (pair)
  a: 0.15,
  b: 0.65,

  // Step 4A (animation + lifted point + trail)
  playing: false,
  speedA: 0.18,     // cycles/sec for 'a'
  speedB: 0.23,     // cycles/sec for 'b'
  trailMax: 4000,
  trailMinStep: 0.01,

  // Step 4B (transparent surface)
  showSurface: false,
  resA: 160,        // samples along a in [0,1)
  resB: 160,        // samples along b in [0,1)
  surfaceOpacity: 0.35,
  wireframe: false,
};

export default state;
