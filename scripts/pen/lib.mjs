// Shared helpers for the Pencil (pencil.dev) source files in design/.
// Each system module builds its components and screens with these; tokens always come from the
// system's manifest.json and theme.css, so a .pen file never drifts from the archive.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PEN_VERSION = '2.9';

/** Reads a system's manifest and theme, and returns the .pen variables plus `$name` references. */
export async function loadSystem(slug) {
  const dir = path.join(ROOT, 'public', 'systems', slug);
  const manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8'));
  const theme = await readFile(path.join(dir, 'theme.css'), 'utf8');

  const name = (token) => token.replace(/^--/, '');
  const variables = {};
  for (const p of manifest.palette) {
    variables[name(p.token)] = {
      type: 'color',
      value: [
        { value: p.dark, theme: { mode: 'dark' } },
        { value: p.light, theme: { mode: 'light' } },
      ],
    };
  }
  const [display, body] = manifest.fonts;
  variables['font-display'] = { type: 'string', value: display.family };
  variables['font-body'] = { type: 'string', value: (body ?? display).family };

  const radii = {};
  for (const [, key, amount, unit] of theme.matchAll(/--radius-([a-z0-9]+):\s*([0-9.]+)(rem|px)/g)) {
    const px = unit === 'rem' ? parseFloat(amount) * 16 : parseFloat(amount);
    radii[key] = Math.min(px, 999);
    variables[`radius-${key}`] = { type: 'number', value: radii[key] };
  }
  for (const [step, size] of Object.entries(manifest.typeScale.steps)) {
    variables[`text-${step}`] = { type: 'number', value: parseFloat(size) };
  }

  const color = (token) => `$${name(token)}`;
  return { slug, manifest, variables, radii, color, name };
}

// ---- node helpers ----
export const text = (id, content, o = {}) => ({
  type: 'text', id, name: o.name ?? id, content,
  fontFamily: o.display ? '$font-display' : '$font-body',
  fontSize: o.size ?? 16,
  fontWeight: String(o.weight ?? (o.display ? 600 : 400)),
  fill: o.fill ?? '$color-ink',
  ...(o.lineHeight ? { lineHeight: o.lineHeight } : {}),
  ...(o.letterSpacing !== undefined ? { letterSpacing: o.letterSpacing } : {}),
  ...(o.width ? { width: o.width, textGrowth: 'fixed-width' } : {}),
});
export const frame = (id, o = {}, children = []) => ({ type: 'frame', id, name: o.name ?? id, ...o, children });
export const ref = (id, component, o = {}) => ({ type: 'ref', id, ref: component, ...o });
export const stroke = (fill, thickness = 1) => ({ align: 'inside', thickness, fill });
export const rows = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

/** A 1280-wide board with a title, on the system's background, in one theme mode. */
export function board(id, title, x, children, o = {}) {
  return frame(id, {
    name: title, x, y: 0, width: 1280, layout: 'vertical', gap: 40, padding: 64,
    fill: '$color-bg', theme: { mode: o.mode ?? 'light' },
  }, [text(`${id}-title`, title, { display: true, size: 36, weight: o.titleWeight, letterSpacing: o.titleSpacing ?? -0.5 }), ...children]);
}

/** The tokens board every system gets: color swatches, type scale, radius. */
export function tokensBoard(sys, o = {}) {
  const { manifest, name, color, radii } = sys;
  const eyebrow = o.eyebrow;
  const chipRadius = o.chipRadius;
  const swatch = (p) => frame(`sw-${name(p.token)}`, { name: p.token, layout: 'vertical', gap: 8, width: 160 }, [
    { type: 'rectangle', id: `sw-${name(p.token)}-chip`, name: 'Chip', width: 160, height: 72, ...(chipRadius ? { cornerRadius: chipRadius } : {}), fill: color(p.token), stroke: stroke('$color-line') },
    text(`sw-${name(p.token)}-name`, p.token, { size: 12, weight: 700 }),
    text(`sw-${name(p.token)}-hex`, `${p.dark} / ${p.light}`, { size: 12, fill: '$color-muted' }),
  ]);
  const radiusKeys = Object.keys(radii);
  return board('board-tokens', `${manifest.name} / Tokens`, 0, [
    eyebrow('tok-colors', 'Color, dark / light'),
    ...rows(manifest.palette, 6).map((r, i) => frame(`tok-row-${i}`, { name: `Row ${i + 1}`, layout: 'horizontal', gap: 24 }, r.map(swatch))),
    eyebrow('tok-type', `Type scale, ratio ${manifest.typeScale.ratio}`),
    frame('tok-type-list', { name: 'Type scale', layout: 'vertical', gap: 16 }, Object.entries(manifest.typeScale.steps).reverse().map(([step, size]) =>
      frame(`tok-type-${step}`, { name: step, layout: 'horizontal', alignItems: 'end', gap: 24 }, [
        text(`tok-type-${step}-label`, `${step} ${size}`, { size: 12, fill: '$color-muted', width: 96 }),
        text(`tok-type-${step}-sample`, parseFloat(size) >= 24 ? o.displaySample : o.bodySample, { display: parseFloat(size) >= 24, size: parseFloat(size), ...(o.sampleText?.(parseFloat(size)) ?? {}) }),
      ]))),
    ...(radiusKeys.length ? [
      eyebrow('tok-radius', 'Radius'),
      frame('tok-radius-row', { name: 'Radius', layout: 'horizontal', gap: 24 }, radiusKeys.map((k) =>
        frame(`tok-radius-${k}`, { name: k, layout: 'vertical', gap: 8 }, [
          { type: 'rectangle', id: `tok-radius-${k}-box`, name: 'Box', width: 96, height: radii[k] >= 999 ? 96 : 64, cornerRadius: `$radius-${k}`, fill: '$color-surface', stroke: stroke('$color-edge') },
          text(`tok-radius-${k}-label`, `radius-${k}`, { size: 12, fill: '$color-muted' }),
        ]))),
    ] : []),
  ], { mode: o.mode, titleWeight: o.titleWeight });
}

/** Unique ids, refs and overrides that resolve, every $variable defined, every theme value known. */
export function check(document) {
  const errors = [];
  const ids = new Map();
  const walk = (nodes, fn) => nodes.forEach((n) => { fn(n); if (n.children) walk(n.children, fn); });
  walk(document.children, (n) => {
    if (!n.id || !n.type) errors.push(`node without id or type: ${JSON.stringify(n).slice(0, 60)}`);
    if (ids.has(n.id)) errors.push(`duplicate id ${n.id}`);
    ids.set(n.id, n);
  });
  walk(document.children, (n) => {
    if (n.type !== 'ref') return;
    const target = ids.get(n.ref);
    if (!target?.reusable) errors.push(`${n.id} refs ${n.ref}, which is not a reusable node`);
    const inside = new Set();
    if (target) walk([target], (c) => inside.add(c.id));
    for (const key of Object.keys(n.descendants ?? {})) if (!inside.has(key)) errors.push(`${n.id} overrides ${key}, which is not inside ${n.ref}`);
  });
  const json = JSON.stringify(document.children);
  for (const [, name] of json.matchAll(/"\$([a-z0-9-]+)"/g)) if (!(name in document.variables)) errors.push(`unknown variable $${name}`);
  for (const [key, def] of Object.entries(document.variables)) {
    for (const entry of Array.isArray(def.value) ? def.value : []) {
      const [axis, value] = Object.entries(entry.theme ?? {})[0] ?? [];
      if (axis && !document.themes[axis]?.includes(value)) errors.push(`${key} uses unknown theme ${axis}:${value}`);
    }
  }
  return errors;
}

/** Checks and writes design/<slug>.pen. Throws with every problem when the check fails. */
export async function writePen(sys, children, componentCount) {
  const doc = { version: PEN_VERSION, themes: { mode: ['dark', 'light'] }, variables: sys.variables, children };
  const errors = check(doc);
  if (errors.length) throw new Error(`${sys.slug}.pen:\n${errors.map((e) => `x ${e}`).join('\n')}`);
  const file = path.join(ROOT, 'design', `${sys.slug}.pen`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(doc, null, 2) + '\n');
  return `${path.relative(ROOT, file)}: ${Object.keys(doc.variables).length} variables, ${componentCount} components`;
}
