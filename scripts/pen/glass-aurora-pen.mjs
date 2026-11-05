// Builds design/glass-aurora.pen, the Pencil (pencil.dev) source file for system No. 11.
// Colors come from the system's manifest.json, so the .pen variables never drift from theme.css.
// Run: npm run build:pen
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifest = JSON.parse(await readFile(path.join(root, 'public/systems/glass-aurora/manifest.json'), 'utf8'));
const outFile = path.join(root, 'design', 'glass-aurora.pen');

// ---- variables ----
const name = (token) => token.replace(/^--/, '');
const v = (token) => `$${name(token)}`;
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
Object.assign(variables, {
  'font-display': { type: 'string', value: 'Unbounded' },
  'font-body': { type: 'string', value: 'Manrope' },
  'radius-sm': { type: 'number', value: 10 },
  'radius-md': { type: 'number', value: 16 },
  'radius-lg': { type: 'number', value: 24 },
  'radius-full': { type: 'number', value: 999 },
});
for (const [step, size] of Object.entries(manifest.typeScale.steps)) {
  variables[`text-${step}`] = { type: 'number', value: parseFloat(size) };
}

// ---- node helpers ----
const C = {
  bg: v('--color-bg'), surface: v('--color-surface'), glass: v('--color-glass'), glassEdge: v('--color-glass-edge'),
  ink: v('--color-ink'), muted: v('--color-muted'), line: v('--color-line'), edge: v('--color-edge'),
  accent: v('--color-accent'), accentInk: v('--color-accent-ink'), danger: v('--color-danger'),
  auroraA: v('--color-aurora-a'), auroraB: v('--color-aurora-b'), auroraC: v('--color-aurora-c'),
};
const SHADOW = { type: 'shadow', shadowType: 'outer', color: '#03081499', offset: { x: 0, y: 18 }, blur: 40, spread: -24 };
const GLASS_BLUR = { type: 'background_blur', radius: 18 };

const text = (id, content, o = {}) => ({
  type: 'text', id, name: o.name ?? id, content,
  fontFamily: o.display ? '$font-display' : '$font-body',
  fontSize: o.size ?? 16,
  fontWeight: String(o.weight ?? (o.display ? 600 : 400)),
  fill: o.fill ?? C.ink,
  ...(o.lineHeight ? { lineHeight: o.lineHeight } : {}),
  ...(o.letterSpacing !== undefined ? { letterSpacing: o.letterSpacing } : {}),
  ...(o.width ? { width: o.width, textGrowth: 'fixed-width' } : {}),
});
const eyebrow = (id, content) => text(id, content.toUpperCase(), { size: 12, weight: 600, fill: C.muted, letterSpacing: 1.9 });
const frame = (id, o = {}, children = []) => ({ type: 'frame', id, name: o.name ?? id, ...o, children });
const ref = (id, component, o = {}) => ({ type: 'ref', id, ref: component, ...o });

// ---- reusable components ----
const pill = (id, label, fill, color, stroke) => frame(id, {
  name: label.name, reusable: true, layout: 'horizontal', alignItems: 'center', justifyContent: 'center',
  height: 48, padding: [0, 24], cornerRadius: '$radius-full',
  ...(fill ? { fill } : {}), ...(stroke ? { stroke: { align: 'inside', thickness: 1, fill: stroke } } : {}),
}, [text(`${id}-label`, label.text, { size: 16, weight: 700, fill: color })]);

const components = [
  pill('btn-primary', { name: 'Button / Primary', text: 'Book a night tour' }, C.accent, C.accentInk),
  pill('btn-secondary', { name: 'Button / Secondary', text: "See tonight's forecast" }, null, C.ink, C.edge),
  frame('badge-accent', {
    name: 'Badge / Forecast', reusable: true, layout: 'horizontal', alignItems: 'center', gap: 6,
    height: 28, padding: [0, 12], cornerRadius: '$radius-full', stroke: { align: 'inside', thickness: 1, fill: C.accent },
  }, [
    { type: 'ellipse', id: 'badge-accent-dot', name: 'Dot', width: 6, height: 6, fill: C.accent },
    text('badge-accent-label', 'Kp 5, strong', { size: 12, weight: 700, fill: C.accent }),
  ]),
  frame('badge-outline', {
    name: 'Badge / Outline', reusable: true, layout: 'horizontal', alignItems: 'center',
    height: 28, padding: [0, 12], cornerRadius: '$radius-full', stroke: { align: 'inside', thickness: 1, fill: C.edge },
  }, [text('badge-outline-label', 'Clear sky', { size: 12, weight: 600 })]),
  frame('badge-danger', {
    name: 'Badge / Danger', reusable: true, layout: 'horizontal', alignItems: 'center',
    height: 28, padding: [0, 12], cornerRadius: '$radius-full', stroke: { align: 'inside', thickness: 1, fill: C.danger },
  }, [text('badge-danger-label', 'Sold out', { size: 12, weight: 700, fill: C.danger })]),
  frame('input', { name: 'Input', reusable: true, layout: 'vertical', gap: 8, width: 360 }, [
    text('input-label', 'Pickup hotel', { size: 14, weight: 600 }),
    frame('input-field', {
      name: 'Field', layout: 'horizontal', alignItems: 'center', width: 'fill_container', height: 48, padding: [0, 16],
      cornerRadius: '$radius-sm', fill: C.surface, stroke: { align: 'inside', thickness: 1, fill: C.edge },
    }, [text('input-value', 'Clarion Hotel The Edge', { size: 16, fill: C.muted })]),
    text('input-hint', 'We collect from any hotel in central Tromsø.', { size: 12, fill: C.muted }),
  ]),
  frame('navbar', {
    name: 'Navbar (glass)', reusable: true, layout: 'horizontal', alignItems: 'center', gap: 32,
    width: 1152, height: 64, padding: [8, 8, 8, 20], cornerRadius: '$radius-full',
    fill: C.glass, stroke: { align: 'inside', thickness: 1, fill: C.glassEdge }, effect: [GLASS_BLUR, SHADOW],
  }, [
    text('navbar-wordmark', 'Polarlys', { display: true, size: 16 }),
    frame('navbar-links', { name: 'Links', layout: 'horizontal', alignItems: 'center', gap: 4 }, [
      frame('navbar-link-current', { name: 'Forecast (current)', layout: 'horizontal', alignItems: 'center', height: 44, padding: [0, 16], cornerRadius: '$radius-full', fill: C.surface }, [text('navbar-link-1', 'Forecast', { size: 14, weight: 600 })]),
      ...['Tours', 'How it works', 'Help'].map((l, i) => frame(`navbar-link-${i + 2}-box`, { name: l, layout: 'horizontal', alignItems: 'center', height: 44, padding: [0, 16] }, [text(`navbar-link-${i + 2}`, l, { size: 14, weight: 600, fill: C.muted })])),
    ]),
    frame('navbar-spacer', { name: 'Spacer', width: 'fill_container', height: 1 }),
    ref('navbar-cta', 'btn-secondary', { height: 44, descendants: { 'btn-secondary-label': { content: 'Book a tour' } } }),
  ]),
  frame('toast', {
    name: 'Toast (glass)', reusable: true, layout: 'horizontal', alignItems: 'center', gap: 12,
    width: 420, height: 60, padding: [8, 8, 8, 20], cornerRadius: '$radius-full',
    fill: C.glass, stroke: { align: 'inside', thickness: 1, fill: C.glassEdge }, effect: [GLASS_BLUR, SHADOW],
  }, [
    { type: 'ellipse', id: 'toast-dot', name: 'Dot', width: 8, height: 8, fill: C.accent },
    text('toast-message', 'Alert set for Kp 4 or higher.', { size: 14, width: 'fill_container' }),
    frame('toast-undo', { name: 'Undo', layout: 'horizontal', alignItems: 'center', height: 44, padding: [0, 16] }, [text('toast-undo-label', 'Undo', { size: 14, weight: 700 })]),
  ]),
];

// ---- boards ----
const swatch = (p) => frame(`sw-${name(p.token)}`, { name: p.token, layout: 'vertical', gap: 8, width: 160 }, [
  { type: 'rectangle', id: `sw-${name(p.token)}-chip`, name: 'Chip', width: 160, height: 72, cornerRadius: '$radius-sm', fill: v(p.token), stroke: { align: 'inside', thickness: 1, fill: C.line } },
  text(`sw-${name(p.token)}-name`, p.token, { size: 12, weight: 700 }),
  text(`sw-${name(p.token)}-hex`, `${p.dark} / ${p.light}`, { size: 12, fill: C.muted }),
]);
const rows = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

const board = (id, title, x, children, theme = 'dark') => frame(id, {
  name: title, x, y: 0, width: 1280, layout: 'vertical', gap: 40, padding: 64, fill: C.bg, theme: { mode: theme },
}, [text(`${id}-title`, title, { display: true, size: 36, letterSpacing: -0.5 }), ...children]);

const tokensBoard = board('board-tokens', 'Glass Aurora / Tokens', 0, [
  eyebrow('tok-colors', 'Color, dark / light'),
  ...rows(manifest.palette, 6).map((r, i) => frame(`tok-row-${i}`, { name: `Row ${i + 1}`, layout: 'horizontal', gap: 24 }, r.map(swatch))),
  eyebrow('tok-type', `Type scale, ratio ${manifest.typeScale.ratio}`),
  frame('tok-type-list', { name: 'Type scale', layout: 'vertical', gap: 16 }, Object.entries(manifest.typeScale.steps).reverse().map(([step, size]) =>
    frame(`tok-type-${step}`, { name: step, layout: 'horizontal', alignItems: 'end', gap: 24 }, [
      text(`tok-type-${step}-label`, `${step} ${size}`, { size: 12, fill: C.muted, width: 96 }),
      text(`tok-type-${step}-sample`, parseFloat(size) >= 24 ? 'Kp 4.7 tonight' : 'Pickup 20 minutes before departure.', { display: parseFloat(size) >= 24, size: parseFloat(size) }),
    ]))),
  eyebrow('tok-radius', 'Radius'),
  frame('tok-radius-row', { name: 'Radius', layout: 'horizontal', gap: 24 }, [['sm', 10], ['md', 16], ['lg', 24], ['full', 999]].map(([k]) =>
    frame(`tok-radius-${k}`, { name: k, layout: 'vertical', gap: 8 }, [
      { type: 'rectangle', id: `tok-radius-${k}-box`, name: 'Box', width: 96, height: 64, cornerRadius: `$radius-${k}`, fill: C.surface, stroke: { align: 'inside', thickness: 1, fill: C.edge } },
      text(`tok-radius-${k}-label`, `radius-${k}`, { size: 12, fill: C.muted }),
    ]))),
]);

const componentsBoard = board('board-components', 'Glass Aurora / Components', 1400, [
  eyebrow('cmp-buttons', 'Buttons'),
  frame('cmp-row-buttons', { name: 'Buttons', layout: 'horizontal', gap: 16, alignItems: 'center' }, components.slice(0, 2)),
  eyebrow('cmp-badges', 'Badges'),
  frame('cmp-row-badges', { name: 'Badges', layout: 'horizontal', gap: 8, alignItems: 'center' }, components.slice(2, 5)),
  eyebrow('cmp-inputs', 'Input'),
  components[5],
  eyebrow('cmp-glass', 'Glass layers, shown over an aurora field'),
  frame('cmp-glass-field', { name: 'Aurora field', layout: 'none', width: 1152, height: 260, clip: true, cornerRadius: '$radius-lg', fill: C.bg }, [
    ...aurora('cmp', 1152),
    { ...components[6], x: 0, y: 32 },
    { ...components[7], x: 32, y: 160 },
  ]),
]);

function aurora(prefix, width) {
  const blob = (id, fill, x, y, w, h) => ({ type: 'ellipse', id: `${prefix}-aurora-${id}`, name: `Aurora ${id}`, x, y, width: w, height: h, fill, opacity: 0.5, effect: { type: 'blur', radius: 120 } });
  return [
    blob('a', C.auroraA, -0.1 * width, -260, 0.7 * width, 520),
    blob('b', C.auroraB, 0.35 * width, -300, 0.5 * width, 480),
    blob('c', C.auroraC, 0.75 * width, -220, 0.4 * width, 400),
  ];
}

function landing(id, mode, x) {
  const p = (s) => `${id}-${s}`;
  return frame(id, {
    name: `Landing / Hero, ${mode}`, x, y: 0, width: 1280, height: 900, layout: 'none', clip: true, fill: C.bg, theme: { mode },
  }, [
    ...aurora(id, 1280),
    ref(p('nav'), 'navbar', { x: 64, y: 20 }),
    frame(p('hero'), {
      name: 'Hero (glass)', x: 64, y: 168, width: 1152, layout: 'vertical', gap: 32, padding: 40, cornerRadius: '$radius-lg',
      fill: C.glass, stroke: { align: 'inside', thickness: 1, fill: C.glassEdge }, effect: [GLASS_BLUR, SHADOW],
    }, [
      eyebrow(p('eyebrow'), 'Aurora tours from Tromsø, September to March'),
      text(p('title'), 'We only drive out when the sky says yes.', { display: true, size: 80, lineHeight: 0.98, letterSpacing: -2, width: 920 }),
      frame(p('row'), { name: 'Body and forecast', layout: 'horizontal', gap: 48, width: 'fill_container' }, [
        frame(p('copy'), { name: 'Copy', layout: 'vertical', gap: 24, width: 'fill_container' }, [
          text(p('lede'), 'Polarlys reads the Kp index, the solar wind, and the cloud map every 15 minutes. At 17:00 we decide where tonight’s buses go, or we cancel and refund you in full.', { size: 24, lineHeight: 1.3, fill: C.muted, width: 'fill_container' }),
          frame(p('ctas'), { name: 'Actions', layout: 'horizontal', gap: 12 }, [
            ref(p('cta-1'), 'btn-primary', { descendants: { 'btn-primary-label': { content: 'Book tonight’s tour' } } }),
            ref(p('cta-2'), 'btn-secondary', { descendants: { 'btn-secondary-label': { content: 'Read the forecast' } } }),
          ]),
        ]),
        frame(p('forecast'), { name: 'Forecast', layout: 'vertical', gap: 16, width: 400, padding: [0, 0, 0, 48], stroke: { align: 'inside', thickness: { left: 1 }, fill: C.line } }, [
          frame(p('forecast-head'), { name: 'Head', layout: 'horizontal', alignItems: 'center', gap: 16 }, [
            eyebrow(p('forecast-date'), 'Tonight, 5 November'),
            ref(p('forecast-badge'), 'badge-accent', { descendants: { 'badge-accent-label': { content: 'Good chance' } } }),
          ]),
          frame(p('forecast-kp'), { name: 'Kp', layout: 'horizontal', alignItems: 'end', gap: 12 }, [
            text(p('kp'), '4.7', { display: true, size: 54, lineHeight: 1 }),
            text(p('kp-label'), 'peak Kp at 23:00', { size: 14, fill: C.muted }),
          ]),
          frame(p('forecast-stats'), { name: 'Stats', layout: 'horizontal', gap: 40 }, [['Chance', '72%'], ['Cloud', '18%'], ['Best window', '22:10']].map(([k, val], i) =>
            frame(p(`stat-${i}`), { name: k, layout: 'vertical', gap: 4 }, [
              text(p(`stat-${i}-k`), k, { size: 12, fill: C.muted }),
              text(p(`stat-${i}-v`), val, { size: 16, weight: 700 }),
            ]))),
        ]),
      ]),
    ]),
    ref(p('toast'), 'toast', { x: 64, y: 812 }),
  ]);
}

const doc = {
  version: '2.9',
  themes: { mode: ['dark', 'light'] },
  variables,
  children: [tokensBoard, componentsBoard, landing('landing-dark', 'dark', 2800), landing('landing-light', 'light', 4200)],
};

// ---- structural check: unique ids, refs and descendants resolve, every $variable exists ----
function check(document) {
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
  for (const [, ref] of json.matchAll(/"\$([a-z0-9-]+)"/g)) if (!(ref in document.variables)) errors.push(`unknown variable $${ref}`);
  for (const [key, def] of Object.entries(document.variables)) {
    for (const entry of Array.isArray(def.value) ? def.value : []) {
      const [axis, value] = Object.entries(entry.theme ?? {})[0] ?? [];
      if (axis && !document.themes[axis]?.includes(value)) errors.push(`${key} uses unknown theme ${axis}:${value}`);
    }
  }
  return errors;
}

const errors = check(doc);
if (errors.length) {
  console.error(errors.map((e) => `x ${e}`).join('\n'));
  process.exit(1);
}
await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(doc, null, 2) + '\n');
console.log(`Wrote ${path.relative(root, outFile)}: ${Object.keys(variables).length} variables, ${components.length} components.`);
