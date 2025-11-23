// src/band.js
import * as THREE from 'three';

export class BandManager {
  constructor({ scene }) {
    this.scene = scene;
    this.curve = null;
    this.mesh = null;
    this.width = 0.8;
    this.M = 400;
    this.S = 48;
  }

  useLoop(curve) {
    this.curve = curve || null;
    if (!this.curve) {
      if (this.mesh) { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.mesh = null; }
      return;
    }
    // If showing, (re)build to match the new loop
    if (this.mesh) this.rebuild(this.width, this.M, this.S);
  }

  setVisible(v) {
    if (this.mesh) this.mesh.visible = v;
  }

  rebuild(width, M, S) {
    if (!this.curve) return;
    this.width = width; this.M = M; this.S = S;

    const positions = new Float32Array((M+1)*(S+1)*3);
    const indices = [];

    const up = new THREE.Vector3(0, 1, 0);

    let ptr = 0;
    for (let i = 0; i <= M; i++) {
      const m = i / M;
      const base = this.curve.getPointAt(m).clone(); base.y = 0;

      // tangent (XZ) and in-plane normal (rotate +90° about Y)
      const tan = this.curve.getTangentAt ? this.curve.getTangentAt(m) : this._tangentFD(m);
      tan.y = 0; tan.normalize();
      const nXY = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

      // half-twist frame: cos(πm)*nXY + sin(πm)*up
      const dir = nXY.clone().multiplyScalar(Math.cos(Math.PI*m))
                  .add(up.clone().multiplyScalar(Math.sin(Math.PI*m)))
                  .normalize();

      for (let j = 0; j <= S; j++) {
        const s = j / S;                 // 0..1 across band
        const across = (2*s - 1) * (width/2);
        const v = base.clone().add(dir.clone().multiplyScalar(across));
        positions[ptr++] = v.x;
        positions[ptr++] = v.y;
        positions[ptr++] = v.z;
      }
    }

    for (let i = 0; i < M; i++) {
      for (let j = 0; j < S; j++) {
        const a = i*(S+1) + j;
        const b = (i+1)*(S+1) + j;
        const c = a + 1;
        const d = b + 1;
        indices.push(a,b,c, b,d,c);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const mat = new THREE.MeshPhongMaterial({
      color: 0x3d5afe, transparent: true, opacity: 0.30, side: THREE.DoubleSide
    });

    if (this.mesh) { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
    this.mesh = new THREE.Mesh(geom, mat);
    this.scene.add(this.mesh);
  }

  _tangentFD(m) {
    const eps = 1e-4;
    const a = this.curve.getPointAt((m - eps + 1) % 1);
    const b = this.curve.getPointAt((m + eps) % 1);
    const t = b.clone().sub(a); t.y = 0; return t.normalize();
  }
}

