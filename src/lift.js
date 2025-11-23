// src/lift.js
import * as THREE from 'three';

export class LiftManager {
  constructor({ scene, getCurve, getAB, setAB, trailMax = 4000, trailMinStep = 0.01 }) {
    this.scene = scene;
    this.getCurve = getCurve; // () => curve or null
    this.getAB = getAB;       // () => ({ a, b })
    this.setAB = setAB;       // (a, b) => void

    // trail config
    this.trailMinStep = trailMinStep;
    this.trailCapacity = Math.max(1000, trailMax); // start capacity
    this.trailHardCap = 60000; // safety cap; raise if you want "bigger" trails

    // lifted midpoint marker (yellow)
    this.marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 20, 16),
      new THREE.MeshPhongMaterial({ color: 0xf1c40f })
    );
    this.marker.visible = false;
    scene.add(this.marker);

    // optional stem (ground midpoint -> lifted point)
    this.stem = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xf1c40f, transparent: true, opacity: 0.6 })
    );
    this.stem.visible = false;
    scene.add(this.stem);

    // trail (polyline) — now auto-growing
    this.trailGeom = new THREE.BufferGeometry();
    this.trailPositions = new Float32Array(this.trailCapacity * 3);
    this.trailCount = 0;
    this.trail = new THREE.Line(
      this.trailGeom,
      new THREE.LineBasicMaterial({ color: 0xf1c40f, transparent: true, opacity: 0.85 })
    );
    this.trail.visible = false;
    scene.add(this.trail);
    this._resetTrailAttribute();

    // animation state
    this.playing = false;
    this.speedA = 0.18; // cycles/sec
    this.speedB = 0.23; // cycles/sec
    this.lastPos = null;
  }

  // ---------- public controls ----------
  setPlaying(v) {
    this.playing = v;
    const hasCurve = !!this.getCurve();
    this.marker.visible = hasCurve;
    this.stem.visible = hasCurve && v;               // stem during play
    this.trail.visible = hasCurve && (this.trailCount > 0); // keep trail visible when paused
    if (!v) this.lastPos = null;
  }

  setSpeeds(speedA, speedB) {
    this.speedA = speedA;
    this.speedB = speedB;
  }

  clearTrail() {
    this.trailCount = 0;
    this._resetTrailAttribute();
    this.trail.visible = this.playing && !!this.getCurve();
    this.lastPos = null;
  }

  // ---------- internal helpers ----------
  _resetTrailAttribute() {
    this.trailGeom.setAttribute(
      'position',
      new THREE.BufferAttribute(this.trailPositions, 3)
    );
    this.trailGeom.setDrawRange(0, 0);
  }

  _ensureCapacity(nextCount) {
    if (nextCount <= this.trailCapacity) return;
    // grow (double) but clamp to hard cap
    const newCap = Math.min(this.trailCapacity * 2, this.trailHardCap);
    if (newCap === this.trailCapacity) return; // already at cap
    const newArr = new Float32Array(newCap * 3);
    newArr.set(this.trailPositions);
    this.trailPositions = newArr;
    this.trailCapacity = newCap;
    this._resetTrailAttribute();
  }

  _wrap01(t) {
    return ((t % 1) + 1) % 1;
  }

  _liftedFromAB(curve, a, b) {
    const P1 = curve.getPointAt(a).clone(); P1.y = 0;
    const P2 = curve.getPointAt(b).clone(); P2.y = 0;
    const M  = new THREE.Vector3().addVectors(P1, P2).multiplyScalar(0.5);
    const h  = P2.distanceTo(P1);
    const L  = M.clone().add(new THREE.Vector3(0, h, 0));
    return { M, L };
  }

  // ---------- frame update ----------
  update(dt) {
    const curve = this.getCurve();
    if (!curve) {
      this.marker.visible = false;
      this.trail.visible = false;
      this.stem.visible = false;
      return;
    }

    // advance a,b if playing
    let { a, b } = this.getAB();
    if (this.playing) {
      a = this._wrap01(a + this.speedA * dt);
      b = this._wrap01(b + this.speedB * dt);
      this.setAB(a, b); // sync red/blue + chord + ground midpoint
    }

    // compute lifted position
    const { M, L } = this._liftedFromAB(curve, a, b);

    // marker
    this.marker.position.copy(L);
    this.marker.visible = true;

    // stem: M -> L
    const stemPos = new Float32Array([M.x, M.y, M.z, L.x, L.y, L.z]);
    const stemGeo = new THREE.BufferGeometry();
    stemGeo.setAttribute('position', new THREE.BufferAttribute(stemPos, 3));
    this.stem.geometry.dispose();
    this.stem.geometry = stemGeo;
    this.stem.visible = this.playing;

    // trail
    if (this.playing) {
      if (!this.lastPos || this.lastPos.distanceTo(L) > this.trailMinStep) {
        // ensure capacity before appending
        this._ensureCapacity(this.trailCount + 1);

        // if we hit hard cap, drop oldest (FIFO) to avoid growth
        if (this.trailCount >= this.trailCapacity) {
          this.trailPositions.copyWithin(0, 3, this.trailCapacity * 3);
          this.trailCount = this.trailCapacity - 1;
        }

        // append new point
        this.trailPositions[this.trailCount * 3 + 0] = L.x;
        this.trailPositions[this.trailCount * 3 + 1] = L.y;
        this.trailPositions[this.trailCount * 3 + 2] = L.z;
        this.trailCount++;

        // update GPU buffer
        this.trailGeom.attributes.position.array = this.trailPositions;
        this.trailGeom.attributes.position.needsUpdate = true;
        this.trailGeom.setDrawRange(0, this.trailCount);

        this.trail.visible = true;
        this.lastPos = L.clone();
      }
    } else {
      // paused: keep any existing trail visible
      this.trail.visible = (this.trailCount > 0);
      this.lastPos = L.clone();
    }
  }
}

