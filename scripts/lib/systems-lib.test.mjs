import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  between, replaceBetween, lintFonts, lintGradients, lintPalette, lintCopy,
  lintOrnaments, lintTypeScale, checkAll, syncAll, validateManifest, MARKERS, TAILWIND_CDN,
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
  assert.equal(lintOrnaments('.pane { backdrop-filter: blur(8px); }').length, 1);
});

test('lintOrnaments respects the allowlist', () => {
  const allowed = [{ pattern: 'glass-pane', reason: 'overlay legibility' }];
  assert.equal(lintOrnaments('@utility glass-pane { backdrop-filter: blur(20px); }', allowed).length, 0);
  assert.equal(lintOrnaments('<div class="glass-pane">', allowed).length, 0);
  assert.equal(lintOrnaments('<div class="backdrop-blur-md">', allowed).length, 1);
});

test('validateManifest checks optional allowedOrnaments', () => {
  const m = validManifest();
  m.allowedOrnaments = [{ pattern: 'glass-pane' }];
  assert.deepEqual(validateManifest(m), ['allowedOrnaments[0] needs pattern, reason']);
  m.allowedOrnaments = 'glass-pane';
  assert.deepEqual(validateManifest(m), ['allowedOrnaments must be an array when present']);
});

test('lintTypeScale enforces ratio and display size', () => {
  assert.equal(lintTypeScale({ ratio: 1.414, steps: { base: '16px', display: '64px' } }).length, 0);
  assert.equal(lintTypeScale({ ratio: 1.2, steps: { base: '16px', display: '40px' } }).length, 2);
  assert.equal(lintTypeScale({ ratio: 1.5, steps: { display: '64px' } }).length, 1);
});

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Archivo&display=swap';
function validManifest() {
  return {
    slug: 'demo', number: 1, name: 'Demo', tagline: 'A demo.', description: 'Demo system.',
    tags: ['demo'], defaultMode: 'light', useCases: ['tests'],
    fonts: [{ family: 'Archivo', role: 'all', weights: [400], googleFontsUrl: FONT_URL }],
    typeScale: { ratio: 1.5, steps: { base: '16px', display: '64px' } },
    palette: [{ token: '--color-ink', light: '#111', dark: '#eee', role: 'text' }],
    allowedGradients: [], rules: { do: ['Be plain'], dont: ['Do not shout'] },
    components: [{ id: 'button', name: 'Button', file: 'components/button.html', notes: 'One button.' }],
    pages: [{ id: 'landing', name: 'Landing', file: 'pages/landing.html' }],
  };
}

test('validateManifest accepts a valid manifest', () => {
  assert.deepEqual(validateManifest(validManifest()), []);
});

test('validateManifest checks font entries', () => {
  const m = validManifest();
  m.fonts = [{ family: 'Archivo', role: 'all', weights: ['400'], googleFontsUrl: FONT_URL }, 'x'];
  assert.deepEqual(validateManifest(m), [
    'fonts[0] needs family, role, weights, googleFontsUrl',
    'fonts[1] needs family, role, weights, googleFontsUrl',
  ]);
});

test('validateManifest checks palette entries', () => {
  const m = validManifest();
  m.palette = [{ token: '--color-ink', light: '#111', role: 'text' }];
  assert.deepEqual(validateManifest(m), ['palette[0] needs token, light, dark, role']);
});

test('validateManifest checks allowedGradients entries', () => {
  const m = validManifest();
  m.allowedGradients = [{ pattern: 'mask-fade' }, null];
  assert.deepEqual(validateManifest(m), [
    'allowedGradients[0] needs pattern, reason',
    'allowedGradients[1] needs pattern, reason',
  ]);
});

test('validateManifest checks typeScale.steps values', () => {
  const m = validManifest();
  m.typeScale = { ratio: 1.5, steps: { base: 16, display: '64px' } };
  assert.deepEqual(validateManifest(m), ['typeScale.steps values must be strings']);
  m.typeScale = { ratio: 1.5, steps: ['16px'] };
  assert.deepEqual(validateManifest(m), ['typeScale.steps values must be strings']);
  m.typeScale = { ratio: 1.5, steps: { base: '' } };
  assert.deepEqual(validateManifest(m), ['typeScale.steps values must be strings']);
  m.typeScale = { ratio: 1.5, steps: null };
  assert.deepEqual(validateManifest(m), ['typeScale must have ratio and steps']);
});

test('validateManifest tolerates null component entries', () => {
  const m = validManifest();
  m.pages = [null];
  assert.deepEqual(validateManifest(m), ['pages[0] needs id, name, file']);
});

const shared = JSON.parse(readFileSync(new URL('./manifest-fixtures.json', import.meta.url), 'utf8'));

test('validateManifest matches the shared fixtures (parity with src/app/core/manifest.ts)', async (t) => {
  assert.deepEqual(validateManifest(shared.valid), []);
  for (const c of shared.cases) {
    await t.test(c.name, () => {
      const value = typeof c.patch === 'object' && c.patch !== null ? { ...shared.valid, ...c.patch } : c.patch;
      assert.deepEqual(validateManifest(value), c.expectedErrors);
    });
  }
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
