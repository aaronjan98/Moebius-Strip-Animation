// src/lift.js
import * as THREE from 'three';

export class LiftManager {
  constructor({ scene, getCurve, getAB, setAB, trailMax = 4000, trailMinStep = 0.01 }) {
    this.scene = scene;
    this.getCurve = getCurve; // () => curve or null
    this.getAB = getAB;       // () => ({ a, b })
    this.setAB = setAB;       // (a, b) => void
    this.trailMax = trailMax;
    this.trailMinStep = trailMinStep;

    // lifted midpoint marker (yellow)
    this.marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 20, 16),
      new THREE.MeshPhongMaterial({ color: 0xf1c40f })
    );
    this.marker.visible = false;
    scene.add(this.marker);

    // optional “stem” line from ground midpoint up to lifted point
    this.stem = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xf1c40f, transparent: true, opacity: 0.6 })
    );
    this.stem.visible = false;
    scene.add(this.stem);

    // trail (polyline)
    this.trailGeom = new THREE.BufferGeometry();
    this.trailPositions = new Float32Array(this.trailMax * 3);
    this.trailCount = 0;
    this.trail = new THREE.Line(
      this.trailGeom,
      new THREE.LineBasicMaterial({ color: 0xf1c40f, transparent: true, opacity: 0.85 })
    );
    this.trail.visible = false;
    scene.add(this.trail);

    // animation state
    this.playing = false;
    this.speedA = 0.18; // cycles/sec
    this.speedB = 0.23; // cycles/sec
    this.lastPos = null;
  }

  setPlaying(v) {
    this.playing = v;
    const curve = this.getCurve();
    const on = !!curve;
    this.marker.visible = on;
    this.stem.visible = on && v;      // stem shown during play
    this.trail.visible = on && v;     // trail shown during play
    if (!v) this.lastPos = null;
  }
  setSpeeds(speedA, speedB) {
    this.speedA = speedA;
    this.speedB = speedB;
  }
  clearTrail() {
    this.trailCount = 0;
    this.trailGeom.setDrawRange(0, 0);
    this.trailGeom.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    this.trail.visible = this.playing && !!this.getCurve();
    this.lastPos = null;
  }

  // helper: wrap to [0,1)
  _wrap01(t) {
    return ((t % 1) + 1) % 1;
  }

  // compute lifted position from current a,b
  _liftedFromAB(curve, a, b) {
    const P1 = curve.getPointAt(a).clone(); P1.y = 0;
    const P2 = curve.getPointAt(b).clone(); P2.y = 0;

    // ground midpoint
    const M = new THREE.Vector3().addVectors(P1, P2).multiplyScalar(0.5);
    // chord length on ground
    const h = P2.distanceTo(P1);
    // lifted
    const L = M.clone().add(new THREE.Vector3(0, h, 0));

    return { P1, P2, M, L, h };
  }

  // update per frame
  update(dt) {
    const curve = this.getCurve();
    if (!curve) { this.marker.visible = false; this.trail.visible = false; this.stem.visible = false; return; }

    // advance a,b if playing
    let { a, b } = this.getAB();
    if (this.playing) {
      a = this._wrap01(a + this.speedA * dt);
      b = this._wrap01(b + this.speedB * dt);
      this.setAB(a, b); // drive the visible red/blue points + chord + ground midpoint
    }

    // compute lifted geometry
    const { M, L, h } = this._liftedFromAB(curve, a, b);

    // place marker
    this.marker.position.copy(L);
    this.marker.visible = true;

    // update stem (line from M to L)
    const stemPos = new Float32Array([M.x, M.y, M.z, L.x, L.y, L.z]);
    const stemGeo = new THREE.BufferGeometry();
    stemGeo.setAttribute('position', new THREE.BufferAttribute(stemPos, 3));
    this.stem.geometry.dispose();
    this.stem.geometry = stemGeo;
    this.stem.visible = this.playing; // visible during play

    // trail update
    if (this.playing) {
      if (!this.lastPos || this.lastPos.distanceTo(L) > this.trailMinStep) {
        if (this.trailCount >= this.trailMax) {
          // shift left by one vertex (O(n), fine at a few thousand)
          this.trailPositions.copyWithin(0, 3, this.trailMax * 3);
          this.trailCount = this.trailMax - 1;
        }
        this.trailPositions[this.trailCount*3 + 0] = L.x;
        this.trailPositions[this.trailCount*3 + 1] = L.y;
        this.trailPositions[this.trailCount*3 + 2] = L.z;
        this.trailCount++;

        this.trailGeom.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
        this.trailGeom.setDrawRange(0, this.trailCount);
        this.trailGeom.attributes.position.needsUpdate = true;
        this.trail.visible = true;
        this.lastPos = L.clone();
      }
    }
  }
}

