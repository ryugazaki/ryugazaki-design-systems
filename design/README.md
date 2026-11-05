# Design source files

[Pencil](https://pencil.dev) files for the archive's design systems. Open them in Pencil (desktop app or the IDE extension).

| File | System | Default mode |
|---|---|---|
| `glass-aurora.pen` | No. 11 Glass Aurora | dark |
| `bauhaus-geometric.pen` | No. 12 Bauhaus Geometric | light |
| `clay-playful.pen` | No. 13 Clay Playful | light |

Every file has the same layout:

- **Variables** for every color token, with a `dark` and a `light` value on the `mode` theme axis, plus the two fonts, the radius tokens, and the type scale.
- **Tokens** board: color swatches, type scale, radius.
- **Components** board: the reusable components.
- **Landing / Hero** in both modes, built from component instances.

The files are generated. Do not edit colors in Pencil and expect them to stick: change the system's `manifest.json` and `theme.css` in `public/systems/<slug>/`, then run:

```bash
npm run build:pen
```

The generators live in `scripts/pen/`, one module per system on top of `lib.mjs`. Before writing, each file is checked: every node id is unique, every instance points at a reusable component, every override targets a node inside that component, and every `$variable` exists. `npm run test:scripts` also fails when a committed `.pen` file no longer matches its manifest.
