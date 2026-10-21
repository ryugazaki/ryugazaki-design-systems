# Four More Design Systems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add design systems No. 07 Industrial / Braun, No. 08 Riso Print, No. 09 Japanese Minimal (Ma), and No. 10 Kinetic Sport to the archive.

**Architecture:** Content only. Each system is a folder in `public/systems/<slug>/` with `manifest.json`, `theme.css`, 12 component files and 2 page files. Each is registered in `public/systems/index.json` and validated by `npm run check:systems`. The Angular app needs no changes.

**Tech Stack:** Pure HTML plus the Tailwind v4 browser CDN (`@tailwindcss/browser@4`), and the existing Node tooling (`sync:themes`, `check:systems`).

**Spec:** `docs/superpowers/specs/2026-10-21-four-more-design-systems-design.md`, which extends `docs/superpowers/specs/2026-10-20-design-systems-archive-design.md`.

## Global Constraints

- Everything in the "Global Constraints" section of `docs/superpowers/plans/2026-10-20-design-systems-archive.md` applies unchanged: English copy, mobile first at 375 px, the copy rules, banned fonts, no decorative gradients or glows, no JS besides the CDN, 44 px tap targets, WCAG AA, the exact CDN URL, and the exact markers.
- The content contract applies: the standalone skeleton plus the "what each file must show" table. It lives in that plan's Task 6, section "Content contract (applies to every system)".
- `public/systems/index.json` order after this plan: `editorial-swiss`, `neo-brutalist`, `calm-saas`, `terminal-retro`, `organic-warm`, `dark-luxury`, `industrial-braun`, `riso-print`, `japanese-ma`, `kinetic-sport`.
- Commit after every task. Do not push.

## Binding lessons from the reviews of Nos. 01 to 06

These are mandatory for every file:

1. **Contrast.** Any text on a saturated fill must pass AA (4.5:1, or 3:1 only for text at least 24 px, or at least 18.66 px bold). Compute it in both modes. If a theme pairing fails, choose another pairing in the HTML and report it. Do not silently change theme or manifest values.
2. **Control edges.** Input, radio, checkbox and switch borders need 3:1 against their background. Hairline `line` tokens usually fail this, so use a stronger token for control edges.
3. **Tap targets.** Every interactive element is at least 44 px tall (`min-h-11`), including "small" sizes and icon-only buttons (`size-11`). A control may draw a smaller visual face inside a 44 px hit area.
4. **Overflow.** Check per element, not just the page. At 375 px (and 768 for pages, bento, table and modal) no element's content may exceed its box. `overflow-hidden` and `truncate` must never hide data such as chart values or status words; measure each one's scrollWidth against clientWidth. Large numbers in stat tiles need responsive sizes. Tables scroll inside `overflow-x-auto`.
5. **Overlaps.** Deliberate overlaps (negative margins, offset cards, decorative shapes) must never cover text at any width. Check bounding-rect intersections at 375, 640, 768, 900, 1024 and 1280.
6. **Charts.** Percentage-height bars need a parent with a definite height. Do not put `items-end` on a row whose bars live inside column wrappers. Measure every bar. Captions must describe what the chart actually shows.
7. **Data consistency.** Numbers, dates, weekdays (check the real calendar), times, prices, names and claims repeated across files must agree. A schedule must fit inside the stated opening hours.
8. **Semantics.**
   - Static toasts use `role="status"` on a `div` or `p`, never on `<li>`.
   - Directional deltas need sr-only text when their arrows are `aria-hidden`.
   - Submit buttons outside their `<form>` need `form="id"`.
   - `aria-hidden` on a figure also hides its figcaption.
   - Every interactive element, including mobile menu links, radio cards and steppers, gets an explicit `focus-visible` style that fits the system.
   - Busy buttons that stay focusable keep the focus style.
9. **Display size.** Mobile display headlines are at least 3x the body size at 375 px.
10. **Modal demos.** Leave generous slack inside the faux backdrop so nothing clips.
11. **Accent discipline.** Use the accent only in the roles the manifest reserves for it.
12. **Linter quirks.**
    - No ™ © ® in headings.
    - No HTML entities for dashes.
    - Keep visible copy off the Google Fonts `<link>` line.
    - No `--` anywhere in visible text.
    - Only the theme's color tokens exist; default palette classes are banned and do not render.
    - Do not name real brands' proprietary products.
13. **Dev server.** The dev server on :4200 does not serve new files under `public/` until it restarts. For your own visual checks, run a temporary static server on another port (`npx http-server public -p 4310 -c-1`), and stop it when you are done.
14. **Reference for structure and quality, not style.** Read `public/systems/neo-brutalist/components/button.html`, `public/systems/calm-saas/pages/app.html` and `public/systems/dark-luxury/pages/landing.html` before writing.

## Shared steps for every task

- [ ] **Step 1:** Create `public/systems/<slug>/manifest.json` exactly as given. The `components` array is built from the notes table, one object per row in table order: `{ "id": <id>, "name": <name>, "file": "components/<id>.html", "notes": <notes> }`. `pages` is `[{ "id": "landing", "name": "Landing", "file": "pages/landing.html" }, { "id": "app", "name": <app page name>, "file": "pages/app.html" }]`.
- [ ] **Step 2:** Create `public/systems/<slug>/theme.css` exactly as given.
- [ ] **Step 3:** Add `<slug>` to `public/systems/index.json` in number order.
- [ ] **Step 4:** Create the 12 component files and 2 page files, using the content contract, the notes table, the brief and the binding lessons. For dark-first systems, put `class="dark"` on `<html>`. Read the `frontend-design:frontend-design` skill first for craft guidance; this plan's tokens and rules take precedence over it.
- [ ] **Step 5:** Run `npm run sync:themes`, then `npm run check:systems`, until the check prints `All systems pass.`
- [ ] **Step 6:** Check the standalone files at 375, 768 and 1280, in both modes. Do a DOM audit for overflow, tap targets, contrast, overlaps and chart heights, and fix what it finds.
- [ ] **Step 7:** Commit with `git add public/systems && git commit -m "feat(systems): add No. <nn> <Name>"`.

---

### Task 1: No. 07 Industrial / Braun

**Brief:** **Fieldkit** makes modular home sensors and a small radio. Voice: calm, functional, specific; sentences that read like a good manual. App page: "Device panel". It shows a room-by-room sensor grid (temperature, humidity, air quality), a radio control panel with a volume dial and preset keys, LED status indicators, a schedule list and a settings group with switches.

`manifest.json`:
```json
{
  "slug": "industrial-braun",
  "number": 7,
  "name": "Industrial / Braun",
  "tagline": "Less, but better. One orange switch per screen.",
  "description": "A system that behaves like a well made appliance. Warm greys, a strict modular grid, rounded-square keys and round dials, tiny monospaced labels under every control, and a single signal orange reserved for the one thing that matters on each screen.",
  "tags": ["light", "minimal", "hardware", "product", "dashboard"],
  "defaultMode": "light",
  "useCases": ["hardware and IoT products", "control panels and settings", "product landing pages", "tools with physical counterparts"],
  "fonts": [
    { "family": "Albert Sans", "role": "display, headings and interface", "weights": [400, 500, 600, 700], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700&family=Azeret+Mono:wght@400;500&display=swap" },
    { "family": "Azeret Mono", "role": "control labels, readouts, units", "weights": [400, 500], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700&family=Azeret+Mono:wght@400;500&display=swap" }
  ],
  "typeScale": { "ratio": 1.333, "steps": { "xs": "12px", "sm": "13px", "base": "15px", "lg": "20px", "xl": "27px", "2xl": "36px", "display": "48px" } },
  "palette": [
    { "token": "--color-bg", "light": "#EEECE6", "dark": "#191917", "role": "warm off-white housing" },
    { "token": "--color-surface", "light": "#F7F6F2", "dark": "#222220", "role": "raised panels" },
    { "token": "--color-panel", "light": "#D7D4CC", "dark": "#2B2B28", "role": "recessed control panels and keys" },
    { "token": "--color-ink", "light": "#1E1E1C", "dark": "#E9E7E1", "role": "text and markings" },
    { "token": "--color-muted", "light": "#5F5D57", "dark": "#A3A098", "role": "labels and secondary text" },
    { "token": "--color-line", "light": "#C9C6BD", "dark": "#3A3936", "role": "seams and dividers" },
    { "token": "--color-accent", "light": "#C2410C", "dark": "#F06A2E", "role": "the one signal element per screen" },
    { "token": "--color-accent-ink", "light": "#FFFFFF", "dark": "#191917", "role": "text on accent" },
    { "token": "--color-led", "light": "#2F7D4F", "dark": "#5BC489", "role": "on and healthy indicator dots" }
  ],
  "allowedGradients": [],
  "rules": {
    "do": [
      "Align everything to an 8px grid and group controls into panels like a device face",
      "Put a tiny Azeret Mono label in lowercase under or beside every control and readout",
      "Use rounded-square keys (8px radius) and true circles for dials, knobs and LEDs",
      "Reserve the orange accent for exactly one element per screen: the primary action or the active state",
      "Show state with small LED dots and readouts, not with colored backgrounds"
    ],
    "dont": [
      "Do not use more than one orange element on a screen",
      "Do not use drop shadows; panels read as recessed or raised through tone and a single inset line",
      "Do not use decorative icons; draw only functional symbols",
      "Do not use bold weights above 700 or condensed type",
      "Do not round corners beyond 8px except for circles"
    ]
  },
  "components": [],
  "pages": []
}
```

Notes table:

| id | name | notes |
|---|---|---|
| button | Button | Rounded-square keys on the panel tone with a 1px inset bottom line. Primary is the orange key; secondary is panel; ghost is a text control with a mono label. Pressed state darkens the key and removes the inset line. |
| input | Input | Recessed field on panel tone with an ink control edge, mono label above, unit suffix on the right. Error shows an orange-free danger message in ink with a small square marker. |
| select | Select | Recessed field with a small triangle marker, styled like a detent switch label. |
| checkbox-toggle | Checkbox and toggle | Square checkbox with a solid ink check. Switch is a rounded-square slide switch with an LED dot that lights when on. |
| badge | Badge | Small mono labels with an LED dot: on, standby, offline, and one accent badge for the single current item. |
| card | Card | A device module: readout in large numerals, unit in mono, a small dial, and a status LED. |
| navbar | Navbar | Wordmark left, mono section labels, a single orange action. Mobile menu is a details disclosure laid out as a key grid. |
| modal | Modal and sheet | A panel that slides up with a seam line on top, mono title label, two keys; the confirm key is the only orange. |
| table | Table | Schedule table with mono times, room names, target values and LED status, ruled by seams. |
| bento | Bento grid | Device face: a 2x2 dial tile, readout tiles, a key grid tile, and a level meter drawn with segments. |
| empty-state | Empty state | A drawn outline of a module slot, one line explaining what to plug in, one key action. |
| toast | Toast | A thin panel strip with an LED dot and a mono timestamp. |

App page name: `Device panel`.

`theme.css`:
```css
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-*: initial;
  --color-bg: #EEECE6;
  --color-surface: #F7F6F2;
  --color-panel: #D7D4CC;
  --color-ink: #1E1E1C;
  --color-muted: #5F5D57;
  --color-line: #C9C6BD;
  --color-accent: #C2410C;
  --color-accent-ink: #FFFFFF;
  --color-led: #2F7D4F;

  --font-display: "Albert Sans", ui-sans-serif, sans-serif;
  --font-body: "Albert Sans", ui-sans-serif, sans-serif;
  --font-mono: "Azeret Mono", ui-monospace, monospace;

  --text-*: initial;
  --text-xs: 0.75rem;
  --text-xs--line-height: 1.4;
  --text-sm: 0.8125rem;
  --text-sm--line-height: 1.45;
  --text-base: 0.9375rem;
  --text-base--line-height: 1.55;
  --text-lg: 1.25rem;
  --text-lg--line-height: 1.35;
  --text-xl: 1.6875rem;
  --text-xl--line-height: 1.2;
  --text-2xl: 2.25rem;
  --text-2xl--line-height: 1.1;
  --text-display: 3rem;
  --text-display--line-height: 1.02;

  --radius-*: initial;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-full: 9999px;

  --shadow-*: initial;
  --shadow-key: inset 0 -2px 0 0 rgb(30 30 28 / 0.18);

  --ease-detent: cubic-bezier(0.3, 0, 0, 1);
}

@layer base {
  .dark {
    --color-bg: #191917;
    --color-surface: #222220;
    --color-panel: #2B2B28;
    --color-ink: #E9E7E1;
    --color-muted: #A3A098;
    --color-line: #3A3936;
    --color-accent: #F06A2E;
    --color-accent-ink: #191917;
    --color-led: #5BC489;
  }
  body {
    background: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-body);
    font-size: var(--text-base);
    -webkit-font-smoothing: antialiased;
  }
}
```

---

### Task 2: No. 08 Riso Print

**Brief:** **Overprint Press** is a small risograph studio that prints zines and runs an annual print fair. Voice: friendly, scrappy, precise about paper and ink. App page: "Order a print run". It is a configurator with paper stock radio cards, ink color choices (blue, pink, both), a quantity stepper, page count, live price breakdown, a proof preview drawn with overprinting shapes, and an order summary.

`manifest.json`:
```json
{
  "slug": "riso-print",
  "number": 8,
  "name": "Riso Print",
  "tagline": "Two inks, one pass, happy accidents on purpose.",
  "description": "Borrowed from the risograph: a cream paper ground, two spot inks that overprint into a third color, halftone texture, and type that is slightly off register. It feels handmade and loud without being messy, because the grid underneath stays strict.",
  "tags": ["light", "playful", "print", "creative", "editorial"],
  "defaultMode": "light",
  "useCases": ["zines and small publishers", "events and festivals", "creative studios", "posters and campaign pages"],
  "fonts": [
    { "family": "Anybody", "role": "display headlines; use font-stretch 130 to 150 percent", "weights": [500, 700, 900], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Anybody:wdth,wght@50..150,100..900&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap" },
    { "family": "Courier Prime", "role": "body, labels, prices", "weights": [400, 700], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Anybody:wdth,wght@50..150,100..900&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap" }
  ],
  "typeScale": { "ratio": 1.5, "steps": { "xs": "12px", "sm": "14px", "base": "16px", "lg": "24px", "xl": "36px", "2xl": "54px", "display": "72px" } },
  "palette": [
    { "token": "--color-bg", "light": "#F4EFE4", "dark": "#16151F", "role": "paper" },
    { "token": "--color-surface", "light": "#FBF8F1", "dark": "#1F1D2B", "role": "cards and fields" },
    { "token": "--color-ink", "light": "#1B1A33", "dark": "#F1ECDF", "role": "text and key lines" },
    { "token": "--color-muted", "light": "#5B5870", "dark": "#B4AFC2", "role": "secondary text" },
    { "token": "--color-line", "light": "#1B1A33", "dark": "#F1ECDF", "role": "rules and control edges" },
    { "token": "--color-blue", "light": "#2A4BCB", "dark": "#6F8CFF", "role": "riso blue ink, primary fills" },
    { "token": "--color-pink", "light": "#FF48B0", "dark": "#FF5DBA", "role": "fluoro pink ink, fills and shapes only, never text" },
    { "token": "--color-blue-ink", "light": "#FBF8F1", "dark": "#16151F", "role": "text on blue" },
    { "token": "--color-pink-ink", "light": "#1B1A33", "dark": "#16151F", "role": "text on pink" }
  ],
  "allowedGradients": [
    { "pattern": "bg-halftone", "reason": "halftone dot texture that imitates a riso screen, used only on decorative shapes" }
  ],
  "rules": {
    "do": [
      "Overprint pink and blue shapes with mix-blend-multiply so their overlap prints a third color",
      "Offset one display headline layer by 2 to 4px in the second ink to fake misregistration, with the duplicate aria-hidden",
      "Use the halftone utility only on decorative shapes, never behind text",
      "Set display type in Anybody at wide widths and body in Courier Prime",
      "Keep the grid strict so the playful ink effects read as intentional"
    ],
    "dont": [
      "Do not use pink as a text color",
      "Do not use more than the two spot inks plus ink and paper",
      "Do not round corners except on circular stickers and pills",
      "Do not use shadows; depth comes from overprint and offset",
      "Do not put texture behind body copy"
    ]
  },
  "components": [],
  "pages": []
}
```

Notes table:

| id | name | notes |
|---|---|---|
| button | Button | Primary is a blue fill with paper text and a pink block offset 3px behind it (overprinting where they meet). Secondary is an ink outline; ghost is an underlined text link. |
| input | Input | Paper field with a 2px ink edge, typewriter label, and an error state with a pink marker block beside a blue-ink message. |
| select | Select | Ink-edged select with a hand-cut triangle marker. |
| checkbox-toggle | Checkbox and toggle | Square checkbox that fills blue with a paper check. Switch is a pill track with a pink knob overprinting the blue track when on. |
| badge | Badge | Pill stickers in blue, pink with ink text, outline, and one rotated sticker per screen. |
| card | Card | A zine card: drawn cover with overprinting shapes, title in Anybody, page count and price in typewriter. |
| navbar | Navbar | Wordmark with a misregistered second layer, links in typewriter, a blue order button. Mobile menu is a details disclosure on paper. |
| modal | Modal and sheet | Paper sheet with an ink edge and a pink corner block, title in Anybody, two actions. |
| table | Table | Price list: stock, size, one color, two color, minimum run, ruled with ink lines, prices right-aligned. |
| bento | Bento grid | Poster wall: 2x2 overprint poster tile, a halftone shape tile, a quote, a fair date tile, and an ink swatch tile. |
| empty-state | Empty state | An empty tray drawn with two offset outlines, one line of copy, one blue action. |
| toast | Toast | Paper strip with a blue or pink square and a typewriter message. |

App page name: `Order a print run`.

`theme.css`:
```css
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-*: initial;
  --color-bg: #F4EFE4;
  --color-surface: #FBF8F1;
  --color-ink: #1B1A33;
  --color-muted: #5B5870;
  --color-line: #1B1A33;
  --color-blue: #2A4BCB;
  --color-pink: #FF48B0;
  --color-blue-ink: #FBF8F1;
  --color-pink-ink: #1B1A33;

  --font-display: "Anybody", ui-sans-serif, sans-serif;
  --font-body: "Courier Prime", ui-monospace, monospace;

  --text-*: initial;
  --text-xs: 0.75rem;
  --text-xs--line-height: 1.4;
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.5;
  --text-base: 1rem;
  --text-base--line-height: 1.6;
  --text-lg: 1.5rem;
  --text-lg--line-height: 1.25;
  --text-xl: 2.25rem;
  --text-xl--line-height: 1.05;
  --text-2xl: 3.375rem;
  --text-2xl--line-height: 0.95;
  --text-display: 4.5rem;
  --text-display--line-height: 0.9;

  --radius-*: initial;
  --radius-full: 9999px;

  --shadow-*: initial;
}

@utility bg-halftone { background-image: radial-gradient(currentColor 1.1px, transparent 1.6px); background-size: 7px 7px; }

@layer base {
  .dark {
    --color-bg: #16151F;
    --color-surface: #1F1D2B;
    --color-ink: #F1ECDF;
    --color-muted: #B4AFC2;
    --color-line: #F1ECDF;
    --color-blue: #6F8CFF;
    --color-pink: #FF5DBA;
    --color-blue-ink: #16151F;
    --color-pink-ink: #16151F;
  }
  body {
    background: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }
}
```

Note: `mix-blend-multiply` darkens on the dark paper too. In dark mode, check that overprint shapes still read; `dark:mix-blend-screen` is allowed for the overprint shapes.

---

### Task 3: No. 09 Japanese Minimal (Ma)

**Brief:** **Sumi & Kiri** is a small tea house with a ceramics shelf. Voice: quiet, precise, seasonal; short sentences with room around them. App page: "Reservation". It has a seating choice (counter, tatami room) as radio cards, a date list for the coming week with real weekdays, time slots, guest count stepper, a seasonal tea course description, a note field, and a confirmation summary marked with a red hanko stamp.

`manifest.json`:
```json
{
  "slug": "japanese-ma",
  "number": 9,
  "name": "Japanese Minimal (Ma)",
  "tagline": "The space between things is part of the design.",
  "description": "A system built on ma, the meaningful interval. Washi paper tones, sumi ink, one hanko red, hairline rules, vertical labels, and generous asymmetric space. Nothing is decorated that does not need to be.",
  "tags": ["light", "minimal", "calm", "hospitality", "editorial"],
  "defaultMode": "light",
  "useCases": ["tea houses, restaurants and hotels", "galleries and craft shops", "booking flows", "quiet editorial sites"],
  "fonts": [
    { "family": "Shippori Mincho", "role": "headings and body text", "weights": [400, 500, 600], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" },
    { "family": "Zen Kaku Gothic New", "role": "labels, buttons, small interface text", "weights": [400, 500, 700], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" }
  ],
  "typeScale": { "ratio": 1.333, "steps": { "xs": "12px", "sm": "14px", "base": "16px", "lg": "21px", "xl": "28px", "2xl": "37px", "display": "50px" } },
  "palette": [
    { "token": "--color-bg", "light": "#F5F1E8", "dark": "#171614", "role": "washi paper" },
    { "token": "--color-surface", "light": "#FBF9F4", "dark": "#1F1E1B", "role": "raised paper and fields" },
    { "token": "--color-ink", "light": "#24221F", "dark": "#ECE6DA", "role": "sumi ink text" },
    { "token": "--color-muted", "light": "#6B655C", "dark": "#A59E91", "role": "secondary text" },
    { "token": "--color-line", "light": "#D8D1C4", "dark": "#36332E", "role": "hairline rules" },
    { "token": "--color-edge", "light": "#8A8377", "dark": "#7D766B", "role": "control edges that need 3:1" },
    { "token": "--color-accent", "light": "#B7282E", "dark": "#E46468", "role": "hanko red: stamps, the primary action, the selected state" },
    { "token": "--color-accent-ink", "light": "#FBF9F4", "dark": "#171614", "role": "text on hanko red" }
  ],
  "allowedGradients": [],
  "rules": {
    "do": [
      "Leave at least as much empty space as content in every section, placed asymmetrically",
      "Use one vertical label per screen with writing-mode vertical-rl for a section name",
      "Separate with 1px hairline rules instead of boxes",
      "Use the hanko red for one stamp, the primary action and the selected state only",
      "Keep body text at 16px with a line height of at least 1.8"
    ],
    "dont": [
      "Do not use shadows or rounded corners, except the round hanko stamp",
      "Do not center whole layouts; anchor them to one side",
      "Do not use more than one red element per section",
      "Do not use bold weights for body text",
      "Do not add decorative patterns like waves or cherry blossoms"
    ]
  },
  "components": [],
  "pages": []
}
```

Notes table:

| id | name | notes |
|---|---|---|
| button | Button | Primary is a hanko red fill with paper text; secondary is a 1px edge outline; ghost is text with a hairline underline. Generous horizontal padding, no radius. |
| input | Input | Bottom edge only in the edge token, label in Zen Kaku Gothic above, serif input text. Error shows a red short rule and a quiet message. |
| select | Select | Bottom edge only with a thin chevron, like a handwritten form line. |
| checkbox-toggle | Checkbox and toggle | Square 1px edge checkbox with a red check. Switch is a thin line track with a small square that moves and turns red when on. |
| badge | Badge | Small Zen Kaku Gothic labels with a hairline frame; one round hanko-style badge in red. |
| card | Card | A ceramic piece: tall token-drawn bowl shape on paper, name in Mincho, glaze and size in small gothic, price. |
| navbar | Navbar | Wordmark with a small red square seal, links spaced widely, one red reserve action. Mobile menu is a details disclosure with tall rows. |
| modal | Modal and sheet | Paper sheet with a hairline frame, a vertical label on the side at md, two actions. |
| table | Table | Seasonal tea course or opening hours table with hairline rows and lots of row height. |
| bento | Bento grid | Asymmetric: one tall tile with a drawn tea bowl, a season note, a vertical label tile, hours, and an empty breathing tile. |
| empty-state | Empty state | A single circle outline, one quiet sentence, one text action. |
| toast | Toast | A hairline bar with a small red square and a short message. |

App page name: `Reservation`.

`theme.css`:
```css
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-*: initial;
  --color-bg: #F5F1E8;
  --color-surface: #FBF9F4;
  --color-ink: #24221F;
  --color-muted: #6B655C;
  --color-line: #D8D1C4;
  --color-edge: #8A8377;
  --color-accent: #B7282E;
  --color-accent-ink: #FBF9F4;

  --font-display: "Shippori Mincho", ui-serif, serif;
  --font-body: "Shippori Mincho", ui-serif, serif;
  --font-ui: "Zen Kaku Gothic New", ui-sans-serif, sans-serif;

  --text-*: initial;
  --text-xs: 0.75rem;
  --text-xs--line-height: 1.6;
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.7;
  --text-base: 1rem;
  --text-base--line-height: 1.85;
  --text-lg: 1.3125rem;
  --text-lg--line-height: 1.6;
  --text-xl: 1.75rem;
  --text-xl--line-height: 1.4;
  --text-2xl: 2.3125rem;
  --text-2xl--line-height: 1.3;
  --text-display: 3.125rem;
  --text-display--line-height: 1.2;

  --radius-*: initial;
  --radius-full: 9999px;

  --shadow-*: initial;

  --ease-quiet: cubic-bezier(0.25, 0.1, 0.25, 1);
}

@layer base {
  .dark {
    --color-bg: #171614;
    --color-surface: #1F1E1B;
    --color-ink: #ECE6DA;
    --color-muted: #A59E91;
    --color-line: #36332E;
    --color-edge: #7D766B;
    --color-accent: #E46468;
    --color-accent-ink: #171614;
  }
  body {
    background: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }
}
```

---

### Task 4: No. 10 Kinetic Sport

**Brief:** **Splitline** is a running club that organizes a city race series. Voice: short, energetic, numbers first, never cheesy. App page: "Race results". It has an event header with date and course, a leaderboard table with rank, bib, name, category, split times and finish time, a category filter, a personal result card with pace and position, a pace chart drawn with bars, and a next race call to action. Dark-first.

`manifest.json`:
```json
{
  "slug": "kinetic-sport",
  "number": 10,
  "name": "Kinetic Sport",
  "tagline": "Big numbers, hard edges, always moving.",
  "description": "A dark-first system that feels like a race clock. Condensed uppercase headlines at huge sizes, giant tabular numerals, an acid lime that marks what is live or leading, skewed labels, and diagonal stripes used like track markings.",
  "tags": ["dark", "bold", "sport", "events", "dashboard"],
  "defaultMode": "dark",
  "useCases": ["sports clubs and race events", "fitness apps", "streetwear and campaigns", "live results and leaderboards"],
  "fonts": [
    { "family": "Big Shoulders Display", "role": "display headlines and big numerals, uppercase", "weights": [700, 800, 900], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Big+Shoulders+Display:wght@700;800;900&display=swap" },
    { "family": "Barlow", "role": "body, labels, tables with tabular numerals", "weights": [400, 500, 600, 700], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Big+Shoulders+Display:wght@700;800;900&display=swap" }
  ],
  "typeScale": { "ratio": 1.618, "steps": { "xs": "12px", "sm": "14px", "base": "16px", "lg": "26px", "xl": "42px", "2xl": "68px", "display": "110px" } },
  "palette": [
    { "token": "--color-bg", "light": "#F2F2EC", "dark": "#0D0D0C", "role": "background" },
    { "token": "--color-surface", "light": "#FBFBF6", "dark": "#171716", "role": "panels and rows" },
    { "token": "--color-ink", "light": "#0D0D0C", "dark": "#F2F2EC", "role": "text" },
    { "token": "--color-muted", "light": "#57574F", "dark": "#A3A39A", "role": "secondary text" },
    { "token": "--color-line", "light": "#CFCFC5", "dark": "#2E2E2B", "role": "rules" },
    { "token": "--color-edge", "light": "#6E6E66", "dark": "#7A7A72", "role": "control edges that need 3:1" },
    { "token": "--color-accent", "light": "#C6F432", "dark": "#C6F432", "role": "acid lime: live, leading, primary action fills; never text on light backgrounds" },
    { "token": "--color-accent-ink", "light": "#0D0D0C", "dark": "#0D0D0C", "role": "text on lime" },
    { "token": "--color-hot", "light": "#C2321A", "dark": "#FF4D2E", "role": "live badge, alerts, DNF" },
    { "token": "--color-hot-ink", "light": "#FBFBF6", "dark": "#0D0D0C", "role": "text on hot" }
  ],
  "allowedGradients": [
    { "pattern": "bg-stripes", "reason": "diagonal track-marking stripe texture on decorative bands and empty areas only" }
  ],
  "rules": {
    "do": [
      "Set headlines in Big Shoulders Display uppercase with tight tracking at the largest step the layout allows",
      "Make the key number on every screen giant and tabular",
      "Use a -12deg skew on small labels and badges, with the text itself counter-skewed back upright",
      "Mark what is live or leading with the lime fill, and keep lime off light backgrounds as text",
      "Use the stripe utility only on decorative bands, never behind text"
    ],
    "dont": [
      "Do not round corners",
      "Do not use shadows or glows",
      "Do not use lime as text on light backgrounds",
      "Do not use more than lime and hot as accents",
      "Do not write cheesy motivational slogans"
    ]
  },
  "components": [],
  "pages": []
}
```

Notes table:

| id | name | notes |
|---|---|---|
| button | Button | Primary is a lime block with uppercase condensed label in ink; secondary is an ink outline; ghost is an uppercase text link with an arrow. Hover nudges the label 2px right. |
| input | Input | Surface field with an edge border, uppercase Barlow label, bib or time formats in tabular numerals. Error uses hot. |
| select | Select | Category select with a chevron, uppercase options. |
| checkbox-toggle | Checkbox and toggle | Square checkbox that fills lime with an ink check. Switch is a hard-edged track with a square knob that turns lime when on. |
| badge | Badge | Skewed labels: LIVE in hot, LEADER in lime, category in outline, DNF in hot outline. |
| card | Card | Personal result: giant finish time, position out of field, pace per km, a stripe band on top. |
| navbar | Navbar | Condensed uppercase wordmark, links, a lime register action. Mobile menu is a details disclosure with large uppercase rows. |
| modal | Modal and sheet | Hard-edged sheet with a lime top bar, uppercase title, two actions. |
| table | Table | Leaderboard with rank, bib, name, category, two splits and finish, tabular numerals, the leader row marked with a lime rank cell. |
| bento | Bento grid | 2x2 giant finish time, a pace bar chart, field size stat, weather and course tile, a stripe band tile. |
| empty-state | Empty state | A stripe band, "No results yet" in condensed uppercase, one line, one action. |
| toast | Toast | Hard-edged bar with a skewed label and tabular time. |

App page name: `Race results`.

`theme.css`:
```css
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-*: initial;
  --color-bg: #F2F2EC;
  --color-surface: #FBFBF6;
  --color-ink: #0D0D0C;
  --color-muted: #57574F;
  --color-line: #CFCFC5;
  --color-edge: #6E6E66;
  --color-accent: #C6F432;
  --color-accent-ink: #0D0D0C;
  --color-hot: #C2321A;
  --color-hot-ink: #FBFBF6;

  --font-display: "Big Shoulders Display", ui-sans-serif, sans-serif;
  --font-body: "Barlow", ui-sans-serif, sans-serif;

  --text-*: initial;
  --text-xs: 0.75rem;
  --text-xs--line-height: 1.4;
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.45;
  --text-base: 1rem;
  --text-base--line-height: 1.55;
  --text-lg: 1.625rem;
  --text-lg--line-height: 1.1;
  --text-xl: 2.625rem;
  --text-xl--line-height: 0.95;
  --text-2xl: 4.25rem;
  --text-2xl--line-height: 0.9;
  --text-display: 6.875rem;
  --text-display--line-height: 0.85;

  --radius-*: initial;
  --shadow-*: initial;

  --ease-sprint: cubic-bezier(0.2, 0.9, 0.1, 1);
}

@utility bg-stripes { background-image: repeating-linear-gradient(-45deg, currentColor 0 6px, transparent 6px 14px); }

@layer base {
  .dark {
    --color-bg: #0D0D0C;
    --color-surface: #171716;
    --color-ink: #F2F2EC;
    --color-muted: #A3A39A;
    --color-line: #2E2E2B;
    --color-edge: #7A7A72;
    --color-accent: #C6F432;
    --color-accent-ink: #0D0D0C;
    --color-hot: #FF4D2E;
    --color-hot-ink: #0D0D0C;
  }
  body {
    background: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }
}
```

---

### Task 5: Verification

- [ ] **Step 1:** Run `npx ng test --watch=false`, `npm run test:scripts`, `npm run check:systems` (expect ten systems) and `npm run build:pages`. All must pass.
- [ ] **Step 2:** Restart the dev server and open `/` at 375 and 1280. Expect 10 tiles, with the bento repeating cleanly. Then open each new system's components and pages sections.
- [ ] **Step 3:** Commit any fixes with `git commit -m "fix: address issues from verification of systems 07 to 10"`. Skip this if nothing changed.
