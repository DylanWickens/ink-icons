import * as THREE from 'three/webgpu';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { inkMaterial, solidInk } from '../ink/inkMaterial.js';

// Small building blocks shared by the icons.

export const V3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);

export const RB = (w, h, d, r = 0.12, segments = 5) => new RoundedBoxGeometry(w, h, d, segments, r);

export function mesh(geo, x = 0, y = 0, z = 0, material = inkMaterial) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  return m;
}

// A drawn stroke as a 3D tube with rounded ends (checks, envelope flap).
export function inkTube(points, r = 0.09, z = 0) {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => V3(x, y, z)), false, 'centripetal');
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, r, 12, false), inkMaterial));
  const cap = new THREE.SphereGeometry(r, 16, 12);
  g.add(mesh(cap, ...curve.getPoint(0).toArray()));
  g.add(mesh(cap, ...curve.getPoint(1).toArray()));
  return g;
}

export const check = (cx, cy, s = 1, z = 0, r = 0.09) =>
  inkTube([[cx - 0.3 * s, cy + 0.02 * s], [cx - 0.08 * s, cy - 0.2 * s], [cx + 0.34 * s, cy + 0.24 * s]], r, z);

export function plus(s = 1, z = 0) {
  const g = new THREE.Group();
  g.add(mesh(RB(0.75 * s, 0.2 * s, 0.2 * s, 0.08 * s, 4), 0, 0, z));
  g.add(mesh(RB(0.2 * s, 0.75 * s, 0.2 * s, 0.08 * s, 4), 0, 0, z));
  return g;
}

// Speech bubble: rounded rect with a tail off the bottom-left.
export function bubbleGeometry() {
  const x0 = -1.1, x1 = 1.1, y0 = -0.75, y1 = 0.75, r = 0.3;
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y1); s.lineTo(x1 - r, y1); s.quadraticCurveTo(x1, y1, x1, y1 - r);
  s.lineTo(x1, y0 + r); s.quadraticCurveTo(x1, y0, x1 - r, y0);
  s.lineTo(x0 + 0.7, y0); s.lineTo(x0 + 0.08, y0 - 0.5); s.lineTo(x0, y0 + 0.15);
  s.lineTo(x0, y1 - r); s.quadraticCurveTo(x0, y1, x0 + r, y1);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.3, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 4, curveSegments: 16,
  });
  geo.translate(0, 0, -0.15);
  return geo;
}

export function lockBody(keyhole) {
  const g = new THREE.Group();
  g.add(mesh(RB(1.8, 1.45, 0.75, 0.2, 6), 0, 0.72, 0));
  g.add(mesh(new THREE.TorusGeometry(0.56, 0.15, 24, 48, Math.PI), 0, 1.8, 0));
  const leg = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 24);
  g.add(mesh(leg, -0.56, 1.55, 0));
  g.add(mesh(leg, 0.56, 1.55, 0));
  if (keyhole) {
    const hole = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 24);
    hole.rotateX(Math.PI / 2);
    g.add(mesh(hole, 0, 0.85, 0.36, solidInk));
    g.add(mesh(RB(0.12, 0.38, 0.1, 0.04, 3), 0, 0.62, 0.36, solidInk));
  }
  return g;
}
