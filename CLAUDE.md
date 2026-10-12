# Ink Icons

3D icon set rendered as hand-inked illustrations. Three.js `WebGPURenderer` + TSL node materials, built with Vite.

## Working with me
- I'm a self-taught designer / creative technologist learning Three.js and TSL. I want to **write the code myself**.
  Default to reviewing, explaining and pointing at what to change; only write code when I ask you to.
- When you explain shader changes, say what the maths does visually ("this moves the shadow edge toward the light").

## Run
- `npm install`, then `npm run dev` (Vite). Needs a WebGPU-capable browser; three falls back to WebGL2 otherwise.
- Controls live in the three.js **Inspector** (Parameters tab). The TSL Graph tab is an early-stage extension that
  embeds tsl-graph.xyz; it's loaded in a try/catch so failures don't break the app.

## Layout
- `src/main.js` – renderer, camera, OrbitControls, icon switching, render loop.
- `src/ink/uniforms.js` – every shader uniform (`u`) + the `settings` object the GUI edits; `syncUniforms()` copies settings → uniforms each frame.
- `src/ink/inkMaterial.js` – the main TSL shader: cel bands, brushy band edges, dry-brush grain, v5 vector lines.
- `src/ink/outline.js` – inverted-hull brush outline (back faces pushed out along smoothed normals).
- `src/ink/palette.js` – colours: paper `FDFCFB`, Sand 500 `DACBC0`, Onyx 450 `1F2322`, Onyx 700 `050807`.
- `src/icons/parts.js` – shared pieces (rounded boxes, `inkTube` strokes, check, plus, speech bubble, lock body).
- `src/icons/index.js` – one entry per icon `{ label, build() }`. Add a new icon here and it gets a button automatically.
- `src/gui.js` – Inspector Parameters folders.

## Conventions
- Icons are built in roughly ±1.2 local units; `show()` centres and scales them, so keep new icons near that size
  (brush noise and outline width are in local units, so a much bigger/smaller mesh changes stroke scale).
- Anything that should get an ink outline uses `inkMaterial`. Use `solidInk` for details that should read as flat black.
- No brand logos as icons (e.g. WhatsApp).

## Known issues
- Flat faces lit right at the shadow edge can look blotchy — nudge Shadow edge or Light angle.
- Outline width is in object space, so it thickens when zooming in. Screen-space width is a possible next step.
- Vector mode: flat faces seen edge-on can go fully black from the contour term (tighten the 0.8–0.88 range).
