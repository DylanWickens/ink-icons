import * as THREE from 'three/webgpu';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { inkMaterial } from '../ink/inkMaterial.js';
import { HEX } from '../ink/palette.js';
import { settings, u } from '../ink/uniforms.js';
import { Fn, vec3, abs, step, normalLocal, positionLocal, mx_noise_float } from 'three/tsl';

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

// 3D check, for icons where the check IS the object (checklist).
export const check = (cx, cy, s = 1, z = 0, r = 0.09) =>
  inkTube([[cx - 0.3 * s, cy + 0.02 * s], [cx - 0.08 * s, cy - 0.2 * s], [cx + 0.34 * s, cy + 0.24 * s]], r, z);

// ---- Flat ink marks: symbols drawn ON a face, not built as objects ----
// Flat black, plus a sand copy offset down-right as a printed drop shadow.
// polygonOffset pulls them in front of the face without z-fighting.
// Brushy mask shared by the ink and its shadow, so the shadow keeps the same ragged shape.
// The marks are tubes squashed flat, so their geometry normal still points out from the stroke's
// centre line: |normal.z| is 1 down the middle and falls to 0 at the edge. Noise eats into that.
const markMask = Fn(() => {
  const centre = abs(normalLocal.z);
  const p = positionLocal.mul(u.markScale);
  const edge = mx_noise_float(p.mul(5.0)).mul(0.6).add(mx_noise_float(p.mul(14.0).add(3.0)).mul(0.4));
  const grain = mx_noise_float(p.mul(45.0).add(7.0)).mul(0.5).add(0.5);   // dry-brush specks
  const ink = centre.sub(edge.mul(u.markRough)).sub(grain.mul(u.markGrain));
  return step(0.12, ink);
})();

const flat = (color, offset) => {
  const m = new THREE.MeshBasicNodeMaterial({
    polygonOffset: true, polygonOffsetFactor: offset, polygonOffsetUnits: offset,
  });
  m.colorNode = vec3(...new THREE.Color(color).toArray());
  m.opacityNode = markMask;
  m.alphaTest = 0.5;            // hard cut: ink lands or it doesn't
  return m;
};
const markInk = flat(HEX.core, -4);
const markShadow = flat(HEX.stone, -2);

// strokes: arrays of [x, y] points, drawn as round-ended brush lines of radius r.
// shapes: THREE.Shape fills (e.g. a keyhole). z: the face the mark sits on.
// Weight and shadow come from the Inspector (settings.mark*); main.js rebuilds the icon when they change.
export function inkMark({ strokes = [], shapes = [], r = 0.08, z = 0 }) {
  r *= settings.markWeight;
  const layer = material => {
    const l = new THREE.Group();
    for (const pts of strokes) {
      const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => V3(x, y, 0)), false, 'centripetal');
      l.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 32, r, 12, false), material));
      const cap = new THREE.SphereGeometry(r, 16, 8);
      for (const t of [0, 1]) {
        const c = new THREE.Mesh(cap, material);
        c.position.copy(curve.getPoint(t));
        l.add(c);
      }
    }
    for (const s of shapes) {
      const m = new THREE.Mesh(new THREE.ShapeGeometry(s, 24), material);
      l.add(m);
    }
    l.scale.z = 0.01;               // squash the tubes flat onto the face
    l.traverse(o => { o.raycast = () => {}; });
    return l;
  };
  const g = new THREE.Group();
  if (settings.markShadow) {
    const a = THREE.MathUtils.degToRad(settings.markShadowAngle), d = settings.markShadowOffset;
    const sh = layer(markShadow);
    sh.position.set(Math.cos(a) * d, Math.sin(a) * d, z);
    g.add(sh);
  }
  const ink = layer(markInk);
  ink.position.z = z;
  g.add(ink);
  return g;
}

// Straight segments meet in crisp corners when each is its own stroke.
const segs = pts => pts.slice(1).map((p, i) => [pts[i], p]);

export const checkMark = (s = 1, z = 0) =>
  inkMark({ strokes: segs([[-0.3 * s, 0.02 * s], [-0.08 * s, -0.2 * s], [0.34 * s, 0.24 * s]]), r: 0.065 * s, z });

export const plusMark = (s = 1, z = 0) =>
  inkMark({ strokes: [[[-0.32 * s, 0], [0.32 * s, 0]], [[0, -0.32 * s], [0, 0.32 * s]]], r: 0.075 * s, z });

export const rectMark = (w, h, z, { open = false, r = 0.06 } = {}) => {
  const x = w / 2, y = h / 2;
  const pts = open ? [[-x, -y], [-x, y], [x, y], [x, -y]] : [[-x, -y], [-x, y], [x, y], [x, -y], [-x, -y]];
  return inkMark({ strokes: segs(pts), r, z });
};

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

// z of each flat front face that marks sit on
export const BUBBLE_FACE = 0.23;   // extrude depth 0.3 centred + 0.08 bevel
export const LOCK_FACE = 0.375;    // body depth 0.75 / 2

export function lockBody(keyhole) {
  const g = new THREE.Group();
  g.add(mesh(RB(1.8, 1.45, 0.75, 0.2, 6), 0, 0.72, 0));
  g.add(mesh(new THREE.TorusGeometry(0.56, 0.15, 24, 48, Math.PI), 0, 1.8, 0));
  const leg = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 24);
  g.add(mesh(leg, -0.56, 1.55, 0));
  g.add(mesh(leg, 0.56, 1.55, 0));
  if (keyhole) {
    const head = new THREE.Shape();
    head.absarc(0, 0.85, 0.15, 0, Math.PI * 2, false);
    const slot = new THREE.Shape();
    slot.moveTo(-0.06, 0.8); slot.lineTo(0.06, 0.8); slot.lineTo(0.1, 0.45); slot.lineTo(-0.1, 0.45); slot.closePath();
    g.add(inkMark({ shapes: [head, slot], z: LOCK_FACE }));
  }
  return g;
}
