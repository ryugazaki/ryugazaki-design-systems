# Four More Design Systems: Design Spec

Date: 2026-10-21
Status: Approved by the user in chat
Extends: `docs/superpowers/specs/2026-10-20-design-systems-archive-design.md` (all of its rules still apply)

## Goal

Add four design systems, Nos. 07 to 10, to the archive. Each is unmistakably different from the existing six (Editorial / Swiss, Neo-Brutalist, Calm SaaS, Terminal / Retro, Organic Warm, Dark Luxury).

## Systems

| No. | System | Slug | Brand for sample content | Fonts | Core palette | Signature | `app.html` |
|---|---|---|---|---|---|---|---|
| 07 | Industrial / Braun | `industrial-braun` | Fieldkit, modular home sensors and radios | Albert Sans + Azeret Mono | warm off-white `#EEECE6`, ink `#1E1E1C`, panel `#D7D4CC`, one signal orange `#C2410C` | rounded-square key grid, round SVG dials, LED dots, tiny mono caps labels under controls, one orange element per screen | Device panel |
| 08 | Riso Print | `riso-print` | Overprint Press, zine studio and print fair | Anybody (poster widths) + Courier Prime | paper `#F4EFE4`, riso blue `#2A4BCB`, fluoro pink `#FF48B0`, ink `#1B1A33` | pink and blue shapes overprinting with `mix-blend-multiply`, halftone texture, misregistration offsets, pink never used for text | Order a print run |
| 09 | Japanese Minimal (Ma) | `japanese-ma` | Sumi & Kiri, tea house and ceramics | Shippori Mincho + Zen Kaku Gothic New | washi `#F5F1E8`, sumi `#24221F`, hanko red `#B7282E` | empty space as an element, vertical text labels, 1px rules, red hanko stamp, asymmetric composition | Reservation |
| 10 | Kinetic Sport | `kinetic-sport` | Splitline, running club and race series | Big Shoulders Display + Barlow | dark-first `#0D0D0C`, acid lime `#C6F432`, hot red `#FF4D2E` | huge condensed uppercase headlines, giant numerals, skewed labels, diagonal stripes, tabular split times | Race results |

## Rules carried over

- Same file layout, content contract (12 components, 2 pages), linter, theme sync, light and dark mode, WCAG AA, 44 px tap targets, and anti-slop rules as Nos. 01 to 06.
- Dark-first systems use `"defaultMode": "dark"` and `class="dark"` on `<html>`. No. 10 is dark-first.
- The halftone (No. 08) and diagonal stripe (No. 10) textures need gradients. Each is defined once as a Tailwind `@utility` in that system's `theme.css`, on a single line that contains the utility name. Each is declared in the manifest's `allowedGradients` with a functional reason, so the linter accepts it and still rejects any other gradient.
- `index.json` stays ordered by number, 01 to 10. The catalog bento pattern repeats every six tiles, so ten entries still tile cleanly.

## Out of scope

Changes to the Angular app. None are needed: the app reads whatever `index.json` lists.
