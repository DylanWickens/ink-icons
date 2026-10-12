import * as THREE from 'three/webgpu';
import { uniform } from 'three/tsl';

// Every value the shaders read. The Inspector edits `settings`; syncUniforms() copies it in each frame.
export const u = {
  density: uniform(38),          // brush scale
  mode: uniform(0),              // 0 = v4 ink, 1 = v5 vector
  fill: uniform(0),              // vector mode: show the inked fill under the lines
  light: uniform(new THREE.Vector3()),

  // band edges, in 0–1 light units
  lightAt: uniform(0.66),
  shadowAt: uniform(0.45),
  coreAt: uniform(0.6),
  soft: uniform(0.012),
  rough: uniform(0.03),

  shadows: uniform(1),
  grain: uniform(1),
  grainW: uniform(0.12),
  shadowFill: uniform(1),        // vector mode: sand block-in on the shadow side
  termLine: uniform(1),          // vector mode: line along the shadow edge

  outline: uniform(0.04),
  outlineNoise: uniform(1),      // how much the brush outline swells and thins

  // inner marks: noise eating into the stroke edges + dry-brush grain gaps
  markRough: uniform(0.35),
  markGrain: uniform(0.0),
  markScale: uniform(1),
};

export const settings = {
  brushScale: 38, outline: 0.04,
  lightAngle: -40, lightHeight: 50,
  highlight: 0.66, shadowEdge: 0.45, coreShadow: 0.6, softness: 0.012, roughness: 0.03,
  shadows: true, grain: true, grainSpread: 0.12,
  fill: false, sandShadow: true, shadowLine: true,
  // inner marks (symbols drawn on faces) — geometry, so changing these rebuilds the icon
  markWeight: 1, markShadow: true, markShadowOffset: 0.045, markShadowAngle: -45,
  markRough: 0.35, markGrain: 0, markScale: 1, outlineNoise: 1,
};

const lastLight = { az: NaN, el: NaN };
function setLight(az, el) {
  const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
  u.light.value.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).normalize();
  lastLight.az = az; lastLight.el = el;
}

export function syncUniforms() {
  const s = settings, b = v => (v ? 1 : 0);
  u.density.value = s.brushScale;
  u.outline.value = s.outline;
  if (lastLight.az !== s.lightAngle || lastLight.el !== s.lightHeight) setLight(s.lightAngle, s.lightHeight);
  u.lightAt.value = s.highlight;
  u.shadowAt.value = s.shadowEdge;
  u.coreAt.value = s.coreShadow;
  u.soft.value = s.softness;
  u.rough.value = s.roughness;
  u.shadows.value = b(s.shadows);
  u.grain.value = b(s.grain);
  u.grainW.value = s.grainSpread;
  u.fill.value = b(s.fill);
  u.shadowFill.value = b(s.sandShadow);
  u.termLine.value = b(s.shadowLine);
  u.outlineNoise.value = s.outlineNoise;
  u.markRough.value = s.markRough;
  u.markGrain.value = s.markGrain;
  u.markScale.value = s.markScale;
}

syncUniforms();
