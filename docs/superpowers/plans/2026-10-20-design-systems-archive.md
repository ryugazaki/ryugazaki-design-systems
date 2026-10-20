# Design Systems Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Angular + Tailwind web app that catalogs six anti-slop design systems (pure HTML + Tailwind v4 CDN), previews them, and exports each as AI-ready markdown.

**Architecture:** Design systems are static files in `public/systems/<slug>/` (manifest, theme, HTML files with marker comments). The Angular SPA fetches them at runtime, renders previews in sandboxed `srcdoc` iframes, and builds the "Copy for AI" markdown with a pure function. A dependency-free Node script validates and lints the content.

**Tech Stack:** Angular 22 (standalone, signals, zoneless, Vitest), Tailwind CSS 4.3 via `@tailwindcss/postcss` for the shell, `@tailwindcss/browser@4` CDN inside design system files, Node 24 `node:test` for scripts.

**Spec:** `docs/superpowers/specs/2026-10-20-design-systems-archive-design.md`

## Global Constraints

- English for all UI copy, prompts, manifests, and page content.
- Mobile first: every screen and every design system file must work at 375 px wide before scaling up.
- Shell palette (exact): paper `#ECE8DD` / `#141310`, ink `#17150F` / `#E8E3D6`, graphite `#5B574D` / `#9C978A`, signal `#D23F1A` / `#F0582F` (light / dark).
- Shell fonts: Schibsted Grotesk (display, UI), IBM Plex Mono (metadata, numbers, code). Radius 0, no shadows, motion 120 ms ease-out, respect `prefers-reduced-motion`.
- Shell type scale (exact): `meta` 12px, `body` 15px, `title` 20px, `heading` 36px, `display` 64px, `display-lg` 112px.
- Copy rules everywhere (shell and systems): no em dash (U+2014) or `--` as a sentence pause, no emoji in headings, no "unlock", "seamless", "elevate", "supercharge", "empower", no "X, reimagined", no lorem ipsum, sentence case.
- Banned fonts: Inter, Poppins, Roboto, Montserrat, Open Sans, Space Grotesk.
- No decorative gradients, glows, glassmorphism (`backdrop-blur`), `shadow-xl`, `shadow-2xl`, or default Tailwind palette classes (`bg-indigo-500` and similar).
- Design system HTML files: no JavaScript other than the Tailwind CDN script. Interactivity is shown as static states; disclosure uses `<details>`.
- Tap targets at least 44 px; visible focus states; WCAG AA text contrast.
- Tailwind CDN URL (exact): `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4`
- Markers (exact): `<!-- snippet:start -->`, `<!-- snippet:end -->`, `/* theme:start */`, `/* theme:end */`.
- Commit after every task. Do not push.

---

## File Map

```
.postcssrc.json                         Tailwind PostCSS plugin for the shell
package.json                            + check:systems, sync:themes, test:scripts scripts
src/index.html                          shell font links
src/styles.css                          shell Tailwind theme
src/app/app.ts                          shell layout: header, outlet, toast
src/app/app.config.ts                   router (component input binding), HttpClient (fetch)
src/app/app.routes.ts                   '', 's/:slug', 's/:slug/:section'
src/app/core/models.ts                  shared types and SECTIONS
src/app/core/manifest.ts                validateManifest / isManifest
src/app/core/snippet.ts                 extractSnippet / dedent
src/app/core/preview-doc.ts             buildPreviewDoc
src/app/core/prompt-builder.ts          buildPrompt / estimateTokens
src/app/core/systems.service.ts         fetch + cache index, manifests, bundles, anti-slop
src/app/core/clipboard.service.ts       copy(text): Promise<boolean>
src/app/core/toast.service.ts           message signal + show()
src/app/core/shell-theme.service.ts     shell light/dark mode, persisted
src/app/shared/ui/toast.ts              live-region toast
src/app/shared/ui/tag-chip.ts           pressable filter chip
src/app/shared/ui/code-block.ts         pre + copy button
src/app/shared/ui/copy-fallback-sheet.ts manual-copy sheet
src/app/features/catalog/catalog-filter.ts   filterEntries / collectTags / tileSpan
src/app/features/catalog/catalog-tile.ts     bento tile with live thumbnail
src/app/features/catalog/catalog.ts          catalog page
src/app/features/preview-frame/preview-frame.ts     scaled srcdoc iframe
src/app/features/preview-frame/preview-controls.ts  viewport + mode toggles
src/app/features/system-detail/system-detail.ts      detail page, loads bundle
src/app/features/system-detail/copy-bar.ts           Copy for AI bar
src/app/features/system-detail/preview-item.ts       one component/page: preview or code
src/app/features/system-detail/sections/overview-section.ts
src/app/features/system-detail/sections/tokens-section.ts
src/app/features/system-detail/sections/items-section.ts   used for components and pages
src/app/features/system-detail/sections/rules-section.ts
scripts/lib/systems-lib.mjs             validation, lint, sync logic
scripts/lib/systems-lib.test.mjs        node:test suite
scripts/check-systems.mjs               CLI
scripts/sync-themes.mjs                 CLI
public/systems/index.json               registry
public/systems/_global/anti-slop.md     global rules
public/systems/<slug>/...               six systems
```

---

### Task 1: Scaffold Angular + Tailwind shell

**Files:**
- Create (generated): Angular workspace in repo root
- Create: `.postcssrc.json`, `src/app/core/shell-theme.service.ts`, `src/app/core/shell-theme.service.spec.ts`, `src/app/core/models.ts`
- Modify: `src/index.html`, `src/styles.css`, `src/app/app.ts`, `src/app/app.config.ts`, `src/app/app.routes.ts`
- Delete: `src/app/app.html`, `src/app/app.css`, `src/app/app.spec.ts` (if generated)

**Interfaces:**
- Produces: `ColorMode` type (`'light' | 'dark'`) in `src/app/core/models.ts`; `ShellThemeService` with `mode: Signal<ColorMode>` and `toggle(): void`; shell Tailwind utilities `bg-paper text-ink border-ink text-graphite text-signal`, `text-meta|body|title|heading|display|display-lg`, `font-sans font-mono`.

- [ ] **Step 1: Generate the workspace into the existing repo**

Run from the repo root:
```bash
npx @angular/cli@22 new ryugazaki-archive --directory=. --style=css --routing --ssr=false --skip-git --test-runner=vitest --ai-config=none --defaults
```
Expected: workspace files created next to `docs/`, dependencies installed. If the CLI refuses because the folder is not empty, generate into `../ryugazaki-archive-tmp` with the same flags, then move everything except `.git` into the repo root and delete the temp folder.

- [ ] **Step 2: Install Tailwind for the shell**

```bash
npm install tailwindcss@4 @tailwindcss/postcss@4 postcss
```

Create `.postcssrc.json`:
```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

- [ ] **Step 3: Write the shell theme**

Replace `src/styles.css`:
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-*: initial;
  --color-paper: #ECE8DD;
  --color-ink: #17150F;
  --color-graphite: #5B574D;
  --color-signal: #D23F1A;

  --font-sans: "Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --text-*: initial;
  --text-meta: 0.75rem;
  --text-meta--line-height: 1.4;
  --text-body: 0.9375rem;
  --text-body--line-height: 1.5;
  --text-title: 1.25rem;
  --text-title--line-height: 1.2;
  --text-heading: 2.25rem;
  --text-heading--line-height: 1;
  --text-display: 4rem;
  --text-display--line-height: 0.92;
  --text-display-lg: 7rem;
  --text-display-lg--line-height: 0.88;

  --radius-*: initial;
  --shadow-*: initial;
  --default-transition-duration: 120ms;
  --default-transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
}

@layer base {
  .dark {
    --color-paper: #141310;
    --color-ink: #E8E3D6;
    --color-graphite: #9C978A;
    --color-signal: #F0582F;
  }
  html {
    background: var(--color-paper);
    color: var(--color-ink);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  ::selection {
    background: var(--color-ink);
    color: var(--color-paper);
  }
  :focus-visible {
    outline: 2px solid var(--color-signal);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      transition: none !important;
      animation: none !important;
    }
  }
}
```

In `src/index.html`, set `<title>Ryugazaki Archive</title>` and add inside `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Schibsted+Grotesk:wght@400;500;700;800&display=swap">
<meta name="theme-color" content="#ECE8DD">
```

- [ ] **Step 4: Write the failing test for ShellThemeService**

Create `src/app/core/models.ts` (only this type for now; Task 2 extends the file):
```ts
export type ColorMode = 'light' | 'dark';
```

Create `src/app/core/shell-theme.service.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { ShellThemeService } from './shell-theme.service';

describe('ShellThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    TestBed.resetTestingModule();
  });

  it('restores the saved mode and applies it to <html>', () => {
    localStorage.setItem('archive-theme', 'dark');
    const service = TestBed.inject(ShellThemeService);
    expect(service.mode()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles, persists, and updates the dark class', () => {
    localStorage.setItem('archive-theme', 'light');
    const service = TestBed.inject(ShellThemeService);
    service.toggle();
    expect(service.mode()).toBe('dark');
    expect(localStorage.getItem('archive-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    service.toggle();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
```

- [ ] **Step 5: Run the test to see it fail**

Run: `npx ng test --watch=false`
Expected: FAIL, cannot resolve `./shell-theme.service`.

- [ ] **Step 6: Implement ShellThemeService**

Create `src/app/core/shell-theme.service.ts`:
```ts
import { Injectable, signal } from '@angular/core';
import { ColorMode } from './models';

const STORAGE_KEY = 'archive-theme';

@Injectable({ providedIn: 'root' })
export class ShellThemeService {
  readonly mode = signal<ColorMode>(this.initialMode());

  constructor() {
    this.apply(this.mode());
  }

  toggle(): void {
    const next: ColorMode = this.mode() === 'dark' ? 'light' : 'dark';
    this.mode.set(next);
    localStorage.setItem(STORAGE_KEY, next);
    this.apply(next);
  }

  private apply(mode: ColorMode): void {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }

  private initialMode(): ColorMode {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    const prefersDark =
      typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}
```

- [ ] **Step 7: Write the shell layout, routes, and config**

Delete `src/app/app.html`, `src/app/app.css`, and `src/app/app.spec.ts` if they exist.

Replace `src/app/app.ts`:
```ts
import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ShellThemeService } from './core/shell-theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="flex items-center justify-between border-b border-ink px-4 font-mono text-meta md:px-8">
      <a routerLink="/" class="flex min-h-11 items-center hover:text-signal">ryugazaki / archive</a>
      <button
        type="button"
        class="-mr-2 min-h-11 px-2 hover:text-signal"
        [attr.aria-label]="'Switch to ' + nextMode() + ' theme'"
        (click)="theme.toggle()"
      >
        {{ nextMode() }}
      </button>
    </header>
    <main>
      <router-outlet />
    </main>
  `,
})
export class App {
  protected readonly theme = inject(ShellThemeService);
  protected nextMode(): string {
    return this.theme.mode() === 'dark' ? 'light' : 'dark';
  }
}
```

Replace `src/app/app.routes.ts` (detail routes are added in Task 9; for now only the catalog exists):
```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/catalog/catalog').then((m) => m.Catalog) },
  { path: '**', redirectTo: '' },
];
```

Create a temporary `src/app/features/catalog/catalog.ts` (replaced in Task 7):
```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-catalog',
  template: `<h1 class="px-4 pt-6 text-display font-extrabold tracking-[-0.03em]">Specimens<br />for agents</h1>`,
})
export class Catalog {}
```

Replace `src/app/app.config.ts`, keeping any providers the generator added that are not listed here (for example `provideBrowserGlobalErrorListeners()`, `provideZonelessChangeDetection()`):
```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
  ],
};
```

- [ ] **Step 8: Verify tests and build pass**

Run: `npx ng test --watch=false`
Expected: 2 tests pass.

Run: `npx ng build`
Expected: build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Angular shell with Tailwind v4 and theme service"
```

---

### Task 2: Core models, manifest validation, snippet extraction

**Files:**
- Modify: `src/app/core/models.ts`
- Create: `src/app/core/manifest.ts`, `src/app/core/manifest.spec.ts`, `src/app/core/testing/fixtures.ts`, `src/app/core/snippet.ts`, `src/app/core/snippet.spec.ts`

**Interfaces:**
- Produces:
  - Types `FontSpec, PaletteEntry, TypeScale, AllowedGradient, ComponentEntry, PageEntry, Manifest, LoadedItem, SystemBundle, CatalogEntry, Section`, const `SECTIONS`.
  - `validateManifest(value: unknown): string[]`, `isManifest(value: unknown): value is Manifest`
  - `SNIPPET_START`, `SNIPPET_END`, `extractSnippet(html: string): string | null`, `dedent(text: string): string`

- [ ] **Step 1: Write the full models file**

Replace `src/app/core/models.ts`:
```ts
export type ColorMode = 'light' | 'dark';

export interface FontSpec {
  family: string;
  role: string;
  weights: number[];
  googleFontsUrl: string;
}

export interface PaletteEntry {
  token: string;
  light: string;
  dark: string;
  role: string;
}

export interface TypeScale {
  ratio: number;
  steps: Record<string, string>;
}

export interface AllowedGradient {
  pattern: string;
  reason: string;
}

export interface ComponentEntry {
  id: string;
  name: string;
  file: string;
  notes: string;
}

export interface PageEntry {
  id: string;
  name: string;
  file: string;
}

export interface Manifest {
  slug: string;
  number: number;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  defaultMode: ColorMode;
  useCases: string[];
  fonts: FontSpec[];
  typeScale: TypeScale;
  palette: PaletteEntry[];
  allowedGradients: AllowedGradient[];
  rules: { do: string[]; dont: string[] };
  components: ComponentEntry[];
  pages: PageEntry[];
}

/** A component or page after its file was fetched. snippet is null when the file failed to load or has no markers. */
export interface LoadedItem {
  id: string;
  name: string;
  notes: string;
  file: string;
  snippet: string | null;
}

export interface SystemBundle {
  manifest: Manifest;
  theme: string;
  components: LoadedItem[];
  pages: LoadedItem[];
}

/** manifest is null when it failed to load or validate. */
export interface CatalogEntry {
  slug: string;
  manifest: Manifest | null;
}

export const SECTIONS = ['overview', 'tokens', 'components', 'pages', 'rules'] as const;
export type Section = (typeof SECTIONS)[number];
```

- [ ] **Step 2: Write failing tests for manifest validation**

Create `src/app/core/testing/fixtures.ts` (shared by several spec files; importing one spec from another would register its tests twice):
```ts
export const validManifest = {
  slug: 'neo-brutalist',
  number: 2,
  name: 'Neo-Brutalist',
  tagline: 'Thick rules, hard shadows, loud primaries.',
  description: 'Loud and honest.',
  tags: ['bold'],
  defaultMode: 'light',
  useCases: ['dev tools'],
  fonts: [{ family: 'Archivo', role: 'display', weights: [800], googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Archivo' }],
  typeScale: { ratio: 1.414, steps: { base: '16px', display: '64px' } },
  palette: [{ token: '--color-yolk', light: '#F4D23C', dark: '#F4D23C', role: 'accent' }],
  allowedGradients: [],
  rules: { do: ['Use hard shadows'], dont: ['Do not blur'] },
  components: [{ id: 'button', name: 'Button', file: 'components/button.html', notes: 'Three variants.' }],
  pages: [{ id: 'landing', name: 'Landing', file: 'pages/landing.html' }],
};
```

Create `src/app/core/manifest.spec.ts`:
```ts
import { isManifest, validateManifest } from './manifest';
import { validManifest } from './testing/fixtures';

describe('validateManifest', () => {
  it('accepts a complete manifest', () => {
    expect(validateManifest(validManifest)).toEqual([]);
    expect(isManifest(validManifest)).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(validateManifest(null)).toEqual(['manifest is not an object']);
  });

  it('reports each missing or malformed field', () => {
    const broken = { ...validManifest, name: '', defaultMode: 'sepia', components: [{ id: 'x' }] };
    const errors = validateManifest(broken);
    expect(errors).toContain('name must be a non-empty string');
    expect(errors).toContain('defaultMode must be "light" or "dark"');
    expect(errors).toContain('components[0] needs id, name, file, notes');
    expect(isManifest(broken)).toBe(false);
  });
});
```

- [ ] **Step 3: Write failing tests for snippet extraction**

Create `src/app/core/snippet.spec.ts`:
```ts
import { dedent, extractSnippet } from './snippet';

describe('extractSnippet', () => {
  it('returns the dedented content between markers', () => {
    const html = [
      '<body>',
      '  <!-- snippet:start -->',
      '    <button class="a">',
      '      Go',
      '    </button>',
      '  <!-- snippet:end -->',
      '</body>',
    ].join('\r\n');
    expect(extractSnippet(html)).toBe('<button class="a">\n  Go\n</button>');
  });

  it('returns null when a marker is missing or out of order', () => {
    expect(extractSnippet('<p>no markers</p>')).toBeNull();
    expect(extractSnippet('<!-- snippet:end --><!-- snippet:start -->')).toBeNull();
  });
});

describe('dedent', () => {
  it('ignores blank lines when measuring indentation', () => {
    expect(dedent('\n    a\n\n      b\n')).toBe('a\n\n  b');
  });
});
```

- [ ] **Step 4: Run tests to see them fail**

Run: `npx ng test --watch=false`
Expected: FAIL, cannot resolve `./manifest` and `./snippet`.

- [ ] **Step 5: Implement manifest validation**

Create `src/app/core/manifest.ts`:
```ts
import { Manifest } from './models';

const isText = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isTextList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isText);

/** Returns a list of human-readable problems; empty means valid. Mirrors scripts/lib/systems-lib.mjs. */
export function validateManifest(value: unknown): string[] {
  if (typeof value !== 'object' || value === null) return ['manifest is not an object'];
  const m = value as Record<string, unknown>;
  const errors: string[] = [];

  for (const key of ['slug', 'name', 'tagline', 'description']) {
    if (!isText(m[key])) errors.push(`${key} must be a non-empty string`);
  }
  if (typeof m['number'] !== 'number') errors.push('number must be a number');
  for (const key of ['tags', 'useCases']) {
    if (!isTextList(m[key])) errors.push(`${key} must be a string array`);
  }
  if (m['defaultMode'] !== 'light' && m['defaultMode'] !== 'dark') {
    errors.push('defaultMode must be "light" or "dark"');
  }
  for (const key of ['fonts', 'palette']) {
    const list = m[key];
    if (!Array.isArray(list) || list.length === 0) errors.push(`${key} must be a non-empty array`);
  }
  if (!Array.isArray(m['allowedGradients'])) errors.push('allowedGradients must be an array');

  const scale = m['typeScale'] as Record<string, unknown> | undefined;
  if (!scale || typeof scale['ratio'] !== 'number' || typeof scale['steps'] !== 'object' || scale['steps'] === null) {
    errors.push('typeScale must have ratio and steps');
  }
  const rules = m['rules'] as Record<string, unknown> | undefined;
  if (!rules || !isTextList(rules['do']) || !isTextList(rules['dont'])) {
    errors.push('rules must have do and dont string arrays');
  }

  for (const key of ['components', 'pages']) {
    const list = m[key];
    if (!Array.isArray(list)) {
      errors.push(`${key} must be an array`);
      continue;
    }
    list.forEach((raw, i) => {
      const item = (raw ?? {}) as Record<string, unknown>;
      const needsNotes = key === 'components';
      const ok = isText(item['id']) && isText(item['name']) && isText(item['file']) && (!needsNotes || isText(item['notes']));
      if (!ok) errors.push(`${key}[${i}] needs id, name, file${needsNotes ? ', notes' : ''}`);
    });
  }
  return errors;
}

export function isManifest(value: unknown): value is Manifest {
  return validateManifest(value).length === 0;
}
```

- [ ] **Step 6: Implement snippet extraction**

Create `src/app/core/snippet.ts`:
```ts
export const SNIPPET_START = '<!-- snippet:start -->';
export const SNIPPET_END = '<!-- snippet:end -->';

export function extractSnippet(html: string): string | null {
  const start = html.indexOf(SNIPPET_START);
  const end = html.indexOf(SNIPPET_END);
  if (start === -1 || end === -1 || end < start) return null;
  return dedent(html.slice(start + SNIPPET_START.length, end));
}

export function dedent(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  const indents = lines.filter((l) => l.trim() !== '').map((l) => /^[ \t]*/.exec(l)![0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}
```

- [ ] **Step 7: Run tests to see them pass**

Run: `npx ng test --watch=false`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/app/core
git commit -m "feat(core): add models, manifest validation, and snippet extraction"
```

---

### Task 3: Preview document and prompt builder

**Files:**
- Create: `src/app/core/preview-doc.ts`, `src/app/core/preview-doc.spec.ts`, `src/app/core/prompt-builder.ts`, `src/app/core/prompt-builder.spec.ts`

**Interfaces:**
- Consumes: `FontSpec`, `ColorMode`, `SystemBundle`, `LoadedItem` from `models.ts`.
- Produces:
  - `TAILWIND_CDN: string`, `PREVIEW_HEIGHT_MESSAGE = 'archive-preview-height'`
  - `buildPreviewDoc(snippet: string, options: PreviewOptions): string` with `PreviewOptions { theme: string; fonts: FontSpec[]; mode: ColorMode; padded: boolean }`. The document posts `{ type: 'archive-preview-height', height: number }` to its parent.
  - `buildPrompt(bundle: SystemBundle, antiSlop: string): string`, `estimateTokens(text: string): number`

- [ ] **Step 1: Write failing tests for the preview document**

Create `src/app/core/preview-doc.spec.ts`:
```ts
import { buildPreviewDoc, PREVIEW_HEIGHT_MESSAGE, TAILWIND_CDN } from './preview-doc';

const fonts = [{ family: 'Archivo', role: 'display', weights: [800], googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Archivo&display=swap' }];

describe('buildPreviewDoc', () => {
  it('wraps the snippet with CDN, fonts, and theme', () => {
    const doc = buildPreviewDoc('<button>Go</button>', { theme: '@theme { --color-ink: #111; }', fonts, mode: 'light', padded: true });
    expect(doc.startsWith('<!doctype html>')).toBe(true);
    expect(doc).toContain(`<script src="${TAILWIND_CDN}"></script>`);
    expect(doc).toContain('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo&display=swap">');
    expect(doc).toContain('<style type="text/tailwindcss">\n@theme { --color-ink: #111; }\n</style>');
    expect(doc).toContain('<body class="p-6">\n<button>Go</button>');
    expect(doc).toContain(PREVIEW_HEIGHT_MESSAGE);
    expect(doc).toContain('<html lang="en">');
  });

  it('adds the dark class and drops padding when asked', () => {
    const doc = buildPreviewDoc('<main></main>', { theme: '', fonts: [], mode: 'dark', padded: false });
    expect(doc).toContain('<html lang="en" class="dark">');
    expect(doc).toContain('<body>\n<main></main>');
  });
});
```

- [ ] **Step 2: Write failing tests for the prompt builder**

Create `src/app/core/prompt-builder.spec.ts`:
```ts
import { SystemBundle } from './models';
import { buildPrompt, estimateTokens } from './prompt-builder';

const bundle: SystemBundle = {
  manifest: {
    slug: 'neo-brutalist',
    number: 2,
    name: 'Neo-Brutalist',
    tagline: 'Thick rules, hard shadows, loud primaries.',
    description: 'Loud and honest.',
    tags: ['bold', 'playful'],
    defaultMode: 'light',
    useCases: ['dev tools', 'indie launches'],
    fonts: [{ family: 'Archivo', role: 'display', weights: [800, 900], googleFontsUrl: 'https://fonts.example/archivo' }],
    typeScale: { ratio: 1.414, steps: { base: '16px', display: '64px' } },
    palette: [{ token: '--color-yolk', light: '#F4D23C', dark: '#F4D23C', role: 'accent' }],
    allowedGradients: [],
    rules: { do: ['Use hard shadows'], dont: ['Do not blur'] },
    components: [],
    pages: [],
  },
  theme: '@theme { --color-yolk: #F4D23C; }',
  components: [
    { id: 'button', name: 'Button', notes: 'Three variants.', file: 'components/button.html', snippet: '<button>Go</button>' },
    { id: 'card', name: 'Card', notes: 'One card.', file: 'components/card.html', snippet: null },
  ],
  pages: [{ id: 'landing', name: 'Landing', notes: '', file: 'pages/landing.html', snippet: '<main>Hi</main>' }],
};

describe('buildPrompt', () => {
  const md = buildPrompt(bundle, '1. No gradients.\n');

  it('emits every section in order', () => {
    const order = ['# Design system: Neo-Brutalist (No. 02)', '## Identity', '## Fonts', '## Tokens', '## Type scale', '## Rules', '## Global anti-slop rules', '## Components', '## Pages', '## Before you finish'];
    const positions = order.map((h) => md.indexOf(h));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('includes tokens, theme, rules, and snippets', () => {
    expect(md).toContain('| `--color-yolk` | #F4D23C | #F4D23C | accent |');
    expect(md).toContain('```css\n@theme { --color-yolk: #F4D23C; }\n```');
    expect(md).toContain('- Use hard shadows');
    expect(md).toContain('- Do not blur');
    expect(md).toContain('1. No gradients.');
    expect(md).toContain('### Button\n\nThree variants.\n\n```html\n<button>Go</button>\n```');
    expect(md).toContain('```html\n<main>Hi</main>\n```');
    expect(md).toContain('- `text-display`: 64px');
  });

  it('notes files that could not be loaded', () => {
    expect(md).toContain('> Note: `components/card.html` could not be loaded and is omitted.');
  });

  it('is deterministic and contains no em dash', () => {
    expect(buildPrompt(bundle, '1. No gradients.\n')).toBe(md);
    expect(md).not.toContain('—');
  });
});

describe('estimateTokens', () => {
  it('approximates four characters per token', () => {
    expect(estimateTokens('abcdefgh')).toBe(2);
    expect(estimateTokens('abc')).toBe(1);
  });
});
```

- [ ] **Step 3: Run tests to see them fail**

Run: `npx ng test --watch=false`
Expected: FAIL, cannot resolve `./preview-doc` and `./prompt-builder`.

- [ ] **Step 4: Implement the preview document**

Create `src/app/core/preview-doc.ts`:
```ts
import { ColorMode, FontSpec } from './models';

export const TAILWIND_CDN = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';
export const PREVIEW_HEIGHT_MESSAGE = 'archive-preview-height';

export interface PreviewOptions {
  theme: string;
  fonts: FontSpec[];
  mode: ColorMode;
  padded: boolean;
}

const HEIGHT_REPORTER =
  '<script>(function(){function send(){parent.postMessage({type:"' +
  PREVIEW_HEIGHT_MESSAGE +
  '",height:Math.ceil(document.body.getBoundingClientRect().height)},"*");}' +
  'new ResizeObserver(send).observe(document.body);addEventListener("load",send);})();</script>';

export function buildPreviewDoc(snippet: string, options: PreviewOptions): string {
  return [
    '<!doctype html>',
    `<html lang="en"${options.mode === 'dark' ? ' class="dark"' : ''}>`,
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    ...options.fonts.map((f) => `<link rel="stylesheet" href="${f.googleFontsUrl}">`),
    `<script src="${TAILWIND_CDN}"></script>`,
    `<style type="text/tailwindcss">\n${options.theme}\n</style>`,
    '</head>',
    `<body${options.padded ? ' class="p-6"' : ''}>`,
    snippet,
    HEIGHT_REPORTER,
    '</body>',
    '</html>',
  ].join('\n');
}
```

- [ ] **Step 5: Implement the prompt builder**

Create `src/app/core/prompt-builder.ts`:
```ts
import { LoadedItem, SystemBundle } from './models';

const pad2 = (n: number) => String(n).padStart(2, '0');
const fence = (lang: string, body: string) => '```' + lang + '\n' + body.trim() + '\n```';

function itemsSection(title: string, items: LoadedItem[]): string[] {
  const out = [`## ${title}`, ''];
  for (const item of items) {
    out.push(`### ${item.name}`, '');
    if (item.notes) out.push(item.notes, '');
    out.push(
      item.snippet === null
        ? `> Note: \`${item.file}\` could not be loaded and is omitted.`
        : fence('html', item.snippet),
      '',
    );
  }
  return out;
}

export function buildPrompt(bundle: SystemBundle, antiSlop: string): string {
  const m = bundle.manifest;
  const lines = [
    `# Design system: ${m.name} (No. ${pad2(m.number)})`,
    '',
    'Follow this design system strictly. Adapt the HTML below to the target stack (React, Vue, Svelte, plain HTML, or anything else) without changing the visual result: keep the tokens, fonts, spacing, and component structure.',
    '',
    '## Identity',
    '',
    `**${m.tagline}**`,
    '',
    m.description,
    '',
    `- Use cases: ${m.useCases.join(', ')}`,
    `- Tags: ${m.tags.join(', ')}`,
    `- Default color mode: ${m.defaultMode}`,
    '',
    '## Fonts',
    '',
    ...m.fonts.map((f) => `- **${f.family}** (${f.role}), weights ${f.weights.join(', ')}: ${f.googleFontsUrl}`),
    '',
    '## Tokens',
    '',
    '| Token | Light | Dark | Role |',
    '|---|---|---|---|',
    ...m.palette.map((p) => `| \`${p.token}\` | ${p.light} | ${p.dark} | ${p.role} |`),
    '',
    'Tailwind v4 theme. Put it in a `<style type="text/tailwindcss">` block when using the browser CDN, or in your main CSS file after `@import "tailwindcss";`. Dark mode is the `dark` class on `<html>`.',
    '',
    fence('css', bundle.theme),
    '',
    '## Type scale',
    '',
    `Ratio ${m.typeScale.ratio}. Spacing, radius, shadow, and motion come from the theme block above.`,
    '',
    ...Object.entries(m.typeScale.steps).map(([step, size]) => `- \`text-${step}\`: ${size}`),
    '',
    '## Rules',
    '',
    '### Do',
    '',
    ...m.rules.do.map((r) => `- ${r}`),
    '',
    "### Don't",
    '',
    ...m.rules.dont.map((r) => `- ${r}`),
    '',
    '## Global anti-slop rules',
    '',
    antiSlop.trim(),
    '',
    ...itemsSection('Components', bundle.components),
    ...itemsSection('Pages', bundle.pages),
    '## Before you finish',
    '',
    'Check your output against every rule above: only the fonts and tokens listed here, no default Tailwind colors, no decorative gradients, no em dashes in copy, and layouts that follow the component patterns shown.',
  ];
  return lines.join('\n') + '\n';
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
```

- [ ] **Step 6: Run tests to see them pass**

Run: `npx ng test --watch=false`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/core
git commit -m "feat(core): add preview document and Copy for AI prompt builder"
```

---

### Task 4: Systems service

**Files:**
- Create: `src/app/core/systems.service.ts`, `src/app/core/systems.service.spec.ts`

**Interfaces:**
- Consumes: `validateManifest` (Task 2), `extractSnippet` (Task 2), models.
- Produces: `SYSTEMS_BASE = '/systems'`; `SystemsService` with
  - `fileUrl(slug: string, file: string): string`
  - `loadIndex(): Promise<CatalogEntry[]>` (rejects only if `index.json` fails)
  - `loadManifest(slug: string): Promise<Manifest>` (rejects with `HttpErrorResponse` on HTTP failure, `Error` on invalid manifest)
  - `loadBundle(slug: string): Promise<SystemBundle>` (cached; failures not cached; failed item files become `snippet: null`)
  - `loadAntiSlop(): Promise<string>` (cached; failures not cached)

- [ ] **Step 1: Write failing tests**

Create `src/app/core/systems.service.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SystemsService } from './systems.service';
import { validManifest } from './testing/fixtures';

const flush = () => new Promise((r) => setTimeout(r));

describe('SystemsService', () => {
  let service: SystemsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SystemsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the index and marks broken manifests as null', async () => {
    const result = service.loadIndex();
    http.expectOne('/systems/index.json').flush({ systems: ['neo-brutalist', 'broken'] });
    await flush();
    http.expectOne('/systems/neo-brutalist/manifest.json').flush(validManifest);
    http.expectOne('/systems/broken/manifest.json').flush({ slug: 'broken' });
    const entries = await result;
    expect(entries.map((e) => e.slug)).toEqual(['neo-brutalist', 'broken']);
    expect(entries[0].manifest?.name).toBe('Neo-Brutalist');
    expect(entries[1].manifest).toBeNull();
  });

  it('loads a bundle, extracts snippets, and tolerates a missing file', async () => {
    const result = service.loadBundle('neo-brutalist');
    http.expectOne('/systems/neo-brutalist/manifest.json').flush(validManifest);
    await flush();
    http.expectOne('/systems/neo-brutalist/theme.css').flush('@theme {}');
    http.expectOne('/systems/neo-brutalist/components/button.html').flush('<!-- snippet:start --><button>Go</button><!-- snippet:end -->');
    http.expectOne('/systems/neo-brutalist/pages/landing.html').flush('missing', { status: 404, statusText: 'Not Found' });
    const bundle = await result;
    expect(bundle.theme).toBe('@theme {}');
    expect(bundle.components[0]).toEqual({ id: 'button', name: 'Button', notes: 'Three variants.', file: 'components/button.html', snippet: '<button>Go</button>' });
    expect(bundle.pages[0].snippet).toBeNull();

    expect(await service.loadBundle('neo-brutalist')).toBe(bundle);
  });

  it('does not cache a failed bundle', async () => {
    const first = service.loadBundle('nope');
    http.expectOne('/systems/nope/manifest.json').flush('missing', { status: 404, statusText: 'Not Found' });
    await expect(first).rejects.toMatchObject({ status: 404 });
    service.loadBundle('nope').catch(() => undefined);
    http.expectOne('/systems/nope/manifest.json').flush('missing', { status: 404, statusText: 'Not Found' });
  });

  it('caches the anti-slop rules', async () => {
    const first = service.loadAntiSlop();
    http.expectOne('/systems/_global/anti-slop.md').flush('1. No gradients.');
    expect(await first).toBe('1. No gradients.');
    expect(await service.loadAntiSlop()).toBe('1. No gradients.');
  });
});
```

- [ ] **Step 2: Run tests to see them fail**

Run: `npx ng test --watch=false`
Expected: FAIL, cannot resolve `./systems.service`.

- [ ] **Step 3: Implement the service**

Create `src/app/core/systems.service.ts`:
```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { validateManifest } from './manifest';
import { CatalogEntry, LoadedItem, Manifest, SystemBundle } from './models';
import { extractSnippet } from './snippet';

export const SYSTEMS_BASE = '/systems';

@Injectable({ providedIn: 'root' })
export class SystemsService {
  private readonly http = inject(HttpClient);
  private readonly bundles = new Map<string, Promise<SystemBundle>>();
  private antiSlop: Promise<string> | null = null;

  fileUrl(slug: string, file: string): string {
    return `${SYSTEMS_BASE}/${slug}/${file}`;
  }

  async loadIndex(): Promise<CatalogEntry[]> {
    const index = await firstValueFrom(this.http.get<{ systems: string[] }>(`${SYSTEMS_BASE}/index.json`));
    return Promise.all(
      index.systems.map(async (slug) => ({
        slug,
        manifest: await this.loadManifest(slug).catch(() => null),
      })),
    );
  }

  async loadManifest(slug: string): Promise<Manifest> {
    const raw = await firstValueFrom(this.http.get<unknown>(this.fileUrl(slug, 'manifest.json')));
    const errors = validateManifest(raw);
    if (errors.length) throw new Error(`Invalid manifest for ${slug}: ${errors.join('; ')}`);
    return raw as Manifest;
  }

  loadBundle(slug: string): Promise<SystemBundle> {
    let pending = this.bundles.get(slug);
    if (!pending) {
      pending = this.fetchBundle(slug);
      this.bundles.set(slug, pending);
      pending.catch(() => this.bundles.delete(slug));
    }
    return pending;
  }

  loadAntiSlop(): Promise<string> {
    if (!this.antiSlop) {
      const pending = this.text(`${SYSTEMS_BASE}/_global/anti-slop.md`);
      this.antiSlop = pending;
      pending.catch(() => (this.antiSlop = null));
    }
    return this.antiSlop;
  }

  private async fetchBundle(slug: string): Promise<SystemBundle> {
    const manifest = await this.loadManifest(slug);
    const [theme, components, pages] = await Promise.all([
      this.text(this.fileUrl(slug, 'theme.css')),
      Promise.all(manifest.components.map((c) => this.loadItem(slug, c.id, c.name, c.notes, c.file))),
      Promise.all(manifest.pages.map((p) => this.loadItem(slug, p.id, p.name, '', p.file))),
    ]);
    return { manifest, theme, components, pages };
  }

  private async loadItem(slug: string, id: string, name: string, notes: string, file: string): Promise<LoadedItem> {
    try {
      const html = await this.text(this.fileUrl(slug, file));
      return { id, name, notes, file, snippet: extractSnippet(html) };
    } catch {
      return { id, name, notes, file, snippet: null };
    }
  }

  private text(url: string): Promise<string> {
    return firstValueFrom(this.http.get(url, { responseType: 'text' }));
  }
}
```

- [ ] **Step 4: Run tests to see them pass**

Run: `npx ng test --watch=false`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/core
git commit -m "feat(core): add systems service with caching and partial-failure handling"
```

---

### Task 5: Content tooling (check, sync, anti-slop rules, registry)

**Files:**
- Create: `scripts/lib/systems-lib.mjs`, `scripts/lib/systems-lib.test.mjs`, `scripts/check-systems.mjs`, `scripts/sync-themes.mjs`, `public/systems/index.json`, `public/systems/_global/anti-slop.md`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `npm run check:systems` (exit 1 with a list on problems), `npm run sync:themes`, `npm run test:scripts`. Library exports: `MARKERS, TAILWIND_CDN, normalize, between, replaceBetween, validateManifest, lintFonts, lintGradients, lintPalette, lintCopy, lintOrnaments, lintTypeScale, checkSystem, checkAll, syncAll`.

- [ ] **Step 1: Write failing tests**

Create `scripts/lib/systems-lib.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  between, replaceBetween, lintFonts, lintGradients, lintPalette, lintCopy,
  lintOrnaments, lintTypeScale, checkAll, syncAll, MARKERS, TAILWIND_CDN,
} from './systems-lib.mjs';

test('between and replaceBetween', () => {
  const text = 'a /* theme:start */old/* theme:end */ b';
  assert.equal(between(text, MARKERS.themeStart, MARKERS.themeEnd), 'old');
  assert.equal(replaceBetween(text, MARKERS.themeStart, MARKERS.themeEnd, 'new'), 'a /* theme:start */\nnew\n/* theme:end */ b');
  assert.equal(between('none', MARKERS.themeStart, MARKERS.themeEnd), null);
});

test('lintFonts flags banned families only in font contexts', () => {
  assert.equal(lintFonts('font-family: "Inter", sans-serif;').length, 1);
  assert.equal(lintFonts('<link href="https://fonts.googleapis.com/css2?family=Open+Sans">').length, 1);
  assert.equal(lintFonts('<p>Interactive docs for Roboto fans</p>').length, 0);
  assert.equal(lintFonts('--font-body: "Instrument Sans";').length, 0);
});

test('lintGradients respects the allowlist', () => {
  assert.equal(lintGradients('<div class="bg-linear-to-r">', []).length, 1);
  assert.equal(lintGradients('background: linear-gradient(red, blue);', []).length, 1);
  assert.equal(lintGradients('<div class="mask-fade bg-linear-to-b">', [{ pattern: 'mask-fade', reason: 'scroll fade' }]).length, 0);
});

test('lintPalette flags default Tailwind palette classes', () => {
  assert.equal(lintPalette('<a class="bg-indigo-500 text-white">').length, 1);
  assert.equal(lintPalette('<a class="bg-blue text-ink">').length, 0);
});

test('lintCopy checks visible text only', () => {
  assert.equal(lintCopy('<p>Ship faster — today</p>').length, 1);
  assert.equal(lintCopy('<p>Ship faster -- today</p>').length, 1);
  assert.equal(lintCopy('<h2>Unlock your workflow</h2>').length, 1);
  assert.equal(lintCopy('<h1>Launch \u{1F680}</h1>').length, 1);
  assert.equal(lintCopy('<p>Lorem ipsum dolor</p>').length, 1);
  assert.equal(lintCopy('<style>:root{--color-ink:#111}</style><p>Plain words.</p><!-- a -- b -->').length, 0);
});

test('lintOrnaments flags blur and heavy shadows', () => {
  assert.equal(lintOrnaments('<div class="backdrop-blur-md shadow-2xl">').length, 2);
  assert.equal(lintOrnaments('<div class="shadow-hard">').length, 0);
});

test('lintTypeScale enforces ratio and display size', () => {
  assert.equal(lintTypeScale({ ratio: 1.414, steps: { base: '16px', display: '64px' } }).length, 0);
  assert.equal(lintTypeScale({ ratio: 1.2, steps: { base: '16px', display: '40px' } }).length, 2);
  assert.equal(lintTypeScale({ ratio: 1.5, steps: { display: '64px' } }).length, 1);
});

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'systems-'));
  await mkdir(path.join(root, '_global'), { recursive: true });
  await writeFile(path.join(root, '_global', 'anti-slop.md'), '1. Rule');
  await writeFile(path.join(root, 'index.json'), JSON.stringify({ systems: ['demo'] }));
  const dir = path.join(root, 'demo');
  await mkdir(path.join(dir, 'components'), { recursive: true });
  await mkdir(path.join(dir, 'pages'), { recursive: true });
  const font = 'https://fonts.googleapis.com/css2?family=Archivo&display=swap';
  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify({
    slug: 'demo', number: 1, name: 'Demo', tagline: 'A demo.', description: 'Demo system.',
    tags: ['demo'], defaultMode: 'light', useCases: ['tests'],
    fonts: [{ family: 'Archivo', role: 'all', weights: [400], googleFontsUrl: font }],
    typeScale: { ratio: 1.5, steps: { base: '16px', display: '64px' } },
    palette: [{ token: '--color-ink', light: '#111', dark: '#eee', role: 'text' }],
    allowedGradients: [], rules: { do: ['Be plain'], dont: ['Do not shout'] },
    components: [{ id: 'button', name: 'Button', file: 'components/button.html', notes: 'One button.' }],
    pages: [{ id: 'landing', name: 'Landing', file: 'pages/landing.html' }],
  }));
  await writeFile(path.join(dir, 'theme.css'), '@theme { --color-ink: #111; }\n');
  const html = (body) => `<!doctype html><html lang="en"><head><link rel="stylesheet" href="${font}"><script src="${TAILWIND_CDN}"></script><style type="text/tailwindcss">\n${MARKERS.themeStart}\n${MARKERS.themeEnd}\n</style></head><body>${MARKERS.snippetStart}${body}${MARKERS.snippetEnd}</body></html>`;
  await writeFile(path.join(dir, 'components', 'button.html'), html('<button>Go</button>'));
  await writeFile(path.join(dir, 'pages', 'landing.html'), html('<main>Hello.</main>'));
  return root;
}

test('checkAll fails on stale themes and passes after syncAll', async () => {
  const root = await fixture();
  const before = await checkAll(root);
  assert.ok(before.some((e) => e.includes('inline theme is out of sync')));
  const changed = await syncAll(root);
  assert.equal(changed, 2);
  assert.deepEqual(await checkAll(root), []);
  const synced = await readFile(path.join(root, 'demo', 'components', 'button.html'), 'utf8');
  assert.ok(synced.includes('--color-ink: #111;'));
});

test('checkAll reports missing files and slop', async () => {
  const root = await fixture();
  await syncAll(root);
  await writeFile(path.join(root, 'demo', 'pages', 'landing.html'), 'no markers — at all');
  const errors = await checkAll(root);
  assert.ok(errors.some((e) => e.includes('missing Tailwind CDN script')));
  assert.ok(errors.some((e) => e.includes('missing snippet markers')));
  assert.ok(errors.some((e) => e.includes('em dash')));
});
```

- [ ] **Step 2: Run tests to see them fail**

Add to `package.json` `scripts`:
```json
"check:systems": "node scripts/check-systems.mjs",
"sync:themes": "node scripts/sync-themes.mjs",
"test:scripts": "node --test scripts/"
```

Run: `npm run test:scripts`
Expected: FAIL, cannot find module `./systems-lib.mjs`.

- [ ] **Step 3: Implement the library**

Create `scripts/lib/systems-lib.mjs`:
```js
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

export const MARKERS = {
  snippetStart: '<!-- snippet:start -->',
  snippetEnd: '<!-- snippet:end -->',
  themeStart: '/* theme:start */',
  themeEnd: '/* theme:end */',
};
export const TAILWIND_CDN = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';

export const normalize = (text) => text.replace(/\r\n/g, '\n').trim();

export function between(text, start, end) {
  const a = text.indexOf(start);
  const b = text.indexOf(end);
  if (a === -1 || b === -1 || b < a) return null;
  return text.slice(a + start.length, b);
}

export function replaceBetween(text, start, end, content) {
  const a = text.indexOf(start);
  const b = text.indexOf(end);
  if (a === -1 || b === -1 || b < a) return null;
  return text.slice(0, a + start.length) + '\n' + content + '\n' + text.slice(b);
}

// ---- manifest (mirrors src/app/core/manifest.ts) ----
const isText = (v) => typeof v === 'string' && v.length > 0;
const isTextList = (v) => Array.isArray(v) && v.every(isText);

export function validateManifest(m) {
  if (typeof m !== 'object' || m === null) return ['manifest is not an object'];
  const errors = [];
  for (const key of ['slug', 'name', 'tagline', 'description']) if (!isText(m[key])) errors.push(`${key} must be a non-empty string`);
  if (typeof m.number !== 'number') errors.push('number must be a number');
  for (const key of ['tags', 'useCases']) if (!isTextList(m[key])) errors.push(`${key} must be a string array`);
  if (m.defaultMode !== 'light' && m.defaultMode !== 'dark') errors.push('defaultMode must be "light" or "dark"');
  for (const key of ['fonts', 'palette']) if (!Array.isArray(m[key]) || m[key].length === 0) errors.push(`${key} must be a non-empty array`);
  if (!Array.isArray(m.allowedGradients)) errors.push('allowedGradients must be an array');
  if (!m.typeScale || typeof m.typeScale.ratio !== 'number' || typeof m.typeScale.steps !== 'object') errors.push('typeScale must have ratio and steps');
  if (!m.rules || !isTextList(m.rules.do) || !isTextList(m.rules.dont)) errors.push('rules must have do and dont string arrays');
  for (const key of ['components', 'pages']) {
    if (!Array.isArray(m[key])) { errors.push(`${key} must be an array`); continue; }
    m[key].forEach((item = {}, i) => {
      const needsNotes = key === 'components';
      if (!isText(item.id) || !isText(item.name) || !isText(item.file) || (needsNotes && !isText(item.notes))) {
        errors.push(`${key}[${i}] needs id, name, file${needsNotes ? ', notes' : ''}`);
      }
    });
  }
  return errors;
}

// ---- lint rules (spec section 8) ----
const BANNED_FONTS = ['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Open Sans', 'Space Grotesk'];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function lintFonts(text) {
  const errors = [];
  for (const line of text.split('\n')) {
    if (!/font-family|--font-|fonts\.googleapis\.com|"family"/.test(line)) continue;
    for (const name of BANNED_FONTS) {
      for (const variant of new Set([name, name.replace(/ /g, '+')])) {
        if (new RegExp(`(^|[^A-Za-z])${escapeRe(variant)}([^A-Za-z]|$)`).test(line)) {
          errors.push(`banned font "${name}"`);
        }
      }
    }
  }
  return errors;
}

const GRADIENT = /\b(bg-gradient-to-|bg-linear-|bg-radial|bg-conic)|\b(linear|radial|conic)-gradient\(/;
export function lintGradients(text, allowed) {
  return text
    .split('\n')
    .filter((line) => GRADIENT.test(line) && !allowed.some((a) => line.includes(a.pattern)))
    .map((line) => `decorative gradient: ${line.trim().slice(0, 80)}`);
}

const DEFAULT_PALETTE = /\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline|decoration)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;
export function lintPalette(text) {
  return [...text.matchAll(DEFAULT_PALETTE)].map((m) => `default Tailwind palette class "${m[0]}"`);
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');
}

const BANNED_WORDS = /\b(unlock(s|ed|ing)?|seamless(ly)?|elevate(s|d)?|supercharge(s|d)?|empower(s|ed|ing)?|reimagined)\b/i;
export function lintCopy(html) {
  const errors = [];
  const text = visibleText(html);
  if (text.includes('—')) errors.push('em dash in copy');
  if (/(^|[\s\w])--([\s\w]|$)/.test(text)) errors.push('"--" used as a pause in copy');
  const word = BANNED_WORDS.exec(text);
  if (word) errors.push(`banned word "${word[0]}"`);
  if (/lorem ipsum/i.test(text)) errors.push('lorem ipsum placeholder');
  for (const match of html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)) {
    if (/\p{Extended_Pictographic}/u.test(match[1])) errors.push('emoji in heading');
  }
  return errors;
}

export function lintOrnaments(text) {
  const errors = [];
  if (/\bbackdrop-blur/.test(text)) errors.push('glassmorphism (backdrop-blur)');
  if (/\bshadow-(xl|2xl)\b/.test(text)) errors.push('generic heavy shadow (shadow-xl / shadow-2xl)');
  return errors;
}

export function lintTypeScale(scale) {
  const errors = [];
  const px = (v) => (typeof v === 'string' && v.endsWith('px') ? parseFloat(v) : NaN);
  if (!(scale.ratio >= 1.333)) errors.push(`type scale ratio ${scale.ratio} is below 1.333`);
  const base = px(scale.steps?.base);
  const display = px(scale.steps?.display);
  if (Number.isNaN(base) || Number.isNaN(display)) errors.push('type scale needs base and display in px');
  else if (display < base * 3) errors.push(`display ${display}px is less than 3x base ${base}px`);
  return errors;
}

// ---- checks ----
const exists = (file) => access(file).then(() => true, () => false);

export async function checkSystem(root, slug) {
  const dir = path.join(root, slug);
  const errors = [];
  const report = (where, list) => list.forEach((e) => errors.push(`${slug}/${where}: ${e}`));

  let manifest;
  try {
    manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8'));
  } catch (err) {
    report('manifest.json', [`cannot read: ${err.message}`]);
    return errors;
  }
  const shape = validateManifest(manifest);
  if (shape.length) { report('manifest.json', shape); return errors; }
  if (manifest.slug !== slug) report('manifest.json', [`slug "${manifest.slug}" does not match folder`]);

  const manifestText = [manifest.tagline, manifest.description, ...manifest.rules.do, ...manifest.rules.dont, ...manifest.components.map((c) => c.notes)].join('\n');
  report('manifest.json', [
    ...manifest.fonts.flatMap((f) => lintFonts(`font-family: ${f.family}`)),
    ...lintCopy(`<p>${manifestText}</p>`),
    ...lintTypeScale(manifest.typeScale),
  ]);

  const themePath = path.join(dir, 'theme.css');
  if (!(await exists(themePath))) { report('theme.css', ['missing']); return errors; }
  const theme = normalize(await readFile(themePath, 'utf8'));
  report('theme.css', [...lintFonts(theme), ...lintGradients(theme, manifest.allowedGradients)]);

  for (const item of [...manifest.components, ...manifest.pages]) {
    const file = path.join(dir, item.file);
    if (!(await exists(file))) { report(item.file, ['declared in manifest but missing']); continue; }
    const html = (await readFile(file, 'utf8')).replace(/\r\n/g, '\n');
    const problems = [];
    if (!html.includes(TAILWIND_CDN)) problems.push('missing Tailwind CDN script');
    if (between(html, MARKERS.snippetStart, MARKERS.snippetEnd) === null) problems.push('missing snippet markers');
    const inline = between(html, MARKERS.themeStart, MARKERS.themeEnd);
    if (inline === null) problems.push('missing theme markers');
    else if (normalize(inline) !== theme) problems.push('inline theme is out of sync (run npm run sync:themes)');
    for (const font of manifest.fonts) {
      if (!html.includes(font.googleFontsUrl) && !html.includes(font.googleFontsUrl.replaceAll('&', '&amp;'))) {
        problems.push(`missing font link for ${font.family}`);
      }
    }
    if (manifest.defaultMode === 'dark' && !/<html[^>]*class="[^"]*\bdark\b/.test(html)) problems.push('dark-first system needs class="dark" on <html>');
    problems.push(
      ...lintFonts(html),
      ...lintGradients(html, manifest.allowedGradients),
      ...lintPalette(html),
      ...lintCopy(html),
      ...lintOrnaments(html),
    );
    report(item.file, problems);
  }
  return errors;
}

async function readIndex(root) {
  return JSON.parse(await readFile(path.join(root, 'index.json'), 'utf8')).systems;
}

export async function checkAll(root) {
  const errors = [];
  if (!(await exists(path.join(root, '_global', 'anti-slop.md')))) errors.push('_global/anti-slop.md: missing');
  let slugs;
  try {
    slugs = await readIndex(root);
  } catch (err) {
    return [...errors, `index.json: cannot read: ${err.message}`];
  }
  for (const slug of slugs) errors.push(...(await checkSystem(root, slug)));
  return errors;
}

/** Copies each system's theme.css into the inline theme block of its HTML files. Returns the number of files changed. */
export async function syncAll(root) {
  let changed = 0;
  for (const slug of await readIndex(root)) {
    const dir = path.join(root, slug);
    const manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8'));
    const theme = normalize(await readFile(path.join(dir, 'theme.css'), 'utf8'));
    for (const item of [...manifest.components, ...manifest.pages]) {
      const file = path.join(dir, item.file);
      if (!(await exists(file))) continue;
      const html = (await readFile(file, 'utf8')).replace(/\r\n/g, '\n');
      const next = replaceBetween(html, MARKERS.themeStart, MARKERS.themeEnd, theme);
      if (next !== null && next !== html) {
        await writeFile(file, next);
        changed++;
      }
    }
  }
  return changed;
}
```

- [ ] **Step 4: Implement the CLIs**

Create `scripts/check-systems.mjs`:
```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAll } from './lib/systems-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'systems');
const errors = await checkAll(root);
if (errors.length) {
  console.error(errors.map((e) => `x ${e}`).join('\n'));
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log('All systems pass.');
```

Create `scripts/sync-themes.mjs`:
```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncAll } from './lib/systems-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'systems');
const changed = await syncAll(root);
console.log(`Synced inline themes in ${changed} file(s).`);
```

- [ ] **Step 5: Create the registry and global rules**

Create `public/systems/index.json`:
```json
{
  "systems": []
}
```

Create `public/systems/_global/anti-slop.md`:
```markdown
These rules apply on top of the system above. If the system and these rules ever disagree, the system wins for tokens and these rules win for everything else.

1. Fonts. Use only the fonts the system lists. Never fall back to Inter, Poppins, Roboto, Montserrat, Open Sans, or Space Grotesk.
2. Gradients. No decorative gradients, mesh backgrounds, glows, or gradient text. Flat color only, unless the system explicitly allows a functional gradient.
3. Palette. Use only the system's color tokens. No purple to blue, indigo, or violet accents unless they are in the tokens. One primary accent per screen.
4. Layout. Never build a row of three identical cards with an icon, a title, and two lines of text. Use an asymmetric bento grid, an editorial list, or a table instead. Vary tile sizes on purpose.
5. Type scale. Use the system's scale and keep real contrast between levels. Display text should be at least three times the body size. Do not set everything between 16 and 24 px.
6. Copy. Write specific, plain sentences about the actual product. No em dashes or double hyphens as pauses. No emoji in headings. Never use "unlock", "seamless", "elevate", "supercharge", "empower", or "X, reimagined". No lorem ipsum.
7. Ornaments. No gradient blobs behind the hero, no glassmorphism or backdrop blur, no "New" badges with sparkles, no icons inside pastel circles, no large soft shadows on every element.
8. Tokens. Radius, shadow, spacing, and motion come from the system's tokens. Do not mix in Tailwind defaults.
9. Mobile first. Design at 375 px wide first, with tap targets of at least 44 px, then add breakpoints.
10. Honesty. Interactive states (hover, focus, pressed, disabled, error) must be visible and match the system. Focus must never be removed.
```

- [ ] **Step 6: Run tests and the check**

Run: `npm run test:scripts`
Expected: all tests pass.

Run: `npm run check:systems`
Expected: `All systems pass.` (index is empty).

- [ ] **Step 7: Commit**

```bash
git add scripts public/systems package.json
git commit -m "feat(tooling): add design system validator, slop linter, and theme sync"
```

---

### Task 6: Design system content contract and No. 02 Neo-Brutalist (reference system)

This task creates the first complete system. It is the template every later system copies, so get it right.

**Files:**
- Create: `public/systems/neo-brutalist/manifest.json`, `theme.css`, `components/{button,input,select,checkbox-toggle,badge,card,navbar,modal,table,bento,empty-state,toast}.html`, `pages/{landing,app}.html`
- Modify: `public/systems/index.json`

**Interfaces:**
- Consumes: markers and checks from Task 5.
- Produces: the file layout, the standalone HTML skeleton, and the content contract below, reused by Tasks 11 to 15.

#### Content contract (applies to every system)

Standalone skeleton for every component and page file. `<html>` gets `class="dark"` only for dark-first systems. Body padding: components use `class="p-6"`, pages use no padding. The `<title>` is `<System name> / <Item name>`.
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Neo-Brutalist / Button</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <!-- one <link rel="stylesheet"> per manifest font, href identical to googleFontsUrl -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Martian+Mono:wght@400;500&display=swap">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style type="text/tailwindcss">
/* theme:start */
/* theme:end */
  </style>
</head>
<body class="p-6">
  <!-- snippet:start -->
  ...
  <!-- snippet:end -->
</body>
</html>
```
Create files with empty theme markers, then run `npm run sync:themes` to fill them. The manifest font with several families may use one combined URL; in that case list it on the first font and repeat the same URL on the second, and include one `<link>` (the check passes because the URL is present).

What each file must show (all at 375 px first, then `md` and `lg` adjustments):

| File | Must contain |
|---|---|
| `button` | primary, secondary, ghost, destructive variants; sm and md sizes; a button with a leading inline SVG icon; a static focus-visible example (`ring` or `outline` applied directly) labelled as such; a loading state (spinner as inline SVG + "Saving"); a disabled state with a visible reason line under it |
| `input` | text input with label and hint; the same with error border and error message (`aria-invalid="true"`, `aria-describedby`); a textarea; a disabled input |
| `select` | native `<select>` styled with `appearance-none` and an inline SVG chevron, with label and hint |
| `checkbox-toggle` | checkbox checked and unchecked using `accent-*` or a custom styled `<input type="checkbox">` with `peer`; a switch as `<button role="switch" aria-checked="true">` in on and off states |
| `badge` | neutral, accent, success, danger, and one system-specific badge |
| `card` | one content card with real content (no row of identical cards), plus one compact variant |
| `navbar` | logo wordmark, links, primary action; on mobile a `<details>` disclosure menu; on `md` and up the links inline |
| `modal` | a static open dialog inside a faux backdrop `div` (normal flow, `min-h-[480px]`, no `fixed`): bottom sheet at mobile width, centered dialog from `md`; title, body, two actions |
| `table` | 5 or 6 rows of realistic data, right-aligned `tabular-nums` numbers, a status badge column, header row, `overflow-x-auto` wrapper |
| `bento` | 5 tiles with deliberately different spans (one hero tile 2x2 at `md`), each with different content types (stat, quote, list, small chart drawn with divs or inline SVG, CTA) |
| `empty-state` | headline that names the space, one-line body ending with a period, one verb-first action |
| `toast` | success and error toasts shown statically, each with a dismiss button (`aria-label="Dismiss"`) |
| `landing` page | navbar, hero (display type, one primary action, one secondary), bento feature section, a proof section (quote, logos as text wordmarks, or numbers), pricing or detail list, final CTA, footer |
| `app` page | the system-specific app page from section 6 of the spec, using the system's own components |

Writing rules for all copy: use the brand brief of the system, write specific sentences, sentence case, no banned words, no em dash. Placeholder imagery is inline SVG or CSS shapes using only theme tokens; no external images. Use only theme color utilities (`bg-bg`, `text-ink`, `border-line`, and so on); default palette classes do not exist because the theme resets `--color-*`.

Before writing any HTML, read the `frontend-design:frontend-design` skill for craft guidance; this plan's tokens and rules take precedence over its suggestions.

#### No. 02 brief

Brand: **Pipeworks**, a deploy CLI for indie developers. Voice: blunt, funny, technical. App page: deploy dashboard (stats bento, recent deploys table, log tail panel, environment toggles).

- [ ] **Step 1: Write the manifest**

Create `public/systems/neo-brutalist/manifest.json`:
```json
{
  "slug": "neo-brutalist",
  "number": 2,
  "name": "Neo-Brutalist",
  "tagline": "Thick rules, hard shadows, loud primaries.",
  "description": "A system that shows its construction. Heavy black outlines, offset shadows with no blur, and three primaries used at full strength. It reads as confident and a little rude, which suits tools for people who build things.",
  "tags": ["bold", "playful", "light", "dev-tool", "marketing"],
  "defaultMode": "light",
  "useCases": ["indie product landing pages", "developer tools", "launch pages", "internal dashboards with personality"],
  "fonts": [
    { "family": "Archivo", "role": "display and UI; use font-stretch 125% for display", "weights": [500, 700, 800, 900], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Martian+Mono:wght@400;500&display=swap" },
    { "family": "Martian Mono", "role": "labels, data, code", "weights": [400, 500], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Martian+Mono:wght@400;500&display=swap" }
  ],
  "typeScale": { "ratio": 1.414, "steps": { "xs": "12px", "sm": "14px", "base": "16px", "lg": "22px", "xl": "32px", "2xl": "45px", "display": "64px" } },
  "palette": [
    { "token": "--color-bg", "light": "#FFFDF5", "dark": "#121210", "role": "page background" },
    { "token": "--color-surface", "light": "#FFFFFF", "dark": "#1C1C19", "role": "cards and inputs" },
    { "token": "--color-ink", "light": "#111111", "dark": "#F5F2E8", "role": "text, outlines, shadows" },
    { "token": "--color-muted", "light": "#4A4A44", "dark": "#B8B4A6", "role": "secondary text" },
    { "token": "--color-line", "light": "#111111", "dark": "#F5F2E8", "role": "borders and hard shadows" },
    { "token": "--color-yolk", "light": "#F4D23C", "dark": "#F4D23C", "role": "primary accent" },
    { "token": "--color-tomato", "light": "#FF5C39", "dark": "#FF6E4E", "role": "secondary accent, destructive" },
    { "token": "--color-blue", "light": "#3B5BFF", "dark": "#6F86FF", "role": "links and info" },
    { "token": "--color-accent-ink", "light": "#111111", "dark": "#111111", "role": "text on yolk, tomato, blue" },
    { "token": "--color-success", "light": "#1F9D55", "dark": "#3DCB7A", "role": "success" }
  ],
  "allowedGradients": [],
  "rules": {
    "do": [
      "Outline every surface with a 2px line; use 3px for the primary action and hero elements",
      "Give interactive surfaces the 4px hard shadow; on press, translate 2px right and down and shrink the shadow to 2px",
      "Set display headlines in Archivo at font-stretch 125% and weight 800 or 900, tracking tight",
      "Use Martian Mono for labels, numbers, and metadata, uppercase only for labels under 12 words",
      "Rotate one sticker element per screen by -2deg to break the grid on purpose",
      "Use yolk as the main accent; tomato for destructive and for one loud highlight per screen"
    ],
    "dont": [
      "Do not round corners beyond 4px",
      "Do not use soft or blurred shadows",
      "Do not use more than three accent colors on one screen",
      "Do not use thin 1px borders on interactive elements",
      "Do not center every section; anchor most layouts to the left edge"
    ]
  },
  "components": [
    { "id": "button", "name": "Button", "file": "components/button.html", "notes": "Primary is yolk with a 3px outline. Pressed state moves 2px and the shadow shrinks to 2px. Destructive is tomato." },
    { "id": "input", "name": "Input", "file": "components/input.html", "notes": "2px outline, surface fill, mono label above. Error state swaps the outline to tomato and adds a mono error line." },
    { "id": "select", "name": "Select", "file": "components/select.html", "notes": "Native select with a square chevron block on the right, separated by a 2px rule." },
    { "id": "checkbox-toggle", "name": "Checkbox and toggle", "file": "components/checkbox-toggle.html", "notes": "Square checkbox with a heavy check. Switch is a rectangle track with a square thumb and the hard shadow." },
    { "id": "badge", "name": "Badge", "file": "components/badge.html", "notes": "Mono uppercase, 2px outline, flat fill. The sticker variant is rotated -2deg." },
    { "id": "card", "name": "Card", "file": "components/card.html", "notes": "2px outline, 4px hard shadow, header strip in an accent color separated by a rule." },
    { "id": "navbar", "name": "Navbar", "file": "components/navbar.html", "notes": "Bottom rule of 3px. Mobile menu is a details disclosure that drops a full-width outlined panel." },
    { "id": "modal", "name": "Modal and sheet", "file": "components/modal.html", "notes": "Backdrop is ink at 60 percent. Dialog has a 3px outline and an 8px hard shadow." },
    { "id": "table", "name": "Table", "file": "components/table.html", "notes": "Every cell ruled. Header row inverted (ink background, bg text), mono numbers right-aligned." },
    { "id": "bento", "name": "Bento grid", "file": "components/bento.html", "notes": "Tiles share outlines with a gap of 12px; each tile uses a different accent or none." },
    { "id": "empty-state", "name": "Empty state", "file": "components/empty-state.html", "notes": "Dashed 2px outline box, a large mono glyph drawn in CSS, one primary action." },
    { "id": "toast", "name": "Toast", "file": "components/toast.html", "notes": "Outlined bar with a colored square status block on the left and a square dismiss button." }
  ],
  "pages": [
    { "id": "landing", "name": "Landing", "file": "pages/landing.html" },
    { "id": "app", "name": "Deploy dashboard", "file": "pages/app.html" }
  ]
}
```

- [ ] **Step 2: Write the theme**

Create `public/systems/neo-brutalist/theme.css`:
```css
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-*: initial;
  --color-bg: #FFFDF5;
  --color-surface: #FFFFFF;
  --color-ink: #111111;
  --color-muted: #4A4A44;
  --color-line: #111111;
  --color-yolk: #F4D23C;
  --color-tomato: #FF5C39;
  --color-blue: #3B5BFF;
  --color-accent-ink: #111111;
  --color-success: #1F9D55;

  --font-display: "Archivo", ui-sans-serif, sans-serif;
  --font-body: "Archivo", ui-sans-serif, sans-serif;
  --font-mono: "Martian Mono", ui-monospace, monospace;

  --text-*: initial;
  --text-xs: 0.75rem;
  --text-xs--line-height: 1.4;
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.45;
  --text-base: 1rem;
  --text-base--line-height: 1.55;
  --text-lg: 1.375rem;
  --text-lg--line-height: 1.3;
  --text-xl: 2rem;
  --text-xl--line-height: 1.1;
  --text-2xl: 2.8125rem;
  --text-2xl--line-height: 1;
  --text-display: 4rem;
  --text-display--line-height: 0.92;

  --radius-*: initial;
  --radius-sm: 4px;

  --shadow-*: initial;
  --shadow-hard-sm: 2px 2px 0 0 var(--color-line);
  --shadow-hard: 4px 4px 0 0 var(--color-line);
  --shadow-hard-lg: 8px 8px 0 0 var(--color-line);

  --ease-snap: cubic-bezier(0.2, 0, 0, 1);
}

@layer base {
  .dark {
    --color-bg: #121210;
    --color-surface: #1C1C19;
    --color-ink: #F5F2E8;
    --color-muted: #B8B4A6;
    --color-line: #F5F2E8;
    --color-tomato: #FF6E4E;
    --color-blue: #6F86FF;
    --color-success: #3DCB7A;
  }
  body {
    background: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }
}
```

- [ ] **Step 3: Write the reference button file exactly**

Create `public/systems/neo-brutalist/components/button.html` (this is the quality bar for every other file):
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Neo-Brutalist / Button</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Martian+Mono:wght@400;500&display=swap">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style type="text/tailwindcss">
/* theme:start */
/* theme:end */
  </style>
</head>
<body class="p-6">
  <!-- snippet:start -->
  <div class="flex max-w-xl flex-col gap-8">
    <section class="flex flex-col gap-3">
      <p class="font-mono text-xs uppercase text-muted">Variants</p>
      <div class="flex flex-wrap items-center gap-3">
        <button type="button" class="min-h-11 rounded-sm border-[3px] border-line bg-yolk px-5 font-bold text-accent-ink shadow-hard transition-[transform,box-shadow] duration-100 ease-snap hover:-translate-x-px hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm">
          Deploy now
        </button>
        <button type="button" class="min-h-11 rounded-sm border-2 border-line bg-surface px-5 font-bold text-ink shadow-hard transition-[transform,box-shadow] duration-100 ease-snap active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm">
          View logs
        </button>
        <button type="button" class="min-h-11 px-3 font-bold text-ink underline decoration-2 underline-offset-4 hover:decoration-tomato">
          Skip for now
        </button>
        <button type="button" class="min-h-11 rounded-sm border-2 border-line bg-tomato px-5 font-bold text-accent-ink shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm">
          Delete project
        </button>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <p class="font-mono text-xs uppercase text-muted">Sizes and icon</p>
      <div class="flex flex-wrap items-center gap-3">
        <button type="button" class="min-h-9 rounded-sm border-2 border-line bg-surface px-3 text-sm font-bold shadow-hard-sm">Small</button>
        <button type="button" class="inline-flex min-h-11 items-center gap-2 rounded-sm border-2 border-line bg-blue px-5 font-bold text-accent-ink shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm">
          <svg aria-hidden="true" viewBox="0 0 16 16" class="size-4" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 8h10M8 3l5 5-5 5"/></svg>
          Push to main
        </button>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <p class="font-mono text-xs uppercase text-muted">States</p>
      <div class="flex flex-wrap items-start gap-3">
        <button type="button" class="min-h-11 rounded-sm border-[3px] border-line bg-yolk px-5 font-bold text-accent-ink shadow-hard outline-[3px] outline-offset-4 outline-blue">
          Focused
        </button>
        <button type="button" aria-busy="true" class="inline-flex min-h-11 items-center gap-2 rounded-sm border-2 border-line bg-surface px-5 font-bold shadow-hard-sm">
          <svg aria-hidden="true" viewBox="0 0 16 16" class="size-4 animate-spin" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M8 2a6 6 0 1 0 6 6"/></svg>
          Saving
        </button>
        <div class="flex flex-col gap-1.5">
          <button type="button" disabled class="min-h-11 cursor-not-allowed rounded-sm border-2 border-dashed border-muted bg-bg px-5 font-bold text-muted">
            Deploy now
          </button>
          <p class="font-mono text-xs text-muted">Fix 2 failing checks first.</p>
        </div>
      </div>
    </section>
  </div>
  <!-- snippet:end -->
</body>
</html>
```

- [ ] **Step 4: Register the system and sync**

Set `public/systems/index.json` to:
```json
{
  "systems": ["neo-brutalist"]
}
```

Run: `npm run sync:themes`
Expected: `Synced inline themes in 1 file(s).`

Run: `npm run check:systems`
Expected: FAIL listing the 13 component and page files that are declared but missing. This confirms the check sees the manifest.

- [ ] **Step 5: Write the other 11 components**

Create each file in `public/systems/neo-brutalist/components/` using the skeleton, the content contract table, the manifest notes for that component, and the Pipeworks brief. Copy examples to use: input label "Project name" with hint "Lowercase letters, numbers, and dashes." (write "hyphens" in copy to avoid a double hyphen); error "That name is taken. Try pipeworks-api-2."; table of deploys with columns Commit, Branch, Duration, Status, When; toast success "Deployed a1f9c2e to production in 41s."; empty state "No deploys yet" / "Push a commit to main and it shows up here." / "Connect a repo".

After each file: `npm run sync:themes`.

- [ ] **Step 6: Write the two pages**

`pages/landing.html`: Pipeworks landing following the contract. Hero headline (display, font-stretch 125%): "Deploys that don't need a meeting." Hero has a rotated yolk sticker "v2 is out". Bento features: zero-config previews, rollbacks in one command, logs you can grep, pricing per project. Proof section: three numbers in a ruled row ("41s median deploy", "0 YAML files", "1,200 indie teams"). Footer with mono links.

`pages/app.html`: deploy dashboard: navbar, 4-tile stats bento (one tile 2x wide with a bar chart made of divs), recent deploys table, a log tail panel (mono, inverted colors), environment toggles using the switch component, and a toast stack in the corner shown statically.

Run: `npm run sync:themes`

- [ ] **Step 7: Run the check until it passes**

Run: `npm run check:systems`
Expected: `All systems pass.` Fix every reported problem in the files (never by weakening the linter).

- [ ] **Step 8: Open the standalone files to confirm they render**

Open `public/systems/neo-brutalist/components/button.html` and `pages/landing.html` directly in the built-in browser (`file:///` path) at 375 px and 1280 px wide. Expected: fonts load, outlines and hard shadows render, no horizontal scroll at 375 px on components (tables scroll inside their own wrapper).

- [ ] **Step 9: Commit**

```bash
git add public/systems
git commit -m "feat(systems): add No. 02 Neo-Brutalist reference system"
```

---

### Task 7: Shared UI and catalog page

**Files:**
- Create: `src/app/core/clipboard.service.ts`, `src/app/core/toast.service.ts`, `src/app/shared/ui/toast.ts`, `src/app/shared/ui/tag-chip.ts`, `src/app/features/catalog/catalog-filter.ts`, `src/app/features/catalog/catalog-filter.spec.ts`, `src/app/features/catalog/catalog-tile.ts`, `src/app/features/catalog/catalog.spec.ts`
- Modify: `src/app/features/catalog/catalog.ts` (replace placeholder), `src/app/app.ts` (add toast)

**Interfaces:**
- Consumes: `SystemsService.loadIndex()`, `SystemsService.fileUrl()`, `CatalogEntry`, `Manifest`.
- Produces:
  - `ClipboardService.copy(text: string): Promise<boolean>`
  - `ToastService.message: Signal<string | null>`, `ToastService.show(text: string): void`
  - `<app-toast />`, `<app-tag-chip [label] [active] (pressed)>`
  - `filterEntries(entries: CatalogEntry[], query: string, tag: string | null): CatalogEntry[]`, `collectTags(entries: CatalogEntry[]): string[]`, `tileSpan(index: number): string`, `padNumber(n: number): string`

- [ ] **Step 1: Write failing tests for the filter helpers**

Create `src/app/features/catalog/catalog-filter.spec.ts`:
```ts
import { CatalogEntry, Manifest } from '../../core/models';
import { collectTags, filterEntries, padNumber, tileSpan } from './catalog-filter';

const make = (slug: string, name: string, tagline: string, tags: string[]): CatalogEntry => ({
  slug,
  manifest: { slug, name, tagline, tags } as Manifest,
});

const entries: CatalogEntry[] = [
  make('neo-brutalist', 'Neo-Brutalist', 'Thick rules, hard shadows.', ['bold', 'light']),
  make('dark-luxury', 'Dark Luxury', 'Quiet, expensive, slow.', ['dark', 'premium']),
  { slug: 'broken', manifest: null },
];

describe('filterEntries', () => {
  it('returns everything with no query or tag', () => {
    expect(filterEntries(entries, '', null).length).toBe(3);
  });

  it('matches name, tagline, and tags case-insensitively', () => {
    expect(filterEntries(entries, 'BRUTAL', null).map((e) => e.slug)).toEqual(['neo-brutalist']);
    expect(filterEntries(entries, 'expensive', null).map((e) => e.slug)).toEqual(['dark-luxury']);
    expect(filterEntries(entries, 'premium', null).map((e) => e.slug)).toEqual(['dark-luxury']);
  });

  it('filters by tag and hides broken entries while filtering', () => {
    expect(filterEntries(entries, '', 'dark').map((e) => e.slug)).toEqual(['dark-luxury']);
  });
});

describe('helpers', () => {
  it('collects sorted unique tags', () => {
    expect(collectTags(entries)).toEqual(['bold', 'dark', 'light', 'premium']);
  });

  it('cycles asymmetric spans', () => {
    expect(tileSpan(0)).toBe('col-span-2 md:row-span-2');
    expect(tileSpan(6)).toBe(tileSpan(0));
  });

  it('pads entry numbers', () => {
    expect(padNumber(2)).toBe('02');
  });
});
```

- [ ] **Step 2: Write failing component test for the catalog**

Create `src/app/features/catalog/catalog.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Catalog } from './catalog';
import { SystemsService } from '../../core/systems.service';
import { CatalogEntry, Manifest } from '../../core/models';

const entries: CatalogEntry[] = [
  { slug: 'neo-brutalist', manifest: { slug: 'neo-brutalist', number: 2, name: 'Neo-Brutalist', tagline: 'Loud.', tags: ['bold'], pages: [{ id: 'landing', name: 'Landing', file: 'pages/landing.html' }] } as Manifest },
  { slug: 'dark-luxury', manifest: { slug: 'dark-luxury', number: 6, name: 'Dark Luxury', tagline: 'Quiet.', tags: ['dark'], pages: [{ id: 'landing', name: 'Landing', file: 'pages/landing.html' }] } as Manifest },
];

describe('Catalog', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [Catalog],
      providers: [
        provideRouter([]),
        { provide: SystemsService, useValue: { loadIndex: () => Promise.resolve(entries), fileUrl: (s: string, f: string) => `/systems/${s}/${f}` } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Catalog);
    fixture.detectChanges();
    // loadIndex() is a plain promise that Angular does not track, so wait a macrotask before rendering again.
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    return fixture;
  }

  it('renders one tile per system', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelectorAll('[data-tile]').length).toBe(2);
  });

  it('filters tiles when typing a query', async () => {
    const fixture = await setup();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type=search]');
    input.value = 'luxury';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const tiles = fixture.nativeElement.querySelectorAll('[data-tile]');
    expect(tiles.length).toBe(1);
    expect(tiles[0].textContent).toContain('Dark Luxury');
  });

  it('filters tiles by tag chip', async () => {
    const fixture = await setup();
    const chip = [...fixture.nativeElement.querySelectorAll('button')].find((b: HTMLButtonElement) => b.textContent?.trim() === 'bold') as HTMLButtonElement;
    chip.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-tile]').length).toBe(1);
    expect(chip.getAttribute('aria-pressed')).toBe('true');
  });
});
```

- [ ] **Step 3: Run tests to see them fail**

Run: `npx ng test --watch=false`
Expected: FAIL, cannot resolve `./catalog-filter`; catalog tests fail (no tiles).

- [ ] **Step 4: Implement services and small UI**

Create `src/app/core/clipboard.service.ts`:
```ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  async copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
```

Create `src/app/core/toast.service.ts`:
```ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  show(text: string): void {
    this.message.set(text);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.message.set(null), 2400);
  }
}
```

Create `src/app/shared/ui/toast.ts`:
```ts
import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div role="status" aria-live="polite" class="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex justify-center md:bottom-6">
      @if (toast.message(); as message) {
        <p class="border border-ink bg-ink px-4 py-3 font-mono text-meta text-paper">{{ message }}</p>
      }
    </div>
  `,
})
export class Toast {
  protected readonly toast = inject(ToastService);
}
```

In `src/app/app.ts`, add `Toast` to `imports` (from `./shared/ui/toast`) and add `<app-toast />` after `</main>` in the template.

Create `src/app/shared/ui/tag-chip.ts`:
```ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-tag-chip',
  template: `
    <button
      type="button"
      class="min-h-9 shrink-0 border border-ink px-3 font-mono text-meta transition-colors hover:text-signal"
      [class.bg-ink]="active()"
      [class.text-paper]="active()"
      [attr.aria-pressed]="active()"
      (click)="pressed.emit()"
    >
      {{ label() }}
    </button>
  `,
})
export class TagChip {
  readonly label = input.required<string>();
  readonly active = input(false);
  readonly pressed = output<void>();
}
```

- [ ] **Step 5: Implement the filter helpers**

Create `src/app/features/catalog/catalog-filter.ts`:
```ts
import { CatalogEntry } from '../../core/models';

export function filterEntries(entries: CatalogEntry[], query: string, tag: string | null): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  return entries.filter((entry) => {
    const m = entry.manifest;
    if (!m) return q === '' && tag === null;
    if (tag && !m.tags.includes(tag)) return false;
    if (!q) return true;
    return [m.name, m.tagline, ...m.tags].some((text) => text.toLowerCase().includes(q));
  });
}

export function collectTags(entries: CatalogEntry[]): string[] {
  return [...new Set(entries.flatMap((e) => e.manifest?.tags ?? []))].sort();
}

/** Asymmetric bento: 2 columns on mobile, 4 from md. Six positions, then repeat. */
const SPANS = [
  'col-span-2 md:row-span-2',
  'col-span-2',
  'col-span-1',
  'col-span-1',
  'col-span-2 md:col-span-1',
  'col-span-2 md:col-span-3',
];

export function tileSpan(index: number): string {
  return SPANS[index % SPANS.length];
}

export function padNumber(n: number): string {
  return String(n).padStart(2, '0');
}
```

- [ ] **Step 6: Implement the tile**

Create `src/app/features/catalog/catalog-tile.ts`:
```ts
import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Manifest } from '../../core/models';
import { SystemsService } from '../../core/systems.service';
import { padNumber } from './catalog-filter';

const THUMB_WIDTH = 1280;

@Component({
  selector: 'app-catalog-tile',
  imports: [RouterLink],
  host: { class: 'block bg-paper' },
  template: `
    <a [routerLink]="['/s', manifest().slug]" class="group flex h-full flex-col p-3.5 md:p-5" data-tile>
      <div #box class="relative flex-1 overflow-hidden border border-ink" [style.min-height.px]="featured() ? 240 : 132">
        @if (src(); as url) {
          <iframe
            [src]="url"
            loading="lazy"
            sandbox="allow-scripts"
            tabindex="-1"
            aria-hidden="true"
            title=""
            class="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
            [style.width.px]="thumbWidth"
            [style.height.px]="thumbWidth"
            [style.transform]="'scale(' + scale() + ')'"
          ></iframe>
        }
      </div>
      <div class="mt-3 flex items-baseline justify-between gap-3">
        <span class="font-bold group-hover:text-signal" [class]="featured() ? 'text-heading tracking-[-0.03em]' : 'text-title'">{{ manifest().name }}</span>
        <span class="shrink-0 font-mono text-meta">No. {{ number() }}</span>
      </div>
      <p class="mt-1 text-body text-graphite">{{ manifest().tagline }}</p>
    </a>
  `,
})
export class CatalogTile {
  readonly manifest = input.required<Manifest>();
  readonly featured = input(false);

  private readonly systems = inject(SystemsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly boxWidth = signal(0);

  protected readonly thumbWidth = THUMB_WIDTH;
  protected readonly number = computed(() => padNumber(this.manifest().number));
  protected readonly scale = computed(() => (this.boxWidth() || THUMB_WIDTH) / THUMB_WIDTH);
  protected readonly src = computed(() => {
    const landing = this.manifest().pages.find((p) => p.id === 'landing');
    return landing
      ? this.sanitizer.bypassSecurityTrustResourceUrl(this.systems.fileUrl(this.manifest().slug, landing.file))
      : null;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => this.boxWidth.set(entry.contentRect.width));
      observer.observe(this.box().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
```

- [ ] **Step 7: Implement the catalog page**

Replace `src/app/features/catalog/catalog.ts`:
```ts
import { Component, computed, inject, signal } from '@angular/core';
import { CatalogEntry } from '../../core/models';
import { SystemsService } from '../../core/systems.service';
import { TagChip } from '../../shared/ui/tag-chip';
import { CatalogTile } from './catalog-tile';
import { collectTags, filterEntries, padNumber, tileSpan } from './catalog-filter';

@Component({
  selector: 'app-catalog',
  imports: [TagChip, CatalogTile],
  template: `
    <section class="px-4 pb-6 pt-8 md:px-8 md:pt-14">
      <p class="font-mono text-meta text-graphite">vol. 01, design systems</p>
      <h1 class="mt-3 text-display font-extrabold tracking-[-0.03em] lg:text-display-lg">Specimens<br />for agents</h1>
      <p class="mt-5 max-w-md text-body text-graphite">
        Design systems written in plain HTML and Tailwind. Pick one, copy it, and hand it to your coding agent so the UI it writes looks intentional.
      </p>
    </section>

    <div class="sticky top-0 z-10 border-y border-ink bg-paper px-4 py-2 md:px-8">
      <div class="flex flex-col gap-2 md:flex-row md:items-center">
        <label class="flex min-h-11 flex-1 items-center gap-3 border border-ink px-3 md:max-w-sm">
          <span class="font-mono text-meta text-graphite">search</span>
          <input
            type="search"
            class="w-full bg-transparent text-body outline-none placeholder:text-graphite"
            placeholder="brutalist, dark, dashboard"
            aria-label="Search design systems"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
        </label>
        <div class="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 md:mx-0 md:px-0" role="group" aria-label="Filter by tag">
          <app-tag-chip label="all" [active]="tag() === null" (pressed)="tag.set(null)" />
          @for (t of tags(); track t) {
            <app-tag-chip [label]="t" [active]="tag() === t" (pressed)="tag.set(tag() === t ? null : t)" />
          }
        </div>
        <p class="font-mono text-meta text-graphite md:ml-auto">{{ countLabel() }}</p>
      </div>
    </div>

    @switch (state()) {
      @case ('loading') {
        <p class="px-4 py-16 font-mono text-meta text-graphite md:px-8">Loading the archive…</p>
      }
      @case ('error') {
        <div class="px-4 py-16 md:px-8">
          <p class="text-title font-bold">The archive index didn't load.</p>
          <p class="mt-2 text-body text-graphite">Check that the dev server is running, then try again.</p>
          <button type="button" class="mt-5 min-h-11 border border-ink bg-ink px-5 font-bold text-paper hover:bg-signal hover:border-signal" (click)="load()">Retry</button>
        </div>
      }
      @default {
        @if (visible().length === 0) {
          <div class="px-4 py-16 md:px-8">
            <p class="text-title font-bold">No systems match "{{ query() }}".</p>
            <button type="button" class="mt-4 min-h-11 font-mono text-meta underline underline-offset-4 hover:text-signal" (click)="clear()">Clear search and filters</button>
          </div>
        } @else {
          <div class="grid grid-cols-2 gap-px border-b border-ink bg-ink md:grid-cols-4">
            @for (entry of visible(); track entry.slug; let i = $index) {
              <div [class]="span(i)">
                @if (entry.manifest; as manifest) {
                  <app-catalog-tile class="h-full" [manifest]="manifest" [featured]="i === 0" />
                } @else {
                  <div class="h-full bg-paper p-3.5 md:p-5" data-tile>
                    <p class="font-mono text-meta text-graphite">No. ??</p>
                    <p class="mt-2 text-title font-bold">{{ entry.slug }}</p>
                    <p class="mt-1 text-body text-graphite">This entry is unavailable. Its manifest didn't load.</p>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    }
  `,
})
export class Catalog {
  private readonly systems = inject(SystemsService);

  protected readonly state = signal<'loading' | 'error' | 'ready'>('loading');
  protected readonly entries = signal<CatalogEntry[]>([]);
  protected readonly query = signal('');
  protected readonly tag = signal<string | null>(null);

  protected readonly tags = computed(() => collectTags(this.entries()));
  protected readonly visible = computed(() => filterEntries(this.entries(), this.query(), this.tag()));
  protected readonly countLabel = computed(() => `${padNumber(this.visible().length)} of ${padNumber(this.entries().length)} entries`);

  constructor() {
    this.load();
  }

  protected async load(): Promise<void> {
    this.state.set('loading');
    try {
      this.entries.set(await this.systems.loadIndex());
      this.state.set('ready');
    } catch {
      this.state.set('error');
    }
  }

  protected clear(): void {
    this.query.set('');
    this.tag.set(null);
  }

  protected span(index: number): string {
    return tileSpan(index);
  }
}
```

- [ ] **Step 8: Run tests to see them pass**

Run: `npx ng test --watch=false`
Expected: all tests pass.

- [ ] **Step 9: Check it in the browser**

Run `npx ng serve` in the background, open `http://localhost:4200` in the built-in browser at 375 px and at desktop width. Expected: header, display title, sticky search, chips, one Neo-Brutalist tile with a live scaled thumbnail. Typing "zzz" shows the no-match state with the clear button.

- [ ] **Step 10: Commit**

```bash
git add src/app
git commit -m "feat(catalog): add bento catalog with search, tag filter, and live thumbnails"
```

---

### Task 8: Preview frame and controls

**Files:**
- Create: `src/app/features/preview-frame/preview-frame.ts`, `src/app/features/preview-frame/preview-frame.spec.ts`, `src/app/features/preview-frame/preview-controls.ts`

**Interfaces:**
- Consumes: `buildPreviewDoc`, `PREVIEW_HEIGHT_MESSAGE` (Task 3), `FontSpec`, `ColorMode`.
- Produces:
  - `<app-preview-frame [snippet] [theme] [fonts] [mode] [viewport] [padded] [label] />`; `VIEWPORTS = [375, 768, 1280] as const`
  - `<app-preview-controls [(viewport)] [(mode)] />`

- [ ] **Step 1: Write the failing test**

Create `src/app/features/preview-frame/preview-frame.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { PreviewFrame } from './preview-frame';

describe('PreviewFrame', () => {
  it('renders a sandboxed iframe sized to the viewport with the built document', async () => {
    const fixture = TestBed.createComponent(PreviewFrame);
    fixture.componentRef.setInput('snippet', '<button>Go</button>');
    fixture.componentRef.setInput('theme', '@theme {}');
    fixture.componentRef.setInput('fonts', []);
    fixture.componentRef.setInput('mode', 'dark');
    fixture.componentRef.setInput('viewport', 768);
    fixture.componentRef.setInput('label', 'Button preview');
    fixture.detectChanges();
    await fixture.whenStable();

    const iframe: HTMLIFrameElement = fixture.nativeElement.querySelector('iframe');
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
    expect(iframe.title).toBe('Button preview');
    expect(iframe.style.width).toBe('768px');
    expect(iframe.srcdoc).toContain('<html lang="en" class="dark">');
    expect(iframe.srcdoc).toContain('<button>Go</button>');
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npx ng test --watch=false`
Expected: FAIL, cannot resolve `./preview-frame`.

- [ ] **Step 3: Implement the frame**

Create `src/app/features/preview-frame/preview-frame.ts`:
```ts
import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ColorMode, FontSpec } from '../../core/models';
import { PREVIEW_HEIGHT_MESSAGE, buildPreviewDoc } from '../../core/preview-doc';

export const VIEWPORTS = [375, 768, 1280] as const;

@Component({
  selector: 'app-preview-frame',
  host: { class: 'block' },
  template: `
    <div #box class="w-full overflow-hidden border border-ink" [style.height.px]="boxHeight()">
      <iframe
        #frame
        sandbox="allow-scripts"
        class="block origin-top-left border-0"
        [title]="label()"
        [srcdoc]="doc()"
        [style.width.px]="viewport()"
        [style.height.px]="contentHeight()"
        [style.transform]="'scale(' + scale() + ')'"
      ></iframe>
    </div>
  `,
})
export class PreviewFrame {
  readonly snippet = input.required<string>();
  readonly theme = input.required<string>();
  readonly fonts = input.required<FontSpec[]>();
  readonly mode = input<ColorMode>('light');
  readonly viewport = input<number>(375);
  readonly padded = input(true);
  readonly label = input('Preview');

  private readonly sanitizer = inject(DomSanitizer);
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly frame = viewChild.required<ElementRef<HTMLIFrameElement>>('frame');
  private readonly boxWidth = signal(0);

  protected readonly contentHeight = signal(320);
  protected readonly doc = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      buildPreviewDoc(this.snippet(), { theme: this.theme(), fonts: this.fonts(), mode: this.mode(), padded: this.padded() }),
    ),
  );
  protected readonly scale = computed(() => {
    const width = this.boxWidth();
    return width > 0 ? Math.min(1, width / this.viewport()) : 1;
  });
  protected readonly boxHeight = computed(() => Math.ceil(this.contentHeight() * this.scale()));

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const onMessage = (event: MessageEvent) => {
        if (event.source !== this.frame().nativeElement.contentWindow) return;
        if (event.data?.type !== PREVIEW_HEIGHT_MESSAGE) return;
        const height = Number(event.data.height) || 0;
        this.contentHeight.set(Math.min(6000, Math.max(80, height)));
      };
      window.addEventListener('message', onMessage);
      destroyRef.onDestroy(() => window.removeEventListener('message', onMessage));

      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => this.boxWidth.set(entry.contentRect.width));
      observer.observe(this.box().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
```

- [ ] **Step 4: Implement the controls**

Create `src/app/features/preview-frame/preview-controls.ts`:
```ts
import { Component, model } from '@angular/core';
import { ColorMode } from '../../core/models';
import { VIEWPORTS } from './preview-frame';

@Component({
  selector: 'app-preview-controls',
  template: `
    <div class="flex flex-wrap items-center gap-1.5 font-mono text-meta">
      <div class="flex" role="group" aria-label="Preview width">
        @for (width of viewports; track width) {
          <button
            type="button"
            class="-ml-px min-h-9 border border-ink px-2.5 first:ml-0"
            [class.bg-ink]="viewport() === width"
            [class.text-paper]="viewport() === width"
            [attr.aria-pressed]="viewport() === width"
            (click)="viewport.set(width)"
          >
            {{ width }}
          </button>
        }
      </div>
      <button
        type="button"
        class="ml-auto min-h-9 border border-ink px-2.5"
        [attr.aria-pressed]="mode() === 'dark'"
        [attr.aria-label]="'Preview in ' + (mode() === 'dark' ? 'light' : 'dark') + ' mode'"
        (click)="mode.set(mode() === 'dark' ? 'light' : 'dark')"
      >
        {{ mode() }}
      </button>
    </div>
  `,
})
export class PreviewControls {
  readonly viewport = model<number>(375);
  readonly mode = model<ColorMode>('light');
  protected readonly viewports = VIEWPORTS;
}
```

- [ ] **Step 5: Run tests to see them pass**

Run: `npx ng test --watch=false`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/preview-frame
git commit -m "feat(preview): add scaled sandboxed preview frame and controls"
```

---

### Task 9: System detail page and Copy for AI

**Files:**
- Create: `src/app/shared/ui/code-block.ts`, `src/app/shared/ui/copy-fallback-sheet.ts`, `src/app/features/system-detail/copy-bar.ts`, `src/app/features/system-detail/copy-bar.spec.ts`, `src/app/features/system-detail/preview-item.ts`, `src/app/features/system-detail/sections/overview-section.ts`, `src/app/features/system-detail/sections/tokens-section.ts`, `src/app/features/system-detail/sections/items-section.ts`, `src/app/features/system-detail/sections/rules-section.ts`, `src/app/features/system-detail/system-detail.ts`
- Modify: `src/app/app.routes.ts`

**Interfaces:**
- Consumes: `SystemsService.loadBundle/loadAntiSlop`, `buildPrompt`, `estimateTokens`, `ClipboardService.copy`, `ToastService.show`, `PreviewFrame`, `PreviewControls`, `SECTIONS`, `Section`, `padNumber`.
- Produces: routes `/s/:slug` and `/s/:slug/:section`; `<app-copy-bar [prompt] [name] />`.

- [ ] **Step 1: Write the failing copy-bar test**

Create `src/app/features/system-detail/copy-bar.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { CopyBar } from './copy-bar';
import { ClipboardService } from '../../core/clipboard.service';
import { ToastService } from '../../core/toast.service';

describe('CopyBar', () => {
  async function setup(copyResult: boolean) {
    await TestBed.configureTestingModule({
      imports: [CopyBar],
      providers: [{ provide: ClipboardService, useValue: { copy: () => Promise.resolve(copyResult) } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(CopyBar);
    fixture.componentRef.setInput('prompt', 'x'.repeat(4000));
    fixture.componentRef.setInput('name', 'Neo-Brutalist');
    fixture.detectChanges();
    return fixture;
  }

  it('shows the token estimate', async () => {
    const fixture = await setup(true);
    expect(fixture.nativeElement.textContent).toContain('~1.0k tokens');
  });

  it('confirms with a toast when the copy works', async () => {
    const fixture = await setup(true);
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    expect(TestBed.inject(ToastService).message()).toBe('Copied Neo-Brutalist for your agent');
  });

  it('opens the manual copy sheet when the clipboard is blocked', async () => {
    const fixture = await setup(false);
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    fixture.detectChanges();
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(textarea).not.toBeNull();
    expect(textarea.value.length).toBe(4000);
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npx ng test --watch=false`
Expected: FAIL, cannot resolve `./copy-bar`.

- [ ] **Step 3: Implement code block and fallback sheet**

Create `src/app/shared/ui/copy-fallback-sheet.ts`:
```ts
import { Component, ElementRef, afterNextRender, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-copy-fallback-sheet',
  template: `
    <div class="fixed inset-0 z-40 flex items-end bg-ink/60 md:items-center md:justify-center" (click)="closed.emit()">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fallback-title"
        class="w-full border-t border-ink bg-paper p-4 md:max-w-2xl md:border"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p id="fallback-title" class="text-title font-bold">Copy it manually</p>
            <p class="mt-1 text-body text-graphite">Your browser blocked clipboard access. The text is selected; press Ctrl+C or Cmd+C.</p>
          </div>
          <button type="button" class="min-h-11 shrink-0 px-2 font-mono text-meta hover:text-signal" (click)="closed.emit()">close</button>
        </div>
        <textarea #area readonly class="mt-4 h-72 w-full resize-none border border-ink bg-paper p-3 font-mono text-meta" [value]="text()"></textarea>
      </div>
    </div>
  `,
})
export class CopyFallbackSheet {
  readonly text = input.required<string>();
  readonly closed = output<void>();
  private readonly area = viewChild.required<ElementRef<HTMLTextAreaElement>>('area');

  constructor() {
    afterNextRender(() => {
      const el = this.area().nativeElement;
      el.focus();
      el.select();
    });
  }
}
```

Create `src/app/shared/ui/code-block.ts`:
```ts
import { Component, inject, input, signal } from '@angular/core';
import { ClipboardService } from '../../core/clipboard.service';
import { ToastService } from '../../core/toast.service';
import { CopyFallbackSheet } from './copy-fallback-sheet';

@Component({
  selector: 'app-code-block',
  imports: [CopyFallbackSheet],
  host: { class: 'block' },
  template: `
    <div class="border border-ink">
      <div class="flex items-center justify-between border-b border-ink px-3 font-mono text-meta">
        <span class="text-graphite">{{ language() }}</span>
        <button type="button" class="min-h-9 px-2 hover:text-signal" (click)="copy()">copy code</button>
      </div>
      <pre class="max-h-[28rem] overflow-auto p-3 font-mono text-meta leading-relaxed"><code>{{ code() }}</code></pre>
    </div>
    @if (fallback()) {
      <app-copy-fallback-sheet [text]="code()" (closed)="fallback.set(false)" />
    }
  `,
})
export class CodeBlock {
  readonly code = input.required<string>();
  readonly language = input('html');

  private readonly clipboard = inject(ClipboardService);
  private readonly toast = inject(ToastService);
  protected readonly fallback = signal(false);

  protected async copy(): Promise<void> {
    if (await this.clipboard.copy(this.code())) this.toast.show('Code copied');
    else this.fallback.set(true);
  }
}
```

- [ ] **Step 4: Implement the copy bar**

Create `src/app/features/system-detail/copy-bar.ts`:
```ts
import { Component, computed, inject, input, signal } from '@angular/core';
import { ClipboardService } from '../../core/clipboard.service';
import { estimateTokens } from '../../core/prompt-builder';
import { ToastService } from '../../core/toast.service';
import { CopyFallbackSheet } from '../../shared/ui/copy-fallback-sheet';

@Component({
  selector: 'app-copy-bar',
  imports: [CopyFallbackSheet],
  host: { class: 'block' },
  template: `
    <button
      type="button"
      class="flex min-h-14 w-full items-center justify-between gap-4 bg-ink px-4 text-left text-paper transition-colors hover:bg-signal"
      (click)="copy()"
    >
      <span class="text-title font-bold">Copy for AI</span>
      <span class="font-mono text-meta">~{{ tokens() }} tokens</span>
    </button>
    @if (fallback()) {
      <app-copy-fallback-sheet [text]="prompt()" (closed)="fallback.set(false)" />
    }
  `,
})
export class CopyBar {
  readonly prompt = input.required<string>();
  readonly name = input.required<string>();

  private readonly clipboard = inject(ClipboardService);
  private readonly toast = inject(ToastService);
  protected readonly fallback = signal(false);
  protected readonly tokens = computed(() => `${(estimateTokens(this.prompt()) / 1000).toFixed(1)}k`);

  protected async copy(): Promise<void> {
    if (await this.clipboard.copy(this.prompt())) this.toast.show(`Copied ${this.name()} for your agent`);
    else this.fallback.set(true);
  }
}
```

Run: `npx ng test --watch=false`
Expected: the CopyBar tests pass.

- [ ] **Step 5: Implement the preview item**

Create `src/app/features/system-detail/preview-item.ts`:
```ts
import { Component, input, signal } from '@angular/core';
import { ColorMode, FontSpec, LoadedItem } from '../../core/models';
import { CodeBlock } from '../../shared/ui/code-block';
import { PreviewFrame } from '../preview-frame/preview-frame';

@Component({
  selector: 'app-preview-item',
  imports: [PreviewFrame, CodeBlock],
  host: { class: 'block' },
  template: `
    <article class="border-t border-ink pt-4">
      <header class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 class="text-title font-bold"><span class="mr-2 font-mono text-meta font-normal text-graphite">{{ index() }}</span>{{ item().name }}</h3>
        <div class="flex font-mono text-meta" role="group" [attr.aria-label]="item().name + ' view'">
          <button type="button" class="min-h-9 border border-ink px-2.5" [class.bg-ink]="!showCode()" [class.text-paper]="!showCode()" [attr.aria-pressed]="!showCode()" (click)="showCode.set(false)">preview</button>
          <button type="button" class="-ml-px min-h-9 border border-ink px-2.5" [class.bg-ink]="showCode()" [class.text-paper]="showCode()" [attr.aria-pressed]="showCode()" (click)="showCode.set(true)">code</button>
        </div>
      </header>
      @if (item().notes) {
        <p class="mt-2 max-w-prose text-body text-graphite">{{ item().notes }}</p>
      }
      <div class="mt-3">
        @if (item().snippet; as snippet) {
          @if (showCode()) {
            <app-code-block [code]="snippet" />
          } @else {
            <app-preview-frame [snippet]="snippet" [theme]="theme()" [fonts]="fonts()" [mode]="mode()" [viewport]="viewport()" [padded]="padded()" [label]="item().name + ' preview'" />
          }
        } @else {
          <p class="border border-dashed border-ink p-4 font-mono text-meta text-graphite">{{ item().file }} didn't load. It's left out of the copied prompt.</p>
        }
      </div>
    </article>
  `,
})
export class PreviewItem {
  readonly item = input.required<LoadedItem>();
  readonly index = input.required<string>();
  readonly theme = input.required<string>();
  readonly fonts = input.required<FontSpec[]>();
  readonly mode = input.required<ColorMode>();
  readonly viewport = input.required<number>();
  readonly padded = input(true);
  protected readonly showCode = signal(false);
}
```

- [ ] **Step 6: Implement the four sections**

Create `src/app/features/system-detail/sections/items-section.ts`:
```ts
import { Component, input, model } from '@angular/core';
import { ColorMode, FontSpec, LoadedItem } from '../../../core/models';
import { PreviewControls } from '../../preview-frame/preview-controls';
import { PreviewItem } from '../preview-item';
import { padNumber } from '../../catalog/catalog-filter';

@Component({
  selector: 'app-items-section',
  imports: [PreviewControls, PreviewItem],
  template: `
    <div class="sticky top-0 z-10 -mx-4 border-b border-ink bg-paper px-4 py-2 md:mx-0 md:px-0">
      <app-preview-controls [(viewport)]="viewport" [(mode)]="mode" />
    </div>
    <div class="mt-4 flex flex-col gap-10">
      @for (item of items(); track item.id; let i = $index) {
        <app-preview-item [item]="item" [index]="prefix() + '.' + pad(i + 1)" [theme]="theme()" [fonts]="fonts()" [mode]="mode()" [viewport]="viewport()" [padded]="padded()" />
      }
    </div>
  `,
})
export class ItemsSection {
  readonly items = input.required<LoadedItem[]>();
  readonly theme = input.required<string>();
  readonly fonts = input.required<FontSpec[]>();
  readonly prefix = input.required<string>();
  readonly padded = input(true);
  readonly viewport = model.required<number>();
  readonly mode = model.required<ColorMode>();
  protected pad(n: number): string {
    return padNumber(n);
  }
}
```

Create `src/app/features/system-detail/sections/overview-section.ts`:
```ts
import { Component, computed, input, model } from '@angular/core';
import { ColorMode, SystemBundle } from '../../../core/models';
import { PreviewControls } from '../../preview-frame/preview-controls';
import { PreviewFrame } from '../../preview-frame/preview-frame';

@Component({
  selector: 'app-overview-section',
  imports: [PreviewControls, PreviewFrame],
  template: `
    <dl class="grid gap-x-8 gap-y-4 border-b border-ink pb-6 md:grid-cols-[10rem_1fr]">
      <dt class="font-mono text-meta text-graphite">use it for</dt>
      <dd class="text-body">{{ bundle().manifest.useCases.join(', ') }}</dd>
      <dt class="font-mono text-meta text-graphite">fonts</dt>
      <dd class="text-body">
        @for (font of bundle().manifest.fonts; track font.family) {
          <span class="block"><span class="font-bold">{{ font.family }}</span> <span class="text-graphite">{{ font.role }}</span></span>
        }
      </dd>
      <dt class="font-mono text-meta text-graphite">tags</dt>
      <dd class="flex flex-wrap gap-1.5">
        @for (tag of bundle().manifest.tags; track tag) {
          <span class="border border-ink px-2 py-0.5 font-mono text-meta">{{ tag }}</span>
        }
      </dd>
      <dt class="font-mono text-meta text-graphite">contents</dt>
      <dd class="text-body">{{ bundle().components.length }} components, {{ bundle().pages.length }} pages</dd>
    </dl>
    @if (landing(); as page) {
      <div class="mt-6">
        <app-preview-controls [(viewport)]="viewport" [(mode)]="mode" />
        <div class="mt-3">
          <app-preview-frame [snippet]="page" [theme]="bundle().theme" [fonts]="bundle().manifest.fonts" [mode]="mode()" [viewport]="viewport()" [padded]="false" label="Landing page preview" />
        </div>
      </div>
    }
  `,
})
export class OverviewSection {
  readonly bundle = input.required<SystemBundle>();
  readonly viewport = model.required<number>();
  readonly mode = model.required<ColorMode>();
  protected readonly landing = computed(() => this.bundle().pages.find((p) => p.id === 'landing')?.snippet ?? null);
}
```

Create `src/app/features/system-detail/sections/tokens-section.ts`:
```ts
import { Component, input } from '@angular/core';
import { SystemBundle } from '../../../core/models';
import { CodeBlock } from '../../../shared/ui/code-block';

@Component({
  selector: 'app-tokens-section',
  imports: [CodeBlock],
  template: `
    <h2 class="font-mono text-meta text-graphite">color, light and dark</h2>
    <ul class="mt-3 grid grid-cols-2 gap-px border border-ink bg-ink md:grid-cols-3">
      @for (color of bundle().manifest.palette; track color.token) {
        <li class="bg-paper">
          <div class="grid h-16 grid-cols-2" aria-hidden="true">
            <span [style.background]="color.light"></span>
            <span [style.background]="color.dark"></span>
          </div>
          <div class="border-t border-ink p-2.5">
            <p class="font-mono text-meta">{{ color.token }}</p>
            <p class="font-mono text-meta text-graphite">{{ color.light }} / {{ color.dark }}</p>
            <p class="mt-1 text-body">{{ color.role }}</p>
          </div>
        </li>
      }
    </ul>

    <h2 class="mt-10 font-mono text-meta text-graphite">type scale, ratio {{ bundle().manifest.typeScale.ratio }}</h2>
    <dl class="mt-3 border-t border-ink">
      @for (step of steps(); track step[0]) {
        <div class="flex items-baseline justify-between border-b border-ink py-2">
          <dt class="font-mono text-meta">text-{{ step[0] }}</dt>
          <dd class="font-mono text-meta text-graphite">{{ step[1] }}</dd>
        </div>
      }
    </dl>

    <h2 class="mt-10 font-mono text-meta text-graphite">theme.css</h2>
    <app-code-block class="mt-3" language="css" [code]="bundle().theme" />
  `,
})
export class TokensSection {
  readonly bundle = input.required<SystemBundle>();
  protected steps(): [string, string][] {
    return Object.entries(this.bundle().manifest.typeScale.steps);
  }
}
```

Create `src/app/features/system-detail/sections/rules-section.ts`:
```ts
import { Component, input } from '@angular/core';
import { Manifest } from '../../../core/models';

@Component({
  selector: 'app-rules-section',
  template: `
    <div class="grid gap-8 md:grid-cols-2">
      <section>
        <h2 class="font-mono text-meta text-graphite">do</h2>
        <ol class="mt-3 border-t border-ink">
          @for (rule of manifest().rules.do; track rule) {
            <li class="border-b border-ink py-3 text-body">{{ rule }}</li>
          }
        </ol>
      </section>
      <section>
        <h2 class="font-mono text-meta text-signal">don't</h2>
        <ol class="mt-3 border-t border-ink">
          @for (rule of manifest().rules.dont; track rule) {
            <li class="border-b border-ink py-3 text-body">{{ rule }}</li>
          }
        </ol>
      </section>
    </div>
    <section class="mt-10">
      <h2 class="font-mono text-meta text-graphite">global anti-slop rules, included in every prompt</h2>
      <p class="mt-3 whitespace-pre-line border border-ink p-4 text-body">{{ antiSlop() }}</p>
    </section>
  `,
})
export class RulesSection {
  readonly manifest = input.required<Manifest>();
  readonly antiSlop = input.required<string>();
}
```

- [ ] **Step 7: Implement the detail page**

Create `src/app/features/system-detail/system-detail.ts`:
```ts
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColorMode, SECTIONS, Section, SystemBundle } from '../../core/models';
import { buildPrompt } from '../../core/prompt-builder';
import { SystemsService } from '../../core/systems.service';
import { padNumber } from '../catalog/catalog-filter';
import { CopyBar } from './copy-bar';
import { ItemsSection } from './sections/items-section';
import { OverviewSection } from './sections/overview-section';
import { RulesSection } from './sections/rules-section';
import { TokensSection } from './sections/tokens-section';

@Component({
  selector: 'app-system-detail',
  imports: [RouterLink, CopyBar, OverviewSection, TokensSection, ItemsSection, RulesSection],
  template: `
    @switch (state()) {
      @case ('loading') {
        <p class="px-4 py-16 font-mono text-meta text-graphite md:px-8">Loading {{ slug() }}…</p>
      }
      @case ('not-found') {
        <div class="px-4 py-16 md:px-8">
          <p class="text-heading font-extrabold tracking-[-0.03em]">Not in the archive</p>
          <p class="mt-3 text-body text-graphite">There's no design system called "{{ slug() }}".</p>
          <a routerLink="/" class="mt-5 inline-flex min-h-11 items-center border border-ink px-5 font-bold hover:text-signal">Back to the archive</a>
        </div>
      }
      @case ('error') {
        <div class="px-4 py-16 md:px-8">
          <p class="text-title font-bold">{{ slug() }} didn't load.</p>
          <button type="button" class="mt-5 min-h-11 border border-ink bg-ink px-5 font-bold text-paper hover:border-signal hover:bg-signal" (click)="load(slug())">Retry</button>
        </div>
      }
      @default {
        @if (bundle(); as b) {
          <div class="pb-20 md:grid md:grid-cols-[17rem_1fr] md:pb-0 lg:grid-cols-[20rem_1fr]">
            <aside class="md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:border-r md:border-ink">
              <div class="border-b border-ink px-4 pb-5 pt-6 md:px-6">
                <a routerLink="/" class="inline-flex min-h-11 items-center font-mono text-meta hover:text-signal">← archive</a>
                <p class="font-mono text-meta text-graphite">No. {{ number() }}</p>
                <h1 class="mt-2 text-heading font-extrabold tracking-[-0.03em] md:text-[2.75rem] md:leading-none">{{ b.manifest.name }}</h1>
                <p class="mt-3 text-body text-graphite">{{ b.manifest.tagline }}</p>
              </div>
              <nav class="flex overflow-x-auto border-b border-ink font-mono text-meta md:flex-col md:border-b-0" aria-label="Sections">
                @for (s of sections; track s) {
                  <a
                    [routerLink]="['/s', slug(), s]"
                    class="flex min-h-11 shrink-0 items-center border-b-2 px-4 hover:text-signal md:border-b md:px-6"
                    [class]="active() === s ? 'border-b-signal md:border-b-ink md:bg-ink md:text-paper' : 'border-b-transparent md:border-b-ink'"
                    [attr.aria-current]="active() === s ? 'page' : null"
                  >{{ s }}</a>
                }
              </nav>
              <app-copy-bar class="fixed inset-x-0 bottom-0 z-20 border-t border-ink md:static md:mt-auto md:border-t-0" [prompt]="prompt()" [name]="b.manifest.name" />
            </aside>

            <div class="min-w-0 px-4 py-6 md:px-8">
              <p class="mb-6 max-w-prose text-body">{{ b.manifest.description }}</p>
              @switch (active()) {
                @case ('overview') { <app-overview-section [bundle]="b" [(viewport)]="viewport" [(mode)]="mode" /> }
                @case ('tokens') { <app-tokens-section [bundle]="b" /> }
                @case ('components') { <app-items-section prefix="c" [items]="b.components" [theme]="b.theme" [fonts]="b.manifest.fonts" [(viewport)]="viewport" [(mode)]="mode" /> }
                @case ('pages') { <app-items-section prefix="p" [padded]="false" [items]="b.pages" [theme]="b.theme" [fonts]="b.manifest.fonts" [(viewport)]="viewport" [(mode)]="mode" /> }
                @case ('rules') { <app-rules-section [manifest]="b.manifest" [antiSlop]="antiSlop()" /> }
              }
            </div>
          </div>
        }
      }
    }
  `,
})
export class SystemDetail {
  readonly slug = input.required<string>();
  readonly section = input<string>();

  private readonly systems = inject(SystemsService);
  protected readonly sections = SECTIONS;
  protected readonly state = signal<'loading' | 'ready' | 'not-found' | 'error'>('loading');
  protected readonly bundle = signal<SystemBundle | null>(null);
  protected readonly antiSlop = signal('');
  protected readonly viewport = signal(375);
  protected readonly mode = signal<ColorMode>('light');

  protected readonly active = computed<Section>(() => {
    const s = this.section();
    return (SECTIONS as readonly string[]).includes(s ?? '') ? (s as Section) : 'overview';
  });
  protected readonly number = computed(() => padNumber(this.bundle()?.manifest.number ?? 0));
  protected readonly prompt = computed(() => {
    const b = this.bundle();
    return b ? buildPrompt(b, this.antiSlop()) : '';
  });

  constructor() {
    effect(() => {
      const slug = this.slug();
      untracked(() => this.load(slug));
    });
  }

  protected async load(slug: string): Promise<void> {
    this.state.set('loading');
    try {
      const [bundle, antiSlop] = await Promise.all([this.systems.loadBundle(slug), this.systems.loadAntiSlop()]);
      this.bundle.set(bundle);
      this.antiSlop.set(antiSlop);
      this.mode.set(bundle.manifest.defaultMode);
      this.state.set('ready');
    } catch (err) {
      this.state.set(err instanceof HttpErrorResponse && err.status === 404 ? 'not-found' : 'error');
    }
  }
}
```

- [ ] **Step 8: Wire the routes**

Replace `src/app/app.routes.ts`:
```ts
import { Routes } from '@angular/router';

const detail = () => import('./features/system-detail/system-detail').then((m) => m.SystemDetail);

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/catalog/catalog').then((m) => m.Catalog) },
  { path: 's/:slug', loadComponent: detail },
  { path: 's/:slug/:section', loadComponent: detail },
  { path: '**', redirectTo: '' },
];
```

- [ ] **Step 9: Run tests and build**

Run: `npx ng test --watch=false`
Expected: all tests pass.

Run: `npx ng build`
Expected: build succeeds.

- [ ] **Step 10: Check the full flow in the browser**

With `npx ng serve` running, in the built-in browser:
1. At 375 px: open `/`, tap the Neo-Brutalist tile. Expected: title block, scrollable section tabs, description, overview landing preview, fixed "Copy for AI" bar at the bottom with a token count.
2. Open each section. Components: each item shows a preview scaled to fit; switching to 1280 scales it down; toggling dark switches the preview colors; "code" shows the snippet. Tokens: swatches split light/dark, type scale, theme code.
3. Tap "Copy for AI". Expected: toast "Copied Neo-Brutalist for your agent". Paste into a scratch text area (or read `navigator.clipboard.readText()` via the JS tool) and confirm all ten sections are present.
4. Open `/s/does-not-exist`. Expected: "Not in the archive".
5. At desktop width: two-column layout, copy bar at the bottom of the left column.
6. Toggle the shell theme in the header. Expected: shell flips; preview mode is independent.

Fix any layout bugs found, then rerun tests.

- [ ] **Step 11: Commit**

```bash
git add src/app
git commit -m "feat(detail): add system detail page with sections, previews, and Copy for AI"
```

---

### Tasks 10 to 14: Remaining design systems

Each task follows the same steps. They touch only their own folder plus one line in `index.json`, so they can run in parallel if `index.json` is edited last (or merged by hand).

**Shared steps for each system task:**

- [ ] **Step 1:** Create `public/systems/<slug>/manifest.json` exactly as given. The `components` array is built from the notes table: each row becomes `{ "id": <id>, "name": <name>, "file": "components/<id>.html", "notes": <notes> }`, in table order. `pages` is `[{ "id": "landing", "name": "Landing", "file": "pages/landing.html" }, { "id": "app", "name": <app page name>, "file": "pages/app.html" }]`.
- [ ] **Step 2:** Create `public/systems/<slug>/theme.css` exactly as given.
- [ ] **Step 3:** Add `<slug>` to `public/systems/index.json`, keeping the list ordered by system number.
- [ ] **Step 4:** Create the 12 component files and 2 page files using the Task 6 skeleton and content contract, the notes table, and the brief. Use `public/systems/neo-brutalist/components/button.html` as the quality reference for structure, not for style. For dark-first systems, put `class="dark"` on `<html>`.
- [ ] **Step 5:** Run `npm run sync:themes`, then `npm run check:systems` until it prints `All systems pass.`
- [ ] **Step 6:** In the running app, open `/s/<slug>/components` and `/s/<slug>/pages` at 375 and 1280 in both modes. Fix overflow, contrast, and anything that looks generic.
- [ ] **Step 7:** Commit: `git add public/systems && git commit -m "feat(systems): add No. <nn> <Name>"`

---

### Task 10: No. 01 Editorial / Swiss

Brief: **The Ledger Review**, a long-form publication about money and cities. Voice: measured, precise, a little dry. App page: "Article" (article page with kicker, headline, deck, byline, drop cap, pull quote, footnotes, related list).

`manifest.json`:
```json
{
  "slug": "editorial-swiss",
  "number": 1,
  "name": "Editorial / Swiss",
  "tagline": "A strict grid, serious type, and one blue ink.",
  "description": "Built like a printed review. A 12-column grid, a variable serif for reading, a plain grotesk for interface text, and hairline column rules. Color is almost absent so the one cobalt accent carries meaning.",
  "tags": ["editorial", "light", "reading", "content", "minimal"],
  "defaultMode": "light",
  "useCases": ["publications and blogs", "portfolios", "research and reports", "documentation landing pages"],
  "fonts": [
    { "family": "Newsreader", "role": "headlines and body text; use optical sizing", "weights": [400, 500, 600, 700], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Libre+Franklin:wght@400;500;700&display=swap" },
    { "family": "Libre Franklin", "role": "kickers, captions, navigation, buttons", "weights": [400, 500, 700], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Libre+Franklin:wght@400;500;700&display=swap" }
  ],
  "typeScale": { "ratio": 1.5, "steps": { "xs": "13px", "sm": "15px", "base": "18px", "lg": "27px", "xl": "40px", "2xl": "60px", "display": "90px" } },
  "palette": [
    { "token": "--color-bg", "light": "#F7F4EC", "dark": "#12110E", "role": "newsprint background" },
    { "token": "--color-surface", "light": "#FFFDF8", "dark": "#1B1A16", "role": "inputs and raised panels" },
    { "token": "--color-ink", "light": "#111111", "dark": "#EDE8DC", "role": "text" },
    { "token": "--color-muted", "light": "#5A564C", "dark": "#A39E90", "role": "captions and metadata" },
    { "token": "--color-line", "light": "#D9D3C4", "dark": "#3A372F", "role": "hairline column rules" },
    { "token": "--color-line-strong", "light": "#111111", "dark": "#EDE8DC", "role": "section rules" },
    { "token": "--color-accent", "light": "#1F3FBF", "dark": "#8EA2FF", "role": "links, kickers, primary action" },
    { "token": "--color-accent-ink", "light": "#FFFFFF", "dark": "#12110E", "role": "text on accent" },
    { "token": "--color-danger", "light": "#B3261E", "dark": "#F2867D", "role": "errors" },
    { "token": "--color-success", "light": "#2E6B3A", "dark": "#86C79A", "role": "success" }
  ],
  "allowedGradients": [],
  "rules": {
    "do": [
      "Lay everything on a 12-column grid with 24px gutters; let text blocks span 7 or 8 columns, not 12",
      "Set reading text in Newsreader at 18px with a line height of 1.6 and a measure of 60 to 72 characters",
      "Use Libre Franklin uppercase with 0.08em tracking for kickers and captions only",
      "Separate columns with 1px hairline rules and sections with a 2px rule in line-strong",
      "Reserve cobalt for links, kickers, and the single primary action"
    ],
    "dont": [
      "Do not use rounded corners or shadows",
      "Do not center body text",
      "Do not use more than one accent color",
      "Do not set headlines in the grotesk",
      "Do not use icons where a word works"
    ]
  },
  "components": [],
  "pages": []
}
```

Notes table:

| id | name | notes |
|---|---|---|
| button | Button | Rectangular, Libre Franklin 500. Primary is a cobalt fill; secondary is a 1px ink outline; ghost is an underlined text link. |
| input | Input | Bottom border only, label in small caps above, serif input text. Error swaps the border to danger and adds a caption. |
| select | Select | Bottom border only with a thin chevron; reads like a form in a printed questionnaire. |
| checkbox-toggle | Checkbox and toggle | Square 1px checkbox with a cobalt check. Switch is a slim pill track, the only rounded shape allowed. |
| badge | Badge | Uppercase Libre Franklin with tracking, no fill, a 1px rule beneath. |
| card | Card | An article teaser: kicker, serif headline, deck, byline. Separated by hairlines rather than boxed. |
| navbar | Navbar | Masthead with the serif wordmark centered above a rule, section links below in uppercase grotesk. |
| modal | Modal and sheet | Plain surface, 2px top rule, serif title, no shadow; backdrop is ink at 40 percent. |
| table | Table | Financial-page table: hairline rows, tabular figures, a bold total row with a double rule above. |
| bento | Bento grid | A front-page layout: lead story 2x2, two briefs, a chart box, and a numbers column. |
| empty-state | Empty state | Centered within a column: italic serif line, caption, and a text link action. |
| toast | Toast | A thin bar with a kicker label and a one-line message, set flush to the column. |

App page name: `Article`.

`theme.css`:
```css
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-*: initial;
  --color-bg: #F7F4EC;
  --color-surface: #FFFDF8;
  --color-ink: #111111;
  --color-muted: #5A564C;
  --color-line: #D9D3C4;
  --color-line-strong: #111111;
  --color-accent: #1F3FBF;
  --color-accent-ink: #FFFFFF;
  --color-danger: #B3261E;
  --color-success: #2E6B3A;

  --font-display: "Newsreader", ui-serif, Georgia, serif;
  --font-body: "Newsreader", ui-serif, Georgia, serif;
  --font-ui: "Libre Franklin", ui-sans-serif, sans-serif;

  --text-*: initial;
  --text-xs: 0.8125rem;
  --text-xs--line-height: 1.4;
  --text-sm: 0.9375rem;
  --text-sm--line-height: 1.5;
  --text-base: 1.125rem;
  --text-base--line-height: 1.6;
  --text-lg: 1.6875rem;
  --text-lg--line-height: 1.25;
  --text-xl: 2.5rem;
  --text-xl--line-height: 1.1;
  --text-2xl: 3.75rem;
  --text-2xl--line-height: 1;
  --text-display: 5.625rem;
  --text-display--line-height: 0.95;

  --radius-*: initial;
  --radius-full: 9999px;
  --shadow-*: initial;
}

@layer base {
  .dark {
    --color-bg: #12110E;
    --color-surface: #1B1A16;
    --color-ink: #EDE8DC;
    --color-muted: #A39E90;
    --color-line: #3A372F;
    --color-line-strong: #EDE8DC;
    --color-accent: #8EA2FF;
    --color-accent-ink: #12110E;
    --color-danger: #F2867D;
    --color-success: #86C79A;
  }
  body {
    background: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-body);
    font-optical-sizing: auto;
    -webkit-font-smoothing: antialiased;
  }
}
```

---

### Task 11: No. 03 Calm SaaS

Brief: **Tally**, invoicing and cash-flow for small agencies. Voice: calm, exact, numbers first. App page: "Dashboard" (KPI bento, invoices table with filters, cash-flow bar chart made of divs, activity list, side navigation that collapses to a bottom tab bar on mobile).

`manifest.json`:
```json
{
  "slug": "calm-saas",
  "number": 3,
  "name": "Calm SaaS",
  "tagline": "Dense, warm, and quiet. Numbers do the talking.",
  "description": "For products people use all day. Warm stone neutrals instead of cold grays, a single moss accent, 13px data text with tabular figures, and hairline structure. Density is a feature here, so spacing is tight and consistent.",
  "tags": ["dashboard", "light", "dense", "saas", "minimal"],
  "defaultMode": "light",
  "useCases": ["admin panels", "B2B dashboards", "settings and billing pages", "internal tools"],
  "fonts": [
    { "family": "Onest", "role": "interface and headings", "weights": [400, 500, 600, 700], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Fragment+Mono&family=Onest:wght@400;500;600;700&display=swap" },
    { "family": "Fragment Mono", "role": "IDs, amounts in tables, code", "weights": [400], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Fragment+Mono&family=Onest:wght@400;500;600;700&display=swap" }
  ],
  "typeScale": { "ratio": 1.333, "steps": { "xs": "12px", "sm": "13px", "base": "14px", "lg": "19px", "xl": "25px", "2xl": "33px", "display": "44px" } },
  "palette": [
    { "token": "--color-bg", "light": "#F6F5F2", "dark": "#141412", "role": "app background" },
    { "token": "--color-surface", "light": "#FFFFFF", "dark": "#1C1B19", "role": "panels and tables" },
    { "token": "--color-ink", "light": "#1C1B19", "dark": "#ECEAE4", "role": "text" },
    { "token": "--color-muted", "light": "#6B6860", "dark": "#9C998F", "role": "secondary text" },
    { "token": "--color-line", "light": "#E4E1DA", "dark": "#2E2D29", "role": "hairlines" },
    { "token": "--color-accent", "light": "#3F6B4E", "dark": "#8DBB9A", "role": "primary action, selection" },
    { "token": "--color-accent-ink", "light": "#FFFFFF", "dark": "#141412", "role": "text on accent" },
    { "token": "--color-accent-soft", "light": "#E3ECE5", "dark": "#22302A", "role": "selected rows, soft badges" },
    { "token": "--color-warning", "light": "#9A6700", "dark": "#E0B252", "role": "overdue, warnings" },
    { "token": "--color-danger", "light": "#B42318", "dark": "#F09A8F", "role": "errors, destructive" }
  ],
  "allowedGradients": [],
  "rules": {
    "do": [
      "Use 13px for table and form text and 14px for body; headings step up by the 1.333 ratio",
      "Right-align every number and set it with tabular-nums",
      "Build structure from 1px hairlines and surface changes, not shadows",
      "Keep one moss accent for the primary action and the current selection",
      "Use 6px radius on controls and 10px on panels, nothing larger"
    ],
    "dont": [
      "Do not add illustrations or decorative icons to dashboards",
      "Do not use colored backgrounds for whole cards",
      "Do not show more than one primary button per view",
      "Do not use shadows except on popovers and dialogs",
      "Do not use cool blue-grays; neutrals stay warm"
    ]
  },
  "components": [],
  "pages": []
}
```

Notes table:

| id | name | notes |
|---|---|---|
| button | Button | 32px tall at sm, 36px at md (wrapped to 44px tap area on touch). Primary is moss; secondary is surface with a hairline; ghost is text with a hover fill. |
| input | Input | 36px, hairline border, 6px radius, label 13px 500 above. Error shows a danger border and a 12px message. |
| select | Select | Same frame as input with a 12px chevron; includes a compact inline variant used in table filters. |
| checkbox-toggle | Checkbox and toggle | 16px checkbox with moss fill when checked. Switch is 28 by 16 with a soft track. |
| badge | Badge | Soft fills (accent-soft) with text in the matching strong color; 12px, 4px radius. Overdue uses warning. |
| card | Card | A KPI panel: label, big number, delta with direction, and a tiny sparkline in inline SVG. |
| navbar | Navbar | App top bar with workspace switcher, search field, and avatar initials. Mobile collapses links into a details menu. |
| modal | Modal and sheet | Surface with 10px radius and the pop shadow; header, form body, footer actions right-aligned. |
| table | Table | Dense invoices table: checkbox column, mono invoice IDs, client, due date, amount right-aligned, status badge, sticky header. |
| bento | Bento grid | Dashboard overview: revenue 2x2 with a bar chart, three KPI tiles, and an activity list. |
| empty-state | Empty state | Inside a table frame: short headline, one sentence, primary action, and a secondary import link. |
| toast | Toast | Ink background in light mode, small and bottom-left, with an undo action. |

App page name: `Dashboard`.

`theme.css`:
```css
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-*: initial;
  --color-bg: #F6F5F2;
  --color-surface: #FFFFFF;
  --color-ink: #1C1B19;
  --color-muted: #6B6860;
  --color-line: #E4E1DA;
  --color-accent: #3F6B4E;
  --color-accent-ink: #FFFFFF;
  --color-accent-soft: #E3ECE5;
  --color-warning: #9A6700;
  --color-danger: #B42318;

  --font-display: "Onest", ui-sans-serif, sans-serif;
  --font-body: "Onest", ui-sans-serif, sans-serif;
  --font-mono: "Fragment Mono", ui-monospace, monospace;

  --text-*: initial;
  --text-xs: 0.75rem;
  --text-xs--line-height: 1.4;
  --text-sm: 0.8125rem;
  --text-sm--line-height: 1.45;
  --text-base: 0.875rem;
  --text-base--line-height: 1.55;
  --text-lg: 1.1875rem;
  --text-lg--line-height: 1.35;
  --text-xl: 1.5625rem;
  --text-xl--line-height: 1.2;
  --text-2xl: 2.0625rem;
  --text-2xl--line-height: 1.1;
  --text-display: 2.75rem;
  --text-display--line-height: 1.05;

  --radius-*: initial;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-full: 9999px;

  --shadow-*: initial;
  --shadow-pop: 0 1px 2px rgb(28 27 25 / 0.06), 0 8px 24px rgb(28 27 25 / 0.08);
}

@layer base {
  .dark {
    --color-bg: #141412;
    --color-surface: #1C1B19;
    --color-ink: #ECEAE4;
    --color-muted: #9C998F;
    --color-line: #2E2D29;
    --color-accent: #8DBB9A;
    --color-accent-ink: #141412;
    --color-accent-soft: #22302A;
    --color-warning: #E0B252;
    --color-danger: #F09A8F;
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

### Task 12: No. 04 Terminal / Retro

Brief: **nightshift**, a job queue monitor for backend teams. Voice: terse, lowercase product name, status-line style. App page: "Queue monitor" (status header with uptime, queue table, live log panel with a blinking cursor, worker grid drawn with ASCII-style boxes).

`manifest.json`:
```json
{
  "slug": "terminal-retro",
  "number": 4,
  "name": "Terminal / Retro",
  "tagline": "Phosphor on black. Every pixel earns its place.",
  "description": "A dark-first system that borrows from terminals and line printers. Monospace everywhere, a bitmap display face for big moments, box-drawing borders, and status tags in brackets. The light mode is a printout, not an inverted screen.",
  "tags": ["dark", "mono", "dev-tool", "retro", "dashboard"],
  "defaultMode": "dark",
  "useCases": ["developer tools and CLIs", "monitoring dashboards", "changelogs and docs for technical products", "hacker-flavored landing pages"],
  "fonts": [
    { "family": "JetBrains Mono", "role": "all interface and body text", "weights": [400, 500, 700], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=VT323&display=swap" },
    { "family": "VT323", "role": "display headlines and big numbers only", "weights": [400], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=VT323&display=swap" }
  ],
  "typeScale": { "ratio": 1.333, "steps": { "xs": "12px", "sm": "13px", "base": "14px", "lg": "19px", "xl": "25px", "2xl": "33px", "display": "72px" } },
  "palette": [
    { "token": "--color-bg", "light": "#EDEAD8", "dark": "#0B0F0C", "role": "screen or paper" },
    { "token": "--color-surface", "light": "#F6F4E8", "dark": "#111812", "role": "panels" },
    { "token": "--color-ink", "light": "#1D2B1F", "dark": "#C8F5D2", "role": "text" },
    { "token": "--color-muted", "light": "#5C6B5E", "dark": "#5E7A64", "role": "comments, metadata" },
    { "token": "--color-line", "light": "#1D2B1F", "dark": "#2B3A2F", "role": "box borders" },
    { "token": "--color-accent", "light": "#1F7A3A", "dark": "#7CF29A", "role": "phosphor accent, ok status, prompt" },
    { "token": "--color-accent-ink", "light": "#EDEAD8", "dark": "#0B0F0C", "role": "text on accent" },
    { "token": "--color-amber", "light": "#9A5B00", "dark": "#FFB547", "role": "warnings, highlights" },
    { "token": "--color-danger", "light": "#B3261E", "dark": "#FF6B5B", "role": "errors" }
  ],
  "allowedGradients": [],
  "rules": {
    "do": [
      "Set all text in JetBrains Mono at 14px; use VT323 only for display text and large numbers",
      "Draw containers with 1px solid borders and label them in the top border like a terminal window title",
      "Show status with bracket tags such as [ok], [warn], [err], colored by meaning",
      "Prefix interactive rows and prompts with a > or $ character",
      "Use inverse video (accent background, accent-ink text) for the selected row and the primary action"
    ],
    "dont": [
      "Do not round any corner",
      "Do not add glow, bloom, or text-shadow to phosphor text",
      "Do not use scanline overlays on content that must be read",
      "Do not use proportional fonts anywhere",
      "Do not invert the dark theme to make the light theme; light mode is printout paper"
    ]
  },
  "components": [],
  "pages": []
}
```

Notes table:

| id | name | notes |
|---|---|---|
| button | Button | Bracketed labels like [ deploy ]. Primary is inverse video; secondary is bordered; ghost is text with a > prefix on hover. |
| input | Input | A prompt line: $ prefix, no box, a block cursor drawn with a blinking span. Error prints an [err] line below. |
| select | Select | Bordered native select with a v chevron character; label written as a key with a colon, for example "env:". |
| checkbox-toggle | Checkbox and toggle | Checkbox rendered as [x] and [ ] text. Switch rendered as on / off segments with inverse video on the active one. |
| badge | Badge | Bracket tags: [ok] accent, [warn] amber, [err] danger, [idle] muted. |
| card | Card | Terminal window: title in the top border, body text, footer status line. |
| navbar | Navbar | Single status line: product name, path, links separated by pipes, clock on the right. Mobile uses a details menu. |
| modal | Modal and sheet | Box with a double top border, title line, body, and [ confirm ] [ cancel ] actions. |
| table | Table | Fixed-width columns, header underlined with box-drawing characters, inverse selected row, numbers right-aligned. |
| bento | Bento grid | Worker grid: a large throughput number in VT323, a sparkline made of block characters, queue depth, and a log excerpt. |
| empty-state | Empty state | A comment-style message (# nothing queued) and a command to copy. |
| toast | Toast | One-line log entries with timestamps and status tags, stacked. |

App page name: `Queue monitor`.

`theme.css`:
```css
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-*: initial;
  --color-bg: #EDEAD8;
  --color-surface: #F6F4E8;
  --color-ink: #1D2B1F;
  --color-muted: #5C6B5E;
  --color-line: #1D2B1F;
  --color-accent: #1F7A3A;
  --color-accent-ink: #EDEAD8;
  --color-amber: #9A5B00;
  --color-danger: #B3261E;

  --font-display: "VT323", ui-monospace, monospace;
  --font-body: "JetBrains Mono", ui-monospace, monospace;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --text-*: initial;
  --text-xs: 0.75rem;
  --text-xs--line-height: 1.5;
  --text-sm: 0.8125rem;
  --text-sm--line-height: 1.5;
  --text-base: 0.875rem;
  --text-base--line-height: 1.6;
  --text-lg: 1.1875rem;
  --text-lg--line-height: 1.4;
  --text-xl: 1.5625rem;
  --text-xl--line-height: 1.2;
  --text-2xl: 2.0625rem;
  --text-2xl--line-height: 1;
  --text-display: 4.5rem;
  --text-display--line-height: 0.9;

  --radius-*: initial;
  --shadow-*: initial;

  --animate-blink: blink 1s steps(1) infinite;
  @keyframes blink {
    50% { opacity: 0; }
  }
}

@layer base {
  .dark {
    --color-bg: #0B0F0C;
    --color-surface: #111812;
    --color-ink: #C8F5D2;
    --color-muted: #5E7A64;
    --color-line: #2B3A2F;
    --color-accent: #7CF29A;
    --color-accent-ink: #0B0F0C;
    --color-amber: #FFB547;
    --color-danger: #FF6B5B;
  }
  body {
    background: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-body);
    font-size: var(--text-base);
  }
}
```

---

### Task 13: No. 05 Organic Warm

Brief: **Slow Clay Studio**, a pottery studio that sells classes and pieces. Voice: warm, specific, sensory, never twee. App page: "Book a class" (class detail with arched image placeholder, date and time slot picker as radio cards, group size stepper, price summary, booking button, and FAQ in details elements).

`manifest.json`:
```json
{
  "slug": "organic-warm",
  "number": 5,
  "name": "Organic Warm",
  "tagline": "Oat, clay, and olive. Soft shapes with a firm hand.",
  "description": "A warm, tactile system for brands made by people. Earthy colors, large radii and arched shapes, a characterful serif for headlines, and a clean sans for reading. Compositions are asymmetric so pages feel arranged by hand, not generated.",
  "tags": ["warm", "light", "lifestyle", "commerce", "soft"],
  "defaultMode": "light",
  "useCases": ["food and drink", "wellness and studios", "craft and small-batch commerce", "booking flows"],
  "fonts": [
    { "family": "Young Serif", "role": "headlines and prices", "weights": [400], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Young+Serif&display=swap" },
    { "family": "Instrument Sans", "role": "body and interface", "weights": [400, 500, 600], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Young+Serif&display=swap" }
  ],
  "typeScale": { "ratio": 1.333, "steps": { "xs": "13px", "sm": "15px", "base": "17px", "lg": "23px", "xl": "30px", "2xl": "40px", "display": "56px" } },
  "palette": [
    { "token": "--color-bg", "light": "#F3EBDD", "dark": "#1E1712", "role": "oat background" },
    { "token": "--color-surface", "light": "#FBF6EC", "dark": "#2A2019", "role": "cards and fields" },
    { "token": "--color-ink", "light": "#3A2A20", "dark": "#F1E6D4", "role": "cocoa text" },
    { "token": "--color-muted", "light": "#7A6656", "dark": "#BFA98F", "role": "secondary text" },
    { "token": "--color-line", "light": "#DCCDB5", "dark": "#45372B", "role": "borders" },
    { "token": "--color-accent", "light": "#B5532F", "dark": "#E07A4F", "role": "clay, primary action" },
    { "token": "--color-accent-ink", "light": "#FBF6EC", "dark": "#1E1712", "role": "text on clay" },
    { "token": "--color-olive", "light": "#5E6B3A", "dark": "#A5B27A", "role": "secondary accent, success" },
    { "token": "--color-danger", "light": "#A3341F", "dark": "#F08E76", "role": "errors" }
  ],
  "allowedGradients": [],
  "rules": {
    "do": [
      "Use 28px radius on cards and images, full radius on buttons and chips",
      "Mask hero and product images with an arch (rounded top only) or a pill shape",
      "Underline one key word per headline with the hand-drawn SVG stroke in clay",
      "Offset compositions: image and text blocks overlap or sit on different baselines",
      "Use olive for success and secondary emphasis, clay for the main action"
    ],
    "dont": [
      "Do not use pure white or pure black",
      "Do not use sharp corners on interactive elements",
      "Do not use script or handwriting fonts",
      "Do not place three equal cards in a row; vary size and shape",
      "Do not use stock-photo style placeholders; draw shapes with tokens instead"
    ]
  },
  "components": [],
  "pages": []
}
```

Notes table:

| id | name | notes |
|---|---|---|
| button | Button | Full-radius pills. Primary clay; secondary is a 1.5px cocoa outline; ghost is text with the hand-drawn underline on hover. |
| input | Input | 20px radius fields on surface with a line border, label above in 500 weight. Error turns the border danger and adds a gentle message. |
| select | Select | Pill-shaped select with a soft chevron, used for class type. |
| checkbox-toggle | Checkbox and toggle | Rounded 6px checkbox in clay. Switch is a fat pill with an olive track when on. |
| badge | Badge | Pills with tinted surface fills; "Few spots left" uses clay text on a clay-tinted surface. |
| card | Card | Product card: arched image shape drawn with tokens, serif name, price, and a short material note. |
| navbar | Navbar | Serif wordmark, links, and a pill "Book a class" action. Mobile menu is a details disclosure with large tap rows. |
| modal | Modal and sheet | 28px radius sheet that slides up from the bottom on mobile, centered on desktop, with a soft shadow. |
| table | Table | Class schedule: rounded container, alternating surface rows, date, class, teacher, spots left, price. |
| bento | Bento grid | Studio features: one tall arched image tile, a quote tile, a price tile, a map-like tile, and a hours list. |
| empty-state | Empty state | A drawn bowl shape in clay, a warm headline, and a pill action. |
| toast | Toast | Pill-shaped surface toast with an olive dot for success and a clay dot for errors. |

App page name: `Book a class`.

`theme.css`:
```css
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-*: initial;
  --color-bg: #F3EBDD;
  --color-surface: #FBF6EC;
  --color-ink: #3A2A20;
  --color-muted: #7A6656;
  --color-line: #DCCDB5;
  --color-accent: #B5532F;
  --color-accent-ink: #FBF6EC;
  --color-olive: #5E6B3A;
  --color-danger: #A3341F;

  --font-display: "Young Serif", ui-serif, Georgia, serif;
  --font-body: "Instrument Sans", ui-sans-serif, sans-serif;

  --text-*: initial;
  --text-xs: 0.8125rem;
  --text-xs--line-height: 1.45;
  --text-sm: 0.9375rem;
  --text-sm--line-height: 1.5;
  --text-base: 1.0625rem;
  --text-base--line-height: 1.6;
  --text-lg: 1.4375rem;
  --text-lg--line-height: 1.3;
  --text-xl: 1.875rem;
  --text-xl--line-height: 1.2;
  --text-2xl: 2.5rem;
  --text-2xl--line-height: 1.1;
  --text-display: 3.5rem;
  --text-display--line-height: 1.02;

  --radius-*: initial;
  --radius-sm: 12px;
  --radius-md: 20px;
  --radius-lg: 28px;
  --radius-arch: 999px 999px 28px 28px;
  --radius-full: 9999px;

  --shadow-*: initial;
  --shadow-soft: 0 12px 32px -12px rgb(58 42 32 / 0.25);
}

@layer base {
  .dark {
    --color-bg: #1E1712;
    --color-surface: #2A2019;
    --color-ink: #F1E6D4;
    --color-muted: #BFA98F;
    --color-line: #45372B;
    --color-accent: #E07A4F;
    --color-accent-ink: #1E1712;
    --color-olive: #A5B27A;
    --color-danger: #F08E76;
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

### Task 14: No. 06 Dark Luxury

Brief: **Maison Ardent**, an independent watchmaker. Voice: restrained, exact, unhurried; short sentences. App page: "Collection" (collection grid with one oversized hero piece, refined filter row, piece detail panel with specifications in a two-column definition list, appointment request form).

`manifest.json`:
```json
{
  "slug": "dark-luxury",
  "number": 6,
  "name": "Dark Luxury",
  "tagline": "Black, bone, and a little brass. Nothing hurried.",
  "description": "A dark-first system for premium brands. High-contrast Didone headlines, a geometric sans in light weights, hairline rules, and a lot of empty space. Brass appears in small doses and never as a gradient. Motion is slow and quiet.",
  "tags": ["dark", "premium", "editorial", "commerce", "minimal"],
  "defaultMode": "dark",
  "useCases": ["luxury and fashion", "hospitality", "fine products", "portfolio for high-end studios"],
  "fonts": [
    { "family": "Bodoni Moda", "role": "headlines, numerals, and prices; use optical sizing", "weights": [400, 500, 600], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=Jost:wght@300;400;500&display=swap" },
    { "family": "Jost", "role": "body, labels, navigation", "weights": [300, 400, 500], "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=Jost:wght@300;400;500&display=swap" }
  ],
  "typeScale": { "ratio": 1.618, "steps": { "xs": "12px", "sm": "13px", "base": "15px", "lg": "24px", "xl": "39px", "2xl": "63px", "display": "102px" } },
  "palette": [
    { "token": "--color-bg", "light": "#F2EEE6", "dark": "#0A0A0A", "role": "background" },
    { "token": "--color-surface", "light": "#FAF8F3", "dark": "#121211", "role": "panels and fields" },
    { "token": "--color-ink", "light": "#14130F", "dark": "#E9E4D8", "role": "bone text" },
    { "token": "--color-muted", "light": "#6E695E", "dark": "#8C877C", "role": "secondary text" },
    { "token": "--color-line", "light": "#CFC8B8", "dark": "#2A2826", "role": "hairlines" },
    { "token": "--color-accent", "light": "#7D6440", "dark": "#A88B5C", "role": "brass details, primary action" },
    { "token": "--color-accent-ink", "light": "#F2EEE6", "dark": "#0A0A0A", "role": "text on brass" },
    { "token": "--color-danger", "light": "#8E2A20", "dark": "#D98A7E", "role": "errors" }
  ],
  "allowedGradients": [],
  "rules": {
    "do": [
      "Use Jost uppercase at 12 or 13px with 0.24em tracking for labels and navigation",
      "Set headlines in Bodoni Moda with optical sizing; use italics for one word of emphasis",
      "Separate everything with 0.5px or 1px hairlines in line color",
      "Leave at least 96px of vertical space between sections on desktop and 64px on mobile",
      "Animate with slow fades and small vertical moves, 400ms, never springs"
    ],
    "dont": [
      "Do not use gold gradients, metallic effects, or glow",
      "Do not use rounded corners",
      "Do not use bold weights for body text",
      "Do not crowd a screen with more than one call to action",
      "Do not use exclamation marks or urgency language such as \"limited time\""
    ]
  },
  "components": [],
  "pages": []
}
```

Notes table:

| id | name | notes |
|---|---|---|
| button | Button | Rectangular, uppercase Jost with wide tracking. Primary is a brass outline that fills slowly on hover; secondary is bone text with a hairline underline. |
| input | Input | Underline-only fields with uppercase labels; focus thickens the line to brass. Error adds a small italic serif message. |
| select | Select | Underline-only select with a fine chevron drawn in SVG. |
| checkbox-toggle | Checkbox and toggle | 14px square hairline checkbox with a brass fill. Switch is a thin line track with a small square thumb. |
| badge | Badge | Uppercase micro labels with a hairline frame, no fills. |
| card | Card | Piece card: tall image area drawn with layered tokens, serif name, reference number in small caps, price in serif. |
| navbar | Navbar | Centered wordmark in the serif, links split left and right in tracked caps. Mobile menu is a details disclosure that opens a full-height panel. |
| modal | Modal and sheet | Full-bleed dark overlay, centered panel with hairline frame, serif title, generous padding. |
| table | Table | Specifications table: two columns, hairline rows, labels in tracked caps, values in serif. |
| bento | Bento grid | Editorial collection grid: one oversized piece 2x2, a quote, two smaller pieces, and a craftsmanship note. |
| empty-state | Empty state | A single serif line in italics, a hairline, and a quiet text action. |
| toast | Toast | Thin bar with a brass hairline on top, uppercase label and short message. |

App page name: `Collection`.

`theme.css`:
```css
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-*: initial;
  --color-bg: #F2EEE6;
  --color-surface: #FAF8F3;
  --color-ink: #14130F;
  --color-muted: #6E695E;
  --color-line: #CFC8B8;
  --color-accent: #7D6440;
  --color-accent-ink: #F2EEE6;
  --color-danger: #8E2A20;

  --font-display: "Bodoni Moda", ui-serif, Georgia, serif;
  --font-body: "Jost", ui-sans-serif, sans-serif;

  --text-*: initial;
  --text-xs: 0.75rem;
  --text-xs--line-height: 1.5;
  --text-sm: 0.8125rem;
  --text-sm--line-height: 1.6;
  --text-base: 0.9375rem;
  --text-base--line-height: 1.75;
  --text-lg: 1.5rem;
  --text-lg--line-height: 1.3;
  --text-xl: 2.4375rem;
  --text-xl--line-height: 1.1;
  --text-2xl: 3.9375rem;
  --text-2xl--line-height: 1;
  --text-display: 6.375rem;
  --text-display--line-height: 0.92;

  --tracking-caps: 0.24em;

  --radius-*: initial;
  --shadow-*: initial;

  --ease-slow: cubic-bezier(0.22, 0.61, 0.36, 1);
  --default-transition-duration: 400ms;
  --default-transition-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
}

@layer base {
  .dark {
    --color-bg: #0A0A0A;
    --color-surface: #121211;
    --color-ink: #E9E4D8;
    --color-muted: #8C877C;
    --color-line: #2A2826;
    --color-accent: #A88B5C;
    --color-accent-ink: #0A0A0A;
    --color-danger: #D98A7E;
  }
  body {
    background: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-body);
    font-weight: 300;
    font-size: var(--text-base);
    -webkit-font-smoothing: antialiased;
  }
}
```

---

### Task 15: Final verification

**Files:** none created; fixes only where problems are found.

- [ ] **Step 1: Run every automated check**

```bash
npx ng test --watch=false
```
Expected: all tests pass.

```bash
npm run test:scripts
```
Expected: all tests pass.

```bash
npm run check:systems
```
Expected: `All systems pass.` with six systems registered in `index.json` (order 01 to 06).

```bash
npx ng build
```
Expected: build succeeds without errors.

- [ ] **Step 2: Manual review at 375 px in the built-in browser**

For each of the six systems: open the catalog, open the system, view overview, tokens, components (switch through 375, 768, 1280 and light, dark), pages, rules, and use Copy for AI. Confirm: no horizontal page scroll, all tap targets at least 44 px, the copy bar never covers content, and the toast appears.

- [ ] **Step 3: Manual review at desktop width**

Confirm the two-column detail layout, the asymmetric catalog bento (featured tile spans 2x2), and the shell dark mode toggle.

- [ ] **Step 4: Prompt quality spot check**

Copy the Dark Luxury prompt, paste it into a scratch file outside the repo, and confirm it contains the ten sections in order, the full theme, every component snippet, and no em dash characters.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues from final verification"
```
Skip this step if nothing changed.
