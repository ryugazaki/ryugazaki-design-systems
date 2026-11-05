# Design source files

## `glass-aurora.pen`

The [Pencil](https://pencil.dev) file for design system No. 11, Glass Aurora. Open it in Pencil (desktop app or the IDE extension).

What is inside:

- **Variables** for every color token, with a `dark` and a `light` value on the `mode` theme axis, plus fonts, radius, and the type scale.
- **Glass Aurora / Tokens**: color swatches, type scale, radius.
- **Glass Aurora / Components**: reusable buttons, badges, input, and the glass navbar and toast over an aurora field.
- **Landing / Hero, dark** and **Landing / Hero, light**: the same screen built from component instances, one per theme.

The file is generated. Do not edit colors in Pencil and expect them to stick: change `public/systems/glass-aurora/manifest.json` (and `theme.css`), then run:

```bash
npm run build:pen
```

The generator checks that every node id is unique, every instance points at a reusable component, every override targets a node inside that component, and every `$variable` exists.
