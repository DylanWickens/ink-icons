import * as THREE from 'three/webgpu';
import { vec3 } from 'three/tsl';

// Paper + Sand 500 for lights, Onyx for shadow and line.
export const HEX = {
  paper: 0xfdfcfb,
  stone: 0xdacbc0,   // Sand 500
  onyx300: 0x515453,
  onyx400: 0x383b3a,
  shadow: 0x1f2322,  // Onyx 450
  onyx200: 0x828484,
  core: 0x050807,    // Onyx 700
};

const C = hex => vec3(...new THREE.Color(hex).toArray());

export const PAPER = C(HEX.paper);
export const STONE = C(HEX.stone);
export const SHADOW = C(HEX.shadow);
export const CORE = C(HEX.core);
export const ONYX_300 = C(HEX.onyx300);
export const ONYX_400 = C(HEX.onyx400);
export const ONYX_200 = C(HEX.onyx200);
