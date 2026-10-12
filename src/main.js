import './style.css';
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Inspector } from 'three/addons/inspector/Inspector.js';

import { u, settings, syncUniforms } from './ink/uniforms.js';
import { inkMaterial } from './ink/inkMaterial.js';
import { addOutlines } from './ink/outline.js';
import { HEX } from './ink/palette.js';
import { icons } from './icons/index.js';
import { createGui } from './gui.js';

const stage = document.getElementById('stage');
const errBox = document.getElementById('err');

function showError(e) {
  errBox.hidden = false;
  errBox.textContent = `Error: ${e.message}\n${(e.stack || '').split('\n').slice(0, 3).join('\n')}`;
  console.error(e);
}

async function loadTSLGraph(inspector) {
  // Early-stage extension: keep failures contained so the rest of the app keeps running.
  try {
    const { default: TSLGraphEditor } = await import('three/addons/inspector/extensions/tsl-graph/TSLGraphEditor.js');
    inspector.addTab(new TSLGraphEditor());
  } catch (err) {
    console.warn('TSL Graph tab unavailable:', err);
  }
}

async function init() {
  const renderer = new THREE.WebGPURenderer({
    antialias: true,
    forceWebGL: new URLSearchParams(location.search).has('webgl'),   // ?webgl to test the WebGL2 backend
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  stage.appendChild(renderer.domElement);
  renderer.inspector = new Inspector();
  await renderer.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(HEX.paper);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(4.2, 3.2, 5.4);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 4;
  controls.maxDistance = 12;
  controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.autoRotateSpeed = 0.8;

  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  // ---- icon switching: build, outline, centre and normalise to one framing ----
  const buttons = document.getElementById('icon-buttons');
  let current = null, currentName = null;

  function show(name) {
    if (current) scene.remove(current);
    const icon = icons[name].build();
    addOutlines(icon, inkMaterial);

    const box = new THREE.Box3().setFromObject(icon);
    const size = box.getSize(new THREE.Vector3());
    icon.position.sub(box.getCenter(new THREE.Vector3()));

    const wrap = new THREE.Group();
    wrap.add(icon);
    wrap.scale.setScalar(2.5 / Math.max(size.x, size.y, size.z));
    scene.add(wrap);
    current = wrap;
    currentName = name;

    document.getElementById('name').textContent = `Ink ${icons[name].label}`;
    for (const b of buttons.children) b.setAttribute('aria-pressed', b.dataset.icon === name);
  }

  for (const [name, { label }] of Object.entries(icons)) {
    const b = document.createElement('button');
    b.dataset.icon = name;
    b.textContent = label;
    b.addEventListener('click', () => show(name));
    buttons.append(b);
  }
  show('gear');

  // ---- style toggle (v4 ink / v5 vector) ----
  const modeButtons = document.querySelectorAll('[data-mode]');
  modeButtons.forEach(b => b.addEventListener('click', () => {
    u.mode.value = Number(b.dataset.mode);
    modeButtons.forEach(x => x.setAttribute('aria-pressed', x === b));
  }));

  createGui(renderer.inspector);
  if (import.meta.env.DEV) window.inkSettings = settings;   // poke settings from the console while developing
  loadTSLGraph(renderer.inspector);

  // inner-stroke settings change geometry, so rebuild the current icon when they move
  const markKey = () => [settings.markWeight, settings.markShadow, settings.markShadowOffset, settings.markShadowAngle].join();
  let lastMarkKey = markKey();

  renderer.setAnimationLoop(() => {
    syncUniforms();
    const k = markKey();
    if (k !== lastMarkKey) { lastMarkKey = k; show(currentName); }
    controls.update();
    renderer.render(scene, camera);
  });
}

init().catch(showError);
