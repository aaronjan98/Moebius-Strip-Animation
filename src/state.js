// src/state.js
const state = {
  // Step 2 (loop)
  drawingMode: true,

  // Step 3 (pair)
  a: 0.15,
  b: 0.65,

  // Step 4A (animation + lifted point + trail)
  playing: false,
  speedA: 0.18,   // cycles/sec for 'a'
  speedB: 0.23,   // cycles/sec for 'b' (use different vals for rich coverage)
  trailMax: 4000, // max samples in trail buffer
  trailMinStep: 0.01, // min world distance between samples
};

export default state;

