# Ryugazaki Design Systems Archive: Design Spec

Date: 2026-10-20
Status: Approved in brainstorming, pending spec review

## 1. Purpose

A mobile-first web app (Angular + Tailwind) that hosts a curated collection of design systems meant to be handed to AI coding agents, so the UI they generate does not look like generic "AI slop".

The design systems themselves are written in pure HTML + Tailwind v4 (CDN) so they are portable to any tech stack. The web app's job is to load, preview, and export them as AI-ready markdown.

### Success criteria

- A user can open the app on a phone, find a design system, preview its components and pages, and copy a complete markdown prompt in under 30 seconds.
- Every design system file opens standalone in a browser with no build step.
- The copied markdown contains everything an agent needs: identity, tokens, rules, anti-slop rules, and HTML snippets.
- `npm run check:systems` passes for all six systems (no slop patterns, all declared files exist).

### Non-goals (v1)

- No backend, CMS, auth, or user uploads.
- No deployment config. The app runs locally via `ng serve`.
- No raw-URL fetch endpoint or downloadable packages (copy-to-clipboard only).
- No per-component "Copy for AI" prompt (only whole-system prompt plus copying raw snippet code).

## 2. Decisions

| Topic | Decision |
|---|---|
| How agents consume a system | "Copy for AI" button produces structured markdown to paste into a chat |
| Storage | Static files in the repo under `public/systems/`, fetched at runtime |
| Content structure | Manifest-driven: `manifest.json` + `theme.css` + HTML files; markdown is generated |
| Tailwind in systems | Tailwind v4 browser CDN (`@tailwindcss/browser@4`) + `<style type="text/tailwindcss">` with an `@theme` block |
| Language | English for UI and prompts |
| App features | Catalog with search + tag filter, live preview, view/copy code, light/dark toggle, viewport toggle |
| Shell look | Strong character: "Specimen Archive" (section 5) |
| v1 content | Six systems (section 6) |

## 3. Architecture

**Stack:** Angular 20+ (standalone components, signals, new control flow, router), Tailwind v4 for the shell, built as a static SPA, run locally.

### Repository layout

```
src/app/
  core/
    systems.service.ts        fetch index.json and manifests, cache in signals
    prompt-builder.ts         pure function: manifest + theme + HTML -> markdown
    preview-doc.ts            pure function: snippet + theme + mode -> full HTML document
    clipboard.service.ts      navigator.clipboard with textarea fallback
    models.ts                 Manifest, ComponentEntry, PageEntry types
  features/
    catalog/                  home: bento grid, search, tag filter
    system-detail/            one system: overview, tokens, components, pages, rules
    preview-frame/            sandboxed iframe, viewport + mode toggles
  shared/ui/                  shell components (button, tag chip, code block, toast, tabs)
public/systems/
  index.json                  ordered list of system slugs (the only registry)
  _global/anti-slop.md        global rules appended to every prompt
  <slug>/
    manifest.json
    theme.css                 Tailwind v4 @theme block (light) + .dark overrides
    components/*.html         one fragment per component
    pages/landing.html
    pages/app.html
scripts/
  check-systems.mjs           validator + slop linter
  sync-themes.mjs             copies theme.css into each HTML file's inline theme block
```

### Routes

- `/` catalog
- `/s/:slug` system detail (default section: overview)
- `/s/:slug/:section` where section is `tokens | components | pages | rules`
- Unknown slug shows an inline "not in the archive" state with a link back.

### Data flow

1. Catalog loads `index.json`, then all `manifest.json` files in parallel. Search (name, tagline, tags) and tag filter run client-side over the manifests.
2. Opening a system loads its whole bundle at once (manifest, `theme.css`, every component and page file, in parallel) because "Copy for AI" needs all of it. The bundle is cached per slug for the session; a failed load is not cached.
3. Preview: `preview-doc.ts` wraps a fragment in a standalone document (Tailwind CDN script, Google Fonts links from the manifest, the theme in `<style type="text/tailwindcss">`, and `class="dark"` on `<html>` when dark mode is on), then sets it as iframe `srcdoc`. The iframe uses `sandbox="allow-scripts"` (no same-origin). The viewport toggle sets the iframe width to 375, 768, or 1280 px, scaled down to fit the container when needed.
4. Copy for AI: `prompt-builder.ts` builds the markdown (format in section 7) and the clipboard service copies it. The bottom bar shows an approximate token count (characters / 4).

### Error handling

- `index.json` fails: full-page error state with a retry button.
- A single manifest fails or is invalid: that tile renders as "unavailable"; the rest of the catalog works.
- A component or page file fails: the preview shows a placeholder for that item; the prompt builder skips it and adds a note line in the markdown.
- Clipboard is blocked: open a sheet with the markdown in a selectable, read-only textarea.

### Testing

- Unit tests (Angular default runner) for `prompt-builder.ts` (deterministic output, all sections present, missing-file note) and `preview-doc.ts` (dark class, fonts, theme injection).
- Component tests for catalog filtering and the copy flow (success toast, fallback sheet).
- `npm run check:systems` (Node script, no dependencies):
  - `index.json` slugs each have a valid manifest with all required fields.
  - Every file in `components[]` and `pages[]` exists.
  - Every system file opens standalone: has the Tailwind CDN script, snippet markers, and an inline theme identical to `theme.css`.
  - Slop lint over all HTML and manifests (rules in section 8 marked "linted").

## 4. Manifest schema

```json
{
  "slug": "neo-brutalist",
  "number": 2,
  "name": "Neo-Brutalist",
  "tagline": "Thick rules, hard shadows, loud primaries.",
  "description": "Two to three sentences on mood and intent.",
  "tags": ["bold", "playful", "dev-tool", "light"],
  "defaultMode": "light",
  "useCases": ["indie product landing", "developer tools"],
  "fonts": [
    { "family": "Archivo", "role": "display and UI", "weights": [500, 800, 900], "googleFontsUrl": "..." },
    { "family": "Martian Mono", "role": "labels, data", "weights": [400], "googleFontsUrl": "..." }
  ],
  "typeScale": { "ratio": 1.414, "steps": { "xs": "12px", "sm": "14px", "base": "16px", "lg": "22px", "xl": "32px", "2xl": "45px", "display": "64px" } },
  "palette": [
    { "token": "--color-yolk", "light": "#F4D23C", "dark": "#F4D23C", "role": "primary accent" }
  ],
  "allowedGradients": [],
  "rules": {
    "do": ["Offset every interactive surface with a 4px hard shadow"],
    "dont": ["Do not soften corners beyond 4px"]
  },
  "components": [
    { "id": "button", "name": "Button", "file": "components/button.html", "notes": "Primary, secondary, ghost; pressed state translates 2px." }
  ],
  "pages": [
    { "id": "landing", "name": "Landing", "file": "pages/landing.html" },
    { "id": "app", "name": "Dashboard", "file": "pages/app.html" }
  ]
}
```

Each component and page file is a complete HTML document (CDN script, font links, theme) so it opens directly in a browser, including over `file://`. The reusable part of `<body>` sits between `<!-- snippet:start -->` and `<!-- snippet:end -->`. The app extracts only the snippet for code view and prompts, and builds its own preview document so mode toggling works.

`theme.css` is the single source of truth for tokens. Each HTML file carries an inline copy of it inside `<style type="text/tailwindcss">` between `/* theme:start */` and `/* theme:end */` markers (inline, because fetching `../theme.css` is blocked on `file://`). `npm run sync:themes` rewrites those inline copies from `theme.css`; `check:systems` fails if any copy is out of sync or any marker is missing.

## 5. Shell identity: "Specimen Archive"

The app is presented as an archive or type-specimen catalog. Each design system is a numbered entry.

### Palette

| Role | Light | Dark |
|---|---|---|
| Paper (background) | `#ECE8DD` | `#141310` |
| Ink (text, rules) | `#17150F` | `#E8E3D6` |
| Graphite (secondary text) | `#5B574D` | `#9C978A` |
| Signal (only accent) | `#D23F1A` | `#F0582F` |

Signal is used only for active, focus, and copy-confirmed states.

### Typography

- Display and UI: Schibsted Grotesk, 700 to 800 for display, tracking -0.03em.
- Metadata, entry numbers, tokens, code: IBM Plex Mono.
- Scale (mobile): 12 / 15 / 20 / 36 / 64 px. Display grows to 112 px at `lg`.

### Form language

- Radius 0, no shadows. Depth comes from 1px ink rules and inverted blocks (ink background, paper text).
- Mono entry numbers (`No. 03`), lowercase mono category labels, full-width horizontal rules like a book index.
- Motion: 120 ms ease-out, no bounce, no parallax. Respects `prefers-reduced-motion`.
- Shell follows OS color scheme by default with a manual toggle (stored in `localStorage`). This is separate from the preview mode toggle.

### Layout

- Mobile first. Header row (mono breadcrumb + entry count), display title, sticky search, horizontally scrolling tag chips.
- Catalog is an asymmetric bento grid: one featured entry at 2x2, others mixed 2x1 and 1x1. Each tile shows a live, scaled, non-interactive iframe thumbnail of that system's landing page (lazy, loaded when in view), not an icon.
- Detail: title block, horizontally scrolling section tabs, content, and a sticky bottom bar with full-width "Copy for AI" and token estimate.
- From `md` up: two columns, section index on the left, content on the right; the copy bar becomes a sticky panel in the left column.
- Accessibility: visible focus rings in Signal, tap targets at least 44 px, tabs and toggles are real buttons with ARIA state, contrast AA for all text.

## 6. The six design systems

Each system ships: `theme.css` (color light + dark, fonts, type scale, spacing, radius, shadow, motion), 12 components (button, input with label/hint/error, select, checkbox + toggle, badge, card, navbar with mobile menu, modal / bottom sheet, table, bento grid, empty state, toast), and 2 pages (`landing.html`, `app.html`).

| No. | System | Fonts | Core palette | Signature | `app.html` |
|---|---|---|---|---|---|
| 01 | Editorial / Swiss | Newsreader + Libre Franklin | newsprint `#F7F4EC`, ink `#111111`, cobalt `#1F3FBF` | 12-col grid, kicker labels, drop cap, column rules, numbered footnotes | article page |
| 02 | Neo-Brutalist | Archivo (Expanded, Black) + Martian Mono | paper `#FFFDF5`, yolk `#F4D23C`, tomato `#FF5C39`, blue `#3B5BFF`, ink `#111111` | 2 to 3 px borders, 4 px hard offset shadow, buttons press down 2 px, stickers rotated -2deg | dashboard |
| 03 | Calm SaaS | Onest + Fragment Mono | stone `#F6F5F2`, ink `#1C1B19`, moss `#3F6B4E` | dense 13 px data, tabular numerals, 6 px radius, hairline borders, KPI bento | dashboard |
| 04 | Terminal / Retro | VT323 (display) + JetBrains Mono | `#0B0F0C`, phosphor `#7CF29A`, amber `#FFB547`; light mode is printout paper | ASCII-style box borders, blinking cursor, `[ok]` / `[err]` tags, radius 0 | dashboard |
| 05 | Organic Warm | Young Serif + Instrument Sans | oat `#F3EBDD`, clay `#B5532F`, olive `#5E6B3A`, cocoa `#3A2A20` | 28 px radius, arched image masks, hand-drawn SVG underline, asymmetric composition | product / booking page |
| 06 | Dark Luxury | Bodoni Moda + Jost | `#0A0A0A`, bone `#E9E4D8`, muted brass `#A88B5C` (no gold gradients) | 0.5 px rules, wide-tracked small caps, extreme whitespace, 400 ms fades | collection page |

Dark mode is required for every system. Systems that are dark-first (04, 06) set `"defaultMode": "dark"`, put `class="dark"` on `<html>` in their standalone files, and define their light variant explicitly rather than inverting. The preview mode toggle starts at the system's `defaultMode`.

Images in pages use inline SVG or CSS-drawn placeholders (no external stock image URLs), so files stay self-contained.

## 7. "Copy for AI" markdown format

Generated by `prompt-builder.ts` in this order:

1. Header: `# Design system: <name> (No. <nn>)`, one-line instruction telling the agent to follow this system strictly and to adapt the HTML to the target stack without changing the visual result.
2. Identity: tagline, description, use cases, tags.
3. Fonts: families, roles, weights, Google Fonts URLs.
4. Tokens: palette table (token, light, dark, role) and the full `theme.css` in a fenced `css` block.
5. Type scale: ratio and steps. Spacing, radius, shadow, and motion are read from the theme block in item 4.
6. Rules: system-specific Do and Don't lists.
7. Global anti-slop rules: contents of `_global/anti-slop.md`.
8. Components: for each, name, notes, and the snippet in a fenced `html` block.
9. Pages: for each, name and snippet in a fenced `html` block.
10. Footer: one-line checklist the agent must self-verify against before finishing.

Output is deterministic for the same inputs (stable ordering, no timestamps).

## 8. Global anti-slop rules

Stored in `public/systems/_global/anti-slop.md`. Rules marked (linted) are enforced by `check:systems`.

1. Fonts: no Inter, Poppins, Roboto, Montserrat, Open Sans, or Space Grotesk as defaults; every system declares an intentional pairing. (linted: font family names in HTML and manifests)
2. Gradients: no decorative gradients, mesh backgrounds, or glows. A gradient is allowed only if listed in the manifest's `allowedGradients` with a functional reason. (linted: `bg-gradient-`, `bg-linear-`, `bg-radial-`, `linear-gradient(`, `radial-gradient(` outside the allowlist)
3. Palette: no purple-to-blue or indigo-violet pairings, no slate-900 with indigo accent, at most one primary accent. (linted: `from-purple`, `to-blue`, `from-indigo`, `via-violet` and similar default-palette class combinations)
4. Layout: no row of three identical cards (icon, title, two lines). Use asymmetric bento or an editorial list.
5. Type scale must have real contrast: ratio at least 1.333 and display at least 3x body. (linted: manifest `typeScale`)
6. Copy: no em dash or `--` used as a sentence pause, no emoji in headings, no "Unlock", "Seamless", "Elevate", "Supercharge", "Empower", no "X, reimagined" headlines. (linted: text content in HTML)
7. No generic ornaments: gradient blobs behind heroes, glassmorphism cards, "New" sparkle badges, icons inside pastel circles, `shadow-xl` on everything. (linted: `backdrop-blur` on cards, `shadow-2xl` / `shadow-xl` counts)
8. Radius, shadow, and spacing come from the system's tokens, not mixed Tailwind defaults.

The shell UI follows these rules too.

## 9. Build order

1. Scaffold Angular + Tailwind v4 shell, theme, routing.
2. Core: models, systems service, preview-doc, prompt-builder, clipboard (with tests).
3. `check-systems.mjs`, `sync-themes.mjs`, and `anti-slop.md`.
4. System 02 Neo-Brutalist, complete, as the reference template.
5. Catalog and detail features against system 02.
6. Systems 01, 03, 04, 05, 06.
7. Final pass: `check:systems`, tests, manual mobile and desktop review in the browser.
