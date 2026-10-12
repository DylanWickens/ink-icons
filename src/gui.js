import { settings } from './ink/uniforms.js';

// Inspector → Parameters tab. Edits the plain `settings` object; uniforms.js syncs it each frame.
export function createGui(inspector) {
  const gui = inspector.createParameters('Ink icons');

  const light = gui.addFolder('Light');
  light.add(settings, 'lightAngle', -180, 180, 1).name('Angle');
  light.add(settings, 'lightHeight', -10, 90, 1).name('Height');

  const shading = gui.addFolder('Shading');
  shading.add(settings, 'shadows').name('Shadows');
  shading.add(settings, 'highlight', 0.3, 1, 0.01).name('Highlight edge');
  shading.add(settings, 'shadowEdge', 0.1, 0.9, 0.01).name('Shadow edge');
  shading.add(settings, 'coreShadow', 0, 0.6, 0.01).name('Core shadow');
  shading.add(settings, 'softness', 0.002, 0.15, 0.001).name('Edge softness');

  const brush = gui.addFolder('Brush');
  brush.add(settings, 'brushScale', 18, 70, 1).name('Brush scale');
  brush.add(settings, 'outline', 0, 0.1, 0.001).name('Outline');
  brush.add(settings, 'outlineNoise', 0, 3, 0.05).name('Outline noise');
  brush.add(settings, 'roughness', 0, 0.15, 0.001).name('Roughness');
  brush.add(settings, 'grain').name('Shadow grain');
  brush.add(settings, 'grainSpread', 0.01, 0.4, 0.01).name('Grain spread');

  const vector = gui.addFolder('Vector mode');
  vector.add(settings, 'fill').name('Fill');
  vector.add(settings, 'sandShadow').name('Sand shadow');
  vector.add(settings, 'shadowLine').name('Shadow line');

  const marks = gui.addFolder('Inner strokes');
  marks.add(settings, 'markWeight', 0.3, 2.5, 0.05).name('Weight');
  marks.add(settings, 'markRough', 0, 1.2, 0.01).name('Edge noise');
  marks.add(settings, 'markGrain', 0, 1.2, 0.01).name('Dry-brush grain');
  marks.add(settings, 'markScale', 0.3, 4, 0.05).name('Noise scale');
  marks.add(settings, 'markShadow').name('Drop shadow');
  marks.add(settings, 'markShadowOffset', 0, 0.15, 0.005).name('Shadow offset');
  marks.add(settings, 'markShadowAngle', -180, 180, 1).name('Shadow angle');

  return gui;
}
