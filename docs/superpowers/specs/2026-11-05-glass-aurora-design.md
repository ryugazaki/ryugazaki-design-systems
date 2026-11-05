# No. 11 Glass Aurora: Design Spec

Date: 2026-11-05
Status: Approved by the user in chat
Extends: `docs/superpowers/specs/2026-10-20-design-systems-archive-design.md` and `docs/superpowers/specs/2026-10-21-four-more-design-systems-design.md` (all of their rules still apply)

## Goal

Add design system No. 11, Glass / Aurora, to the archive, and ship a matching Pencil (pencil.dev) source file for it.

## System

| No. | System | Slug | Brand for sample content | Fonts | Core palette | Signature | `app.html` |
|---|---|---|---|---|---|---|---|
| 11 | Glass / Aurora | `glass-aurora` | Polarlys, aurora forecasts and night tours from Tromsø | Unbounded + Manrope | polar night `#070B14`, ink `#EAF0F7`, aurora green `#3EE6A8` (light mode `#0A7A55`), aurora field hues cyan `#4CC9F0` and rose `#F0609E` | one aurora field per screen, frosted glass only on floating layers, pill controls, giant tabular Kp numbers | Tonight's forecast |

Dark-first: `"defaultMode": "dark"` and `class="dark"` on `<html>`.

## Conflict with the global rules, and how it is resolved

`_global/anti-slop.md` rule 7 bans glassmorphism and backdrop blur, and rule 2 bans decorative gradients. The user chose this style knowing that, and chose "limited glass with declared exceptions":

1. A new optional manifest field, `allowedOrnaments`, works like `allowedGradients`: a list of `{ pattern, reason }`. The linter accepts a backdrop blur (`backdrop-blur*` class or a `backdrop-filter:` declaration) only on a line that contains one of those patterns. It now checks `theme.css` too, so a blur hidden in a custom utility is still caught.
2. Rule 7 now reads "no glassmorphism or backdrop blur unless the system explicitly allows a functional one", mirroring rule 2.
3. The prompt builder lists a system's declared exceptions in an "Allowed exceptions" section, so a model copying the system knows the exact scope.
4. Systems 01 to 10 declare no ornaments, so nothing changes for them.

Glass Aurora declares exactly three exceptions, each one Tailwind `@utility` on a single line in `theme.css`:

- `aurora-sky` (gradient): the single aurora field behind the floating layers. It depicts the product's subject and gives the glass something to read against.
- `glass-pane` (ornament): frosted surface for floating layers only (navbar, modal, popover, toast, the hero forecast card). Falls back to the solid surface when backdrop-filter is unsupported or the viewer asks for reduced transparency.
- `glass-scrim` (ornament): the modal backdrop.

In-flow content (tables, forms, lists, bento tiles) uses the solid `surface` token. Text never sits directly on the aurora field.

## Contrast

Checked with a script: ink, muted, accent, and danger reach WCAG AA (4.5:1) on `bg`, on `surface`, and on `glass-pane` composited over the brightest point of the aurora field, in both modes. `edge` reaches 3:1 for control borders.

## Pencil source file

`design/glass-aurora.pen` is the Pencil document for the system: theme-aware variables (light and dark) for every color token, the radius and spacing tokens, reusable components (buttons, input, badges, glass card, navbar), and one sample screen built from instances. It is JSON, so it diffs in Git. It is a design source only; the archive app does not read it.

## Out of scope

Changes to the Angular app beyond the optional `allowedOrnaments` field and the prompt section.
