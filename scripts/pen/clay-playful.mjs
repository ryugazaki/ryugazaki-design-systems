// design/clay-playful.pen: system No. 13 for Pencil (pencil.dev). Built by scripts/pen/build-pen.mjs.
import { loadSystem, text, frame, ref, board, tokensBoard, stroke, writePen } from './lib.mjs';

export async function build() {
  const sys = await loadSystem('clay-playful');
  const C = {
    bg: '$color-bg', surface: '$color-surface', ink: '$color-ink', muted: '$color-muted', line: '$color-line', edge: '$color-edge',
    accent: '$color-accent', accentText: '$color-accent-text', mint: '$color-mint', sky: '$color-sky', butter: '$color-butter',
    onClay: '$color-on-clay', tint: '$color-clay-tint',
  };
  // The clay shadow from theme.css: a pressed bottom edge, a top highlight, and a short drop.
  const CLAY = [
    { type: 'shadow', shadowType: 'inner', color: '#2B223326', offset: { x: 0, y: -6 }, blur: 0, spread: 0 },
    { type: 'shadow', shadowType: 'inner', color: '#FFFFFF8C', offset: { x: 0, y: 4 }, blur: 6, spread: 0 },
    { type: 'shadow', shadowType: 'outer', color: '#2B223326', offset: { x: 0, y: 10 }, blur: 18, spread: -10 },
  ];
  const display = (id, content, o = {}) => text(id, content, { display: true, weight: 600, ...o });
  const label = (id, content, o = {}) => text(id, content, { size: 15, weight: 700, ...o });

  // ---- reusable components ----
  const pillButton = (id, name, content, fill, color) => frame(id, {
    name, reusable: true, layout: 'horizontal', alignItems: 'center', justifyContent: 'center',
    height: 56, padding: [0, 28], cornerRadius: '$radius-full', fill, effect: CLAY,
  }, [display(`${id}-label`, content, { size: 18, fill: color })]);
  const tag = (id, name, content, fill) => frame(id, {
    name, reusable: true, layout: 'horizontal', alignItems: 'center', height: 32, padding: [0, 12], cornerRadius: '$radius-full', fill,
  }, [label(`${id}-label`, content, { fill: C.onClay })]);

  const fox = (p) => frame(`${p}-fox`, { name: 'Fox in a box', layout: 'none', width: 200, height: 140 }, [
    { type: 'path', id: `${p}-fox-ear-l`, name: 'Ear', x: 76, y: 14, width: 16, height: 22, geometry: 'M0 22 L2 0 L16 14 Z', fill: C.accent, stroke: stroke(C.onClay, 4) },
    { type: 'path', id: `${p}-fox-ear-r`, name: 'Ear', x: 108, y: 14, width: 16, height: 22, geometry: 'M16 22 L14 0 L0 14 Z', fill: C.accent, stroke: stroke(C.onClay, 4) },
    { type: 'ellipse', id: `${p}-fox-head`, name: 'Head', x: 76, y: 22, width: 48, height: 60, fill: C.accent, stroke: stroke(C.onClay, 4) },
    { type: 'ellipse', id: `${p}-fox-eye-l`, name: 'Eye', x: 88, y: 41, width: 7, height: 7, fill: C.onClay },
    { type: 'ellipse', id: `${p}-fox-eye-r`, name: 'Eye', x: 105, y: 41, width: 7, height: 7, fill: C.onClay },
    { type: 'rectangle', id: `${p}-fox-box`, name: 'Box', x: 58, y: 62, width: 84, height: 62, cornerRadius: 10, fill: C.butter, stroke: stroke(C.onClay, 4) },
  ]);

  const components = [
    pillButton('btn-primary', 'Button / Primary', 'Start reading', C.accent, C.onClay),
    pillButton('btn-secondary', 'Button / Secondary', 'Hear it again', C.surface, C.ink),
    frame('answer-tile', {
      name: 'Answer tile', reusable: true, layout: 'horizontal', alignItems: 'center', justifyContent: 'center',
      width: 120, height: 80, cornerRadius: '$radius-lg', fill: C.sky, effect: CLAY,
    }, [display('answer-tile-label', 'ship', { size: 24, fill: C.onClay })]),
    tag('tag-phonics', 'Tag / Phonics', 'Phonics', C.mint),
    tag('tag-story', 'Tag / Story time', 'Story time', C.sky),
    frame('star-count', {
      name: 'Star count', reusable: true, layout: 'horizontal', alignItems: 'center', gap: 6, height: 32, padding: [0, 12], cornerRadius: '$radius-full', fill: C.butter,
    }, [
      { type: 'path', id: 'star-count-icon', name: 'Star', width: 16, height: 16, geometry: 'M8 0 L10 5.5 L16 6 L11.5 9.8 L13 16 L8 12.6 L3 16 L4.5 9.8 L0 6 L6 5.5 Z', fill: C.onClay },
      label('star-count-label', '12 stars', { fill: C.onClay }),
    ]),
    frame('lesson-card', {
      name: 'Card / Lesson', reusable: true, layout: 'vertical', gap: 16, width: 360, padding: 20, cornerRadius: '$radius-xl', fill: C.sky, effect: CLAY,
    }, [
      frame('lesson-card-head', { name: 'Head', layout: 'horizontal', alignItems: 'center', gap: 8, width: 'fill_container' }, [
        frame('lesson-card-tag', { name: 'Tag', layout: 'horizontal', alignItems: 'center', height: 32, padding: [0, 12], cornerRadius: '$radius-full', fill: C.tint }, [label('lesson-card-tag-label', 'Story time', { fill: C.onClay })]),
        frame('lesson-card-spacer', { name: 'Spacer', width: 'fill_container', height: 1 }),
        frame('lesson-card-stars', { name: 'Stars', layout: 'horizontal', alignItems: 'center', height: 32, padding: [0, 12], cornerRadius: '$radius-full', fill: C.butter }, [label('lesson-card-stars-label', '3 stars', { fill: C.onClay })]),
      ]),
      frame('lesson-card-art', { name: 'Picture', layout: 'horizontal', justifyContent: 'center', width: 'fill_container', padding: [16, 24, 8, 24], cornerRadius: '$radius-lg', fill: C.tint }, [fox('lesson-card')]),
      display('lesson-card-title', 'The fox in the box', { size: 34, fill: C.onClay }),
      text('lesson-card-copy', 'Short o words: fox, box, hop, top. 8 pages, about 6 minutes.', { size: 17, fill: C.onClay, width: 'fill_container' }),
      ref('lesson-card-cta', 'btn-primary', { width: 'fill_container' }),
    ]),
    frame('toast', {
      name: 'Toast', reusable: true, layout: 'horizontal', alignItems: 'center', gap: 12, height: 56, padding: [8, 8, 8, 20], cornerRadius: '$radius-full', fill: C.mint, effect: CLAY,
    }, [
      display('toast-message', 'Great reading!', { size: 18, fill: C.onClay }),
      frame('toast-star', { name: 'Star earned', layout: 'horizontal', alignItems: 'center', height: 36, padding: [0, 12], cornerRadius: '$radius-full', fill: C.butter }, [label('toast-star-label', '+1 star', { fill: C.onClay })]),
    ]),
    frame('navbar', {
      name: 'Navbar', reusable: true, layout: 'horizontal', alignItems: 'center', gap: 24, width: 1152, height: 64, padding: [0, 16], cornerRadius: '$radius-lg', fill: C.surface,
    }, [
      frame('navbar-brand', { name: 'Wordmark', layout: 'horizontal', alignItems: 'center', gap: 8 }, [
        { type: 'ellipse', id: 'navbar-pebble', name: 'Pebble', width: 32, height: 30, fill: C.accent, effect: CLAY },
        display('navbar-name', 'Pebble Reads', { size: 24 }),
      ]),
      ...['How it works', 'Reports', 'Price'].map((l, i) => display(`navbar-link-${i}`, l, { size: 17, fill: C.muted })),
      frame('navbar-spacer', { name: 'Spacer', width: 'fill_container', height: 1 }),
      ref('navbar-cta', 'btn-secondary', { height: 44, descendants: { 'btn-secondary-label': { content: 'Try it free' } } }),
    ]),
  ];
  const byId = Object.fromEntries(components.map((c) => [c.id, c]));

  // ---- boards ----
  const tokens = tokensBoard(sys, {
    mode: 'light', eyebrow: (id, content) => label(id, content, { fill: C.muted }), chipRadius: '$radius-md',
    displaySample: 'The fox in the box', bodySample: 'Tap any word to hear it.',
  });

  const componentsBoard = board('board-components', 'Clay Playful / Components', 1400, [
    label('cmp-buttons', 'Buttons and answer tile', { fill: C.muted }),
    frame('cmp-row-buttons', { name: 'Buttons', layout: 'horizontal', gap: 20, alignItems: 'center' }, [byId['btn-primary'], byId['btn-secondary'], byId['answer-tile']]),
    label('cmp-badges', 'Tags and star count', { fill: C.muted }),
    frame('cmp-row-badges', { name: 'Tags', layout: 'horizontal', gap: 8, alignItems: 'center' }, [byId['tag-phonics'], byId['tag-story'], byId['star-count']]),
    label('cmp-cards', 'Lesson card and toast', { fill: C.muted }),
    frame('cmp-row-cards', { name: 'Card and toast', layout: 'horizontal', gap: 40, alignItems: 'start' }, [byId['lesson-card'], byId.toast]),
    label('cmp-nav', 'Navbar', { fill: C.muted }),
    byId.navbar,
  ], { mode: 'light' });

  function landing(id, mode, x) {
    const p = (s) => `${id}-${s}`;
    return frame(id, { name: `Landing / Hero, ${mode}`, x, y: 0, width: 1280, height: 760, layout: 'none', fill: C.bg, theme: { mode } }, [
      ref(p('nav'), 'navbar', { x: 64, y: 20 }),
      frame(p('copy'), { name: 'Copy', x: 64, y: 150, width: 660, layout: 'vertical', gap: 28 }, [
        ref(p('tag'), 'tag-phonics', { descendants: { 'tag-phonics-label': { content: 'For readers aged 4 to 8' } } }),
        display(p('title'), 'Ten minutes a day, and the words start to stick.', { size: 68, lineHeight: 0.98, width: 640 }),
        text(p('lede'), 'Pebble Reads turns phonics into short stories your child can tap, hear, and read back. Each lesson ends with one small question and one sticker.', { size: 20, lineHeight: 1.4, fill: C.muted, width: 520 }),
        ref(p('cta'), 'btn-primary', { descendants: { 'btn-primary-label': { content: 'Start 14 free days' } } }),
      ]),
      ref(p('card'), 'lesson-card', { x: 820, y: 150, rotation: -2 }),
    ]);
  }

  const children = [tokens, componentsBoard, landing('landing-light', 'light', 2800), landing('landing-dark', 'dark', 4200)];
  return writePen(sys, children, components.length);
}
