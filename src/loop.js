// src/loop.js
import * as THREE from 'three';

export class LoopManager {
  constructor({ scene, camera, renderer }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    // storage
    this.ctrlPoints = [];     // clicked points (Vector3 on y=0 ground plane)
    this.ctrlMarkers = [];    // small spheres for those points (only in manual mode)
    this.polyLine = null;     // construction polyline through clicks
    this.loopCurve = null;    // THREE.CatmullRomCurve3 (closed)
    this.loopLine = null;     // rendered smooth closed loop (Line)

    // click handler (bind so we can add/remove)
    this._onPointerDown = this._onPointerDown.bind(this);
  }

  // Enable/disable manual drawing via clicks
  enableDrawingMode(enabled) {
    const dom = this.renderer.domElement;
    if (enabled) {
      dom.addEventListener('pointerdown', this._onPointerDown);
    } else {
      dom.removeEventListener('pointerdown', this._onPointerDown);
    }
  }

  // --- pointer → ground plane y=0
  _onPointerDown(e) {
    const p = this._screenToGround(e.clientX, e.clientY);
    if (!p) return;
    p.y = 0; // snap to ground
    this.ctrlPoints.push(p.clone());
    this._addControlMarker(p);
    this._drawControlPolyline();
  }

  _screenToGround(x, y) {
    const ndc = new THREE.Vector2(
      (x / window.innerWidth) * 2 - 1,
      -(y / window.innerHeight) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    // Plane with normal +Y through origin → ground plane y=0
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    const ok = ray.ray.intersectPlane(ground, hit);
    return ok ? hit : null;
  }

  // --- construction visuals (only during manual drawing)
  _addControlMarker(pos) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 12),
      new THREE.MeshPhongMaterial({ color: 0xffffff })
    );
    m.position.copy(pos);
    this.scene.add(m);
    this.ctrlMarkers.push(m);
  }

  _drawControlPolyline() {
    if (this.polyLine) {
      this.scene.remove(this.polyLine);
      this.polyLine.geometry.dispose();
      this.polyLine.material.dispose();
      this.polyLine = null;
    }
    if (this.ctrlPoints.length < 2) return;

    const geom = new THREE.BufferGeometry().setFromPoints(this.ctrlPoints);
    const mat = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
    this.polyLine = new THREE.Line(geom, mat);
    this.scene.add(this.polyLine);
  }

  // --- destroy construction aids (markers + polyline), keep the smooth loop
  _clearConstructionAidsOnly() {
    if (this.polyLine) {
      this.scene.remove(this.polyLine);
      this.polyLine.geometry.dispose();
      this.polyLine.material.dispose();
      this.polyLine = null;
    }
    this.ctrlMarkers.forEach(m => {
      this.scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    this.ctrlMarkers = [];
  }

  // --- full reset (also deletes the smooth loop)
  clearLoopGraphics() {
    this._clearConstructionAidsOnly();
    if (this.loopLine) {
      this.scene.remove(this.loopLine);
      this.loopLine.geometry.dispose();
      this.loopLine.material.dispose();
      this.loopLine = null;
    }
    this.ctrlPoints = [];
    this.loopCurve = null;
  }

  // --- build a smooth closed curve on ground (y=0) from current ctrlPoints
  buildSmoothClosedCurve() {
    if (this.ctrlPoints.length < 3) return;

    // Catmull–Rom (centripetal), closed. All points had y=0, so the curve lies in y=0.
    this.loopCurve = new THREE.CatmullRomCurve3(
      this.ctrlPoints, true, 'centripetal', 0.5
    );

    // render the smooth loop as a polyline (white)
    if (this.loopLine) {
      this.scene.remove(this.loopLine);
      this.loopLine.geometry.dispose();
      this.loopLine.material.dispose();
      this.loopLine = null;
    }
    const N = 600;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const v = this.loopCurve.getPointAt(t);
      v.y = 0; // enforce ground plane
      pts.push(v);
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
    this.loopLine = new THREE.Line(g, mat);
    this.scene.add(this.loopLine);

    // remove markers + construction polyline now that we have the smooth loop
    this._clearConstructionAidsOnly();
  }

  // --- generate a random closed loop directly (no markers, no construction polyline)
  autoGenerateLoop() {
    this.clearLoopGraphics(); // start clean

    const N = 10;        // number of control points
    const R = 4.0;       // base radius
    this.ctrlPoints = [];
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const ang = 2*Math.PI*t + (Math.random()*0.5 - 0.25);
      const r = R * (0.75 + Math.random()*0.35);
      const x = r * Math.cos(ang);
      const z = r * Math.sin(ang);
      this.ctrlPoints.push(new THREE.Vector3(x, 0, z)); // y=0 ground
    }

    // Directly build the smooth, closed curve (no dots/lines shown)
    this.buildSmoothClosedCurve();
    // (ctrlPoints kept if you need them later for editing; remove if not)
  }

  // expose the curve to other modules (pair points, band, etc.)
  getCurve() {
    return this.loopCurve; // may be null if not built yet
  }
}

