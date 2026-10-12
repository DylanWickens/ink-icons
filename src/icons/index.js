import * as THREE from 'three/webgpu';
import {
  V3, RB, mesh, check, bubbleGeometry, lockBody,
  inkMark, checkMark, plusMark, rectMark, BUBBLE_FACE, LOCK_FACE,
} from './parts.js';
import { inkMaterial } from '../ink/inkMaterial.js';

// Each icon is a function returning a THREE.Group. Order here = button order in the UI.
export const icons = {
  mail: {
    label: 'Mail',
    build() {
      const g = new THREE.Group();
      g.add(mesh(RB(2.3, 1.55, 0.3, 0.12, 5)));
      g.add(inkMark({ strokes: [[[-1.0, 0.62], [0, -0.06]], [[0, -0.06], [1.0, 0.62]]], r: 0.07, z: 0.15 }));
      g.rotation.set(0.1, -0.35, 0);
      return g;
    },
  },

  phone: {
    label: 'Phone',
    build() {
      const g = new THREE.Group();
      const curve = new THREE.CatmullRomCurve3([V3(-0.6, 0.75), V3(-0.64, 0.05), V3(-0.1, -0.5), V3(0.65, -0.7)], false, 'centripetal');
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.17, 16, false), inkMaterial));
      for (const t of [0, 1]) {
        const p = curve.getPoint(t), tan = curve.getTangent(t);
        const cap = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.45, 8, 16), inkMaterial);
        cap.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(-tan.y, tan.x, 0).normalize());
        cap.position.copy(p);
        g.add(cap);
      }
      g.rotation.set(0.2, -0.4, 0);
      return g;
    },
  },

  laptop: {
    label: 'Download',
    build() {
      const g = new THREE.Group();
      g.add(mesh(RB(2.4, 0.1, 1.5, 0.05, 4), 0, 0, 0.1));
      const screen = new THREE.Group();
      screen.add(mesh(RB(2.0, 1.35, 0.12, 0.08, 4)));
      screen.add(inkMark({
        strokes: [[[0, 0.38], [0, -0.3]], [[-0.24, -0.06], [0, -0.3]], [[0.24, -0.06], [0, -0.3]]],
        r: 0.065, z: 0.06,
      }));
      screen.position.set(0, 0.72, -0.62);
      screen.rotation.x = -0.22;
      g.add(screen);
      g.rotation.y = -0.3;
      return g;
    },
  },

  chatCheck: {
    label: 'Chat check',
    build() {
      const g = new THREE.Group();
      g.add(mesh(bubbleGeometry()));
      g.add(checkMark(1.4, BUBBLE_FACE));
      g.rotation.y = -0.35;
      return g;
    },
  },

  chatPlus: {
    label: 'Chat plus',
    build() {
      const g = new THREE.Group();
      g.add(mesh(bubbleGeometry()));
      g.add(plusMark(1, BUBBLE_FACE));
      g.rotation.y = 0.35;
      return g;
    },
  },

  key: {
    label: 'Key',
    build() {
      const g = new THREE.Group();
      g.add(mesh(new THREE.TorusGeometry(0.5, 0.2, 24, 56), -1.0, 0, 0));
      const shaft = new THREE.CylinderGeometry(0.13, 0.13, 1.9, 24);
      shaft.rotateZ(Math.PI / 2);
      g.add(mesh(shaft, 0.4, 0, 0));
      g.add(mesh(RB(0.18, 0.42, 0.26, 0.06, 4), 0.95, -0.24, 0));
      g.add(mesh(RB(0.18, 0.3, 0.26, 0.06, 4), 1.25, -0.18, 0));
      g.add(mesh(new THREE.SphereGeometry(0.15, 24, 16), 1.36, 0, 0));
      g.rotation.set(0.15, -0.35, 0.35);
      return g;
    },
  },

  gear: {
    label: 'Settings',
    build() {
      const s = new THREE.Shape(), N = 240, teeth = 6, Ro = 1.0, Ri = 0.78;
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI * 2;
        const local = (t / ((Math.PI * 2) / teeth)) % 1;
        const d = Math.min(local, 1 - local);              // distance from tooth centre
        const r = d < 0.12 ? Ro : d < 0.18 ? Ro - ((Ro - Ri) * (d - 0.12)) / 0.06 : Ri;
        const x = Math.cos(t) * r, y = Math.sin(t) * r;
        i ? s.lineTo(x, y) : s.moveTo(x, y);
      }
      const hole = new THREE.Path();
      hole.absarc(0, 0, 0.32, 0, Math.PI * 2, true);
      s.holes.push(hole);
      const geo = new THREE.ExtrudeGeometry(s, {
        depth: 0.35, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3, curveSegments: 32,
      });
      geo.translate(0, 0, -0.175);
      const g = new THREE.Group();
      g.add(mesh(geo));
      g.rotation.set(0.25, -0.4, 0.1);
      return g;
    },
  },

  checklist: {
    label: 'Checklist',
    build() {
      const g = new THREE.Group();
      for (const y of [0.65, 0, -0.65]) {
        g.add(check(-0.85, y, 0.75, 0, 0.08));
        g.add(mesh(RB(1.4, 0.2, 0.2, 0.09, 4), 0.4, y, 0));
      }
      g.rotation.y = -0.3;
      return g;
    },
  },

  lockPlus: {
    label: 'Lock plus',
    build() {
      const g = lockBody(false);
      const p = plusMark(0.9, LOCK_FACE);
      p.position.y = 0.72;
      g.add(p);
      g.rotation.y = 0.35;
      return g;
    },
  },

  lock: {
    label: 'Lock',
    build() {
      const g = lockBody(true);
      g.rotation.y = -0.4;
      return g;
    },
  },

  grid: {
    label: 'Grid',
    build() {
      const g = new THREE.Group();
      for (const i of [-1, 1]) for (const j of [-1, 1]) g.add(mesh(RB(1.0, 0.36, 1.0, 0.18, 6), i * 0.62, 0.18, j * 0.62));
      g.rotation.y = 0.25;
      return g;
    },
  },

  hourglass: {
    label: 'Hourglass',
    build() {
      const g = new THREE.Group();
      g.add(mesh(RB(1.5, 0.16, 1.5, 0.07, 4), 0, 1.0, 0));
      g.add(mesh(RB(1.5, 0.16, 1.5, 0.07, 4), 0, -1.0, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.6, 0.07, 0.9, 40), 0, 0.48, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.07, 0.6, 0.9, 40), 0, -0.48, 0));
      g.rotation.set(0.15, -0.3, 0);
      return g;
    },
  },

  house: {
    label: 'House',
    build() {
      const g = new THREE.Group();
      g.add(mesh(RB(1.7, 1.25, 1.5, 0.16, 6), 0, 0.625, 0));
      const tri = new THREE.Shape();
      tri.moveTo(-1.08, 0); tri.lineTo(1.08, 0); tri.lineTo(0, 0.95); tri.closePath();
      const roof = new THREE.ExtrudeGeometry(tri, {
        depth: 1.72, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 6, curveSegments: 8,
      });
      roof.translate(0, 0, -0.86);
      g.add(mesh(roof, 0, 1.3, 0));
      g.add(mesh(RB(0.28, 0.6, 0.28, 0.06, 4), 0.48, 1.95, -0.25));   // chimney
      const door = rectMark(0.42, 0.66, 0.75, { open: true });        // drawn on the front wall
      door.position.set(-0.3, 0.36, 0);
      const win = rectMark(0.38, 0.38, 0.75);
      win.position.set(0.45, 0.78, 0);
      g.add(door, win);
      g.add(mesh(RB(2.4, 0.14, 2.2, 0.06, 4), 0, -0.07, 0));          // base
      return g;
    },
  },

  heart: {
    label: 'Heart',
    build() {
      const s = new THREE.Shape();
      s.moveTo(5, 5); s.bezierCurveTo(5, 5, 4, 0, 0, 0); s.bezierCurveTo(-6, 0, -6, 7, -6, 7);
      s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19); s.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
      s.bezierCurveTo(16, 7, 16, 0, 10, 0); s.bezierCurveTo(7, 0, 5, 5, 5, 5);
      const geo = new THREE.ExtrudeGeometry(s, {
        depth: 3, bevelEnabled: true, bevelThickness: 3, bevelSize: 2.4, bevelSegments: 10, curveSegments: 40,
      });
      geo.center(); geo.rotateZ(Math.PI); geo.scale(0.12, 0.12, 0.12);
      const g = new THREE.Group();
      g.add(mesh(geo));
      g.rotation.y = 0.35;
      return g;
    },
  },
};
