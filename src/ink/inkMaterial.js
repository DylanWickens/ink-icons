import * as THREE from 'three/webgpu';
import {
  Fn, vec3, float, normalWorld, positionLocal, positionWorld, cameraPosition,
  dot, normalize, max, smoothstep, mix, mx_noise_float, clamp, cross, abs, step,
} from 'three/tsl';
import { u } from './uniforms.js';
import { PAPER, STONE, SHADOW, CORE, ONYX_300, ONYX_400, ONYX_200, HEX } from './palette.js';

// Cartoon ink: flat cel bands (paper → stone → ink shadow → core black).
// Only the band edges are brushy, so it reads as inked shapes, not texture all over.
const inkShader = Fn(() => {
  const N = normalize(normalWorld);
  const L = normalize(u.light);
  const lum = dot(N, L).mul(0.5).add(0.5);

  // stroke frame following the surface: streaks run around the form
  const d = normalize(cross(N, vec3(0.25, 1.0, 0.35)));
  const b = normalize(cross(N, d));
  const p = positionLocal.mul(u.density.div(38.0));
  const along = dot(p, d), across = dot(p, b);
  const streak = mx_noise_float(vec3(along.mul(0.8), across.mul(9.0), 0.0)).mul(0.7)
    .add(mx_noise_float(vec3(along.mul(2.0), across.mul(34.0), 3.1)).mul(0.3));

  // band edges get a slow, blobby wobble (not the streak texture), so shadows stay solid shapes
  const edgeNoise = mx_noise_float(p.mul(1.3));
  const lb = lum.add(edgeNoise.mul(u.rough));
  const toLight = smoothstep(u.lightAt, u.lightAt.add(u.soft), lb);
  const toMid0 = smoothstep(u.shadowAt, u.shadowAt.add(u.soft), lb);

  // dry-brush grain on the lit side of each shadow edge: ink thins out with distance from the edge
  const grain = mx_noise_float(p.mul(60.0)).mul(0.6)
    .add(mx_noise_float(vec3(along.mul(4.0), across.mul(70.0), 11.0)).mul(0.4))
    .mul(0.5).add(0.5);
  const grainy = edge => {
    const t = lb.sub(edge).div(u.grainW);                       // 0 at the edge → 1 at band end
    return step(t, grain).mul(step(0.0, t)).mul(u.grain);       // 1 = ink lands here
  };
  const noShadow = float(1.0).sub(u.shadows);                   // shadows off → past both edges
  const toMid = max(toMid0.mul(float(1.0).sub(grainy(u.shadowAt))), noShadow);

  // ---- shadow tones: a ramp of Onyx blacks from the shadow edge down to the core ----
  // t: 0 at the core shadow → 1 at the shadow edge.
  const t = clamp(lb.sub(u.coreAt).div(max(u.shadowAt.sub(u.coreAt), 0.001)), 0.0, 1.0);
  // Posterise t into `shadowSteps` flat bands (cel look). toneSoft blurs the band edges;
  // toneSmooth blends back toward the continuous gradient.
  const f = t.mul(u.shadowSteps).sub(0.5);
  const banded = f.floor().add(smoothstep(float(0.5).sub(u.toneSoft), float(0.5).add(u.toneSoft), f.fract()));
  const stepped = clamp(banded.div(max(u.shadowSteps.sub(1.0), 1.0)), 0.0, 1.0);
  const tone = mix(stepped, t, u.toneSmooth);
  // ramp: Onyx 700 → 450 → 400 → 300 → 200 (darkest at the core, lightest at the edge)
  const seg = (a, b) => clamp(tone.sub(a).div(b - a), 0.0, 1.0);
  const shadowCol = mix(mix(mix(mix(CORE, SHADOW, seg(0.0, 0.25)), ONYX_400, seg(0.25, 0.5)), ONYX_300, seg(0.5, 0.75)), ONYX_200, seg(0.75, 1.0));

  const filled = mix(mix(shadowCol, STONE, toMid), PAPER, toLight);

  // v5 vector: inner contours where the surface turns away + the shadow edge as one brushy path
  const V = normalize(cameraPosition.sub(positionWorld));
  const fres = float(1.0).sub(max(dot(N, V), 0.0));
  const lw = streak.mul(0.45).add(1.0);
  const contour = smoothstep(0.8, 0.88, fres.add(streak.mul(0.03)));
  const terminator = float(1.0)
    .sub(smoothstep(0.006, 0.02, abs(lb.sub(u.shadowAt)).div(lw)))
    .mul(u.termLine).mul(u.shadows);
  const lines = clamp(max(contour, terminator), 0.0, 1.0).mul(u.mode);

  // vector mode with fill hidden: paper, optionally with the shadow side blocked in with sand
  const vecFill = mix(PAPER, mix(STONE, PAPER, toMid), u.shadowFill);
  const base = mix(filled, vecFill, u.mode.mul(float(1.0).sub(u.fill)));
  return mix(base, CORE, lines);
});

export const inkMaterial = new THREE.MeshBasicNodeMaterial();
inkMaterial.userData.graphId = 'ink-icon';   // lets the Inspector's TSL Graph tab target it
inkMaterial.colorNode = inkShader();

// flat ink for small details (keyholes) that should read as solid black
export const solidInk = new THREE.MeshBasicNodeMaterial({ color: HEX.core });
