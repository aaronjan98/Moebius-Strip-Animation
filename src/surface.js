// src/surface.js
import * as THREE from 'three';

export class SurfaceManager {
  constructor({ scene }) {
    this.scene = scene;
    this.curve = null;
    this.mesh = null;
    this.material = null;

    // cache last built params to avoid unnecessary rebuilds
    this._last = { resA: 0, resB: 0, opacity: 0.35, wireframe: false };
  }

  useLoop(curve) {
    this.curve = curve || null;
    if (!this.curve) {
      this._disposeMesh();
      return;
    }
    // no auto-rebuild here; main.js will call rebuild with current state
  }

  setVisible(v) {
    if (this.mesh) this.mesh.visible = v;
  }

  rebuild({ resA, resB, opacity = 0.35, wireframe = false }) {
    if (!this.curve) {
      this._disposeMesh();
      return;
    }
    // short-circuit if identical params
    const L = this._last;
    if (this.mesh && L.resA === resA && L.resB === resB && L.opacity === opacity && L.wireframe === wireframe) {
      return;
    }
    this._last = { resA, resB, opacity, wireframe };

    const nx = Math.max(2, Math.floor(resA));
    const ny = Math.max(2, Math.floor(resB));

    // positions
    const positions = new Float32Array((nx + 1) * (ny + 1) * 3);
    let ptr = 0;

    // sample grid (a in x-direction, b in y-direction)
    for (let iy = 0; iy <= ny; iy++) {
      const b = iy / ny;
      for (let ix = 0; ix <= nx; ix++) {
        const a = ix / nx;

        const P1 = this.curve.getPointAt(a).clone(); P1.y = 0;
        const P2 = this.curve.getPointAt(b).clone(); P2.y = 0;
        const M  = P1.clone().add(P2).multiplyScalar(0.5);
        const h  = P2.distanceTo(P1);
        const Lp = M.add(new THREE.Vector3(0, h, 0));

        positions[ptr++] = Lp.x;
        positions[ptr++] = Lp.y;
        positions[ptr++] = Lp.z;
      }
    }

    // build indices (two triangles per quad)
    const indices = new Uint32Array(nx * ny * 6);
    let ip = 0;
    const row = (iy) => iy * (nx + 1);
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        const a = row(iy) + ix;
        const b = row(iy + 1) + ix;
        const c = a + 1;
        const d = b + 1;
        // tri1: a, b, c; tri2: b, d, c
        indices[ip++] = a; indices[ip++] = b; indices[ip++] = c;
        indices[ip++] = b; indices[ip++] = d; indices[ip++] = c;
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    geom.computeVertexNormals();

    const mat = new THREE.MeshPhongMaterial({
      color: 0x3b82f6, // blue-ish
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
      wireframe: wireframe,
    });

    this._disposeMesh();
    this.material = mat;
    this.mesh = new THREE.Mesh(geom, mat);
    this.scene.add(this.mesh);
  }

  _disposeMesh() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
  }
}

