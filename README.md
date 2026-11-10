# 雨夜のコンビニ — Rainy Corner

A self-contained Three.js diorama of a Japanese convenience-store street corner on a rainy night.

## Open

Open `rainy-convenience-store.html` directly in a desktop browser. It is a single offline file: Three.js, OrbitControls, textures, shaders, and the scene code are all embedded.

## Interaction

### Diorama view
- Drag: free 360° horizontal and 360° vertical orbit (including underside views)
- Mouse wheel / pinch: zoom in and out
- Interacting during the opening animation immediately hands camera control to you
- `R`: replay the building assembly animation

### First-person store visit
- Press `F` or double-click the scene to walk through the automatic doors into the store
- Move: `WASD` or arrow keys, hold `Shift` to walk faster
- Look: mouse (pointer lock), or click-and-drag if pointer lock is unavailable
- Press `F` or `Esc` to leave first-person mode and return to the diorama view

There is no on-screen UI. The opening animation assembles the square display base, pavement, store shell, interior, signage, rain, and street furniture in staged layers.

## Build from source

The source version is served by any static HTTP server from this folder.

```powershell
python server.py
# then open http://127.0.0.1:8123/index.html
```

Rebuild the single-file version:

```powershell
python build_single.py
```
