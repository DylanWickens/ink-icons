import * as THREE from 'three/webgpu';
import { Fn, positionLocal, normalLocal, mx_noise_float } from 'three/tsl';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { u } from './uniforms.js';
import { CORE } from './palette.js';

// Brush outline: an inverted hull (back faces only) pushed out along smoothed normals.
// Two noise layers swell and thin the width like a loaded brush.
export const outlineMaterial = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide });
outlineMaterial.colorNode = CORE;
outlineMaterial.positionNode = Fn(() => {
  const width = mx_noise_float(positionLocal.mul(2.6)).mul(0.55).add(1.0)
    .mul(mx_noise_float(positionLocal.mul(9.0).add(5.0)).mul(0.2).add(1.0));
  return positionLocal.add(normalLocal.mul(u.outline.mul(width)));
})();

// Hard edges have split normals, which would crack the hull open; merge + recompute smooth ones.
const hullCache = new WeakMap();
function hullGeometry(geo) {
  if (!hullCache.has(geo)) {
    const g = geo.clone();
    g.deleteAttribute('normal');
    if (g.attributes.uv) g.deleteAttribute('uv');
    const merged = mergeVertices(g, 1e-3);
    merged.computeVertexNormals();
    hullCache.set(geo, merged);
  }
  return hullCache.get(geo);
}

// Give every mesh using `material` an outline child. Outlines are not pickable.
export function addOutlines(root, material) {
  const meshes = [];
  root.traverse(o => { if (o.isMesh && o.material === material) meshes.push(o); });
  for (const mesh of meshes) {
    const hull = new THREE.Mesh(hullGeometry(mesh.geometry), outlineMaterial);
    hull.raycast = () => {};
    mesh.add(hull);
  }
}
