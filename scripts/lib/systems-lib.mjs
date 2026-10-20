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
const isRecord = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Pushes `${key}[i] needs ${fields}` for every entry that is not an object or fails `ok`. No-op when list is not an array. */
function checkEntries(list, key, errors, fields, ok) {
  if (!Array.isArray(list)) return;
  list.forEach((entry, i) => {
    if (!isRecord(entry) || !ok(entry)) errors.push(`${key}[${i}] needs ${fields}`);
  });
}

export function validateManifest(m) {
  if (typeof m !== 'object' || m === null) return ['manifest is not an object'];
  const errors = [];
  for (const key of ['slug', 'name', 'tagline', 'description']) if (!isText(m[key])) errors.push(`${key} must be a non-empty string`);
  if (typeof m.number !== 'number') errors.push('number must be a number');
  for (const key of ['tags', 'useCases']) if (!isTextList(m[key])) errors.push(`${key} must be a string array`);
  if (m.defaultMode !== 'light' && m.defaultMode !== 'dark') errors.push('defaultMode must be "light" or "dark"');
  for (const key of ['fonts', 'palette']) if (!Array.isArray(m[key]) || m[key].length === 0) errors.push(`${key} must be a non-empty array`);
  checkEntries(m.fonts, 'fonts', errors, 'family, role, weights, googleFontsUrl', (f) =>
    isText(f.family) && isText(f.role) && isText(f.googleFontsUrl) &&
    Array.isArray(f.weights) && f.weights.every((w) => typeof w === 'number'),
  );
  checkEntries(m.palette, 'palette', errors, 'token, light, dark, role', (p) =>
    isText(p.token) && isText(p.light) && isText(p.dark) && isText(p.role),
  );
  if (!Array.isArray(m.allowedGradients)) errors.push('allowedGradients must be an array');
  checkEntries(m.allowedGradients, 'allowedGradients', errors, 'pattern, reason', (g) => isText(g.pattern) && isText(g.reason));
  const scale = m.typeScale;
  if (!scale || typeof scale.ratio !== 'number' || typeof scale.steps !== 'object' || scale.steps === null) {
    errors.push('typeScale must have ratio and steps');
  } else if (Array.isArray(scale.steps) || !Object.values(scale.steps).every(isText)) {
    errors.push('typeScale.steps values must be strings');
  }
  if (!m.rules || !isTextList(m.rules.do) || !isTextList(m.rules.dont)) errors.push('rules must have do and dont string arrays');
  for (const key of ['components', 'pages']) {
    if (!Array.isArray(m[key])) { errors.push(`${key} must be an array`); continue; }
    m[key].forEach((raw, i) => {
      const item = raw ?? {};
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
