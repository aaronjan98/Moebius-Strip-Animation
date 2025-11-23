// src/pair.js
import * as THREE from 'three';

export class PairManager {
  constructor({ scene }) {
    this.scene = scene;
    this.curve = null;   // THREE.CatmullRomCurve3 from LoopManager

    // point markers
    this.p1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 20, 16),
      new THREE.MeshPhongMaterial({ color: 0xe74c3c })
    );
    this.p2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 20, 16),
      new THREE.MeshPhongMaterial({ color: 0x3498db })
    );
    this.mid = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 20, 16),
      new THREE.MeshPhongMaterial({ color: 0xf1c40f })
    );
    this.p1.visible = this.p2.visible = this.mid.visible = false;
    scene.add(this.p1, this.p2, this.mid);

    // Chord as a cylinder (robust "thicker line")
    this.chord = null;               // THREE.Mesh
    this.chordRadius = 0.035;        // adjust thickness here
    this.chordMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });

    // cached params
    this.a = 0.15;
    this.b = 0.65;
  }

  useLoop(curve) {
    this.curve = curve || null;
    const on = !!this.curve;
    this.p1.visible = this.p2.visible = this.mid.visible = on;
    if (this.chord) this.chord.visible = on;
    if (on) this.updateGraphics();
  }

  setParameters(a, b) {
    // keep in [0,1)
    this.a = ((a % 1) + 1) % 1;
    this.b = ((b % 1) + 1) % 1;
    this.updateGraphics();
  }

  // compute midpoint m and shortest separation s (in [0, 0.5]) — kept for later use
  _midSep(a, b) {
    let raw = (b - a + 1) % 1;   // in [0,1)
    let s = raw;
    if (s > 0.5) s = 1 - s;      // shortest wrap
    const m = ((a + b) / 2) % 1;
    return { m: (m + 1) % 1, s }; // normalize m ∈ [0,1)
  }

  _ensureChordMesh() {
    if (!this.chord) {
      // initial tiny cylinder; we’ll replace geometry each update with correct length
      const g = new THREE.CylinderGeometry(this.chordRadius, this.chordRadius, 1, 20);
      this.chord = new THREE.Mesh(g, this.chordMat);
      this.chord.visible = false;
      this.scene.add(this.chord);
    }
  }

  updateGraphics() {
    if (!this.curve) return;

    // points on loop (ground plane y=0)
    const P1 = this.curve.getPointAt(this.a);
    const P2 = this.curve.getPointAt(this.b);
    P1.y = 0; P2.y = 0;

    this.p1.position.copy(P1);
    this.p2.position.copy(P2);

    // Midpoint should be on the chord: average of P1 and P2
    const PM = new THREE.Vector3().addVectors(P1, P2).multiplyScalar(0.5);
    this.mid.position.copy(PM);

    // Chord as cylinder between P1 and P2
    this._ensureChordMesh();

    const dir = new THREE.Vector3().subVectors(P2, P1);
    const length = dir.length();
    if (length < 1e-6) {
      this.chord.visible = false;
      return;
    }

    // Replace geometry to match the current length
    if (this.chord.geometry) this.chord.geometry.dispose();
    this.chord.geometry = new THREE.CylinderGeometry(this.chordRadius, this.chordRadius, length, 20);

    // Orient cylinder: default cylinder axis is +Y; rotate to align with dir
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
    this.chord.setRotationFromQuaternion(quat);

    // Position at midpoint
    this.chord.position.copy(PM);
    this.chord.visible = true;
  }
}

