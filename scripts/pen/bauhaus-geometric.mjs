// design/bauhaus-geometric.pen: system No. 12 for Pencil (pencil.dev). Built by scripts/pen/build-pen.mjs.
import { loadSystem, text, frame, ref, board, tokensBoard, stroke, writePen } from './lib.mjs';

export async function build() {
  const sys = await loadSystem('bauhaus-geometric');
  const C = {
    bg: '$color-bg', surface: '$color-surface', ink: '$color-ink', muted: '$color-muted', line: '$color-line', edge: '$color-edge',
    red: '$color-red', redInk: '$color-red-ink', blue: '$color-blue', blueInk: '$color-blue-ink', yellow: '$color-yellow', yellowInk: '$color-yellow-ink',
  };
  const RULE = 3;
  const caps = (id, content, o = {}) => text(id, content.toUpperCase(), { display: true, weight: 700, letterSpacing: 1.6, size: 12, ...o });
  const eyebrow = (id, content) => caps(id, content, { fill: C.muted, letterSpacing: 2.2 });
  const circle = (id, size, fill, o = {}) => ({ type: 'ellipse', id, name: 'Circle', width: size, height: size, fill, ...o });
  const square = (id, size, fill, o = {}) => ({ type: 'rectangle', id, name: 'Square', width: size, height: size, fill, ...o });
  const triangle = (id, w, h, fill, o = {}) => ({ type: 'path', id, name: 'Triangle', width: w, height: h, geometry: `M${w / 2} 0 L${w} ${h} L0 ${h} Z`, fill, ...o });

  // ---- reusable components ----
  const button = (id, label, fill, color) => frame(id, {
    name: label.name, reusable: true, layout: 'horizontal', alignItems: 'center', justifyContent: 'center',
    height: 48, padding: [0, 24], fill, stroke: stroke(C.edge, RULE),
  }, [caps(`${id}-label`, label.text, { size: 16, weight: 700, letterSpacing: 0.8, fill: color })]);

  const components = [
    button('btn-primary', { name: 'Button / Primary', text: 'Add to shelf' }, C.red, C.redInk),
    button('btn-secondary', { name: 'Button / Secondary', text: 'Save design' }, C.surface, C.ink),
    frame('badge-stock', {
      name: 'Badge / Stock', reusable: true, layout: 'horizontal', alignItems: 'center', gap: 8,
      height: 28, padding: [0, 10], fill: C.surface, stroke: stroke(C.edge, 2),
    }, [circle('badge-stock-shape', 10, C.blue), caps('badge-stock-label', 'In stock', { letterSpacing: 1.2 })]),
    frame('badge-info', {
      name: 'Badge / Info', reusable: true, layout: 'horizontal', alignItems: 'center', height: 28, padding: [0, 10], fill: C.blue,
    }, [caps('badge-info-label', 'Ships in 2 weeks', { fill: C.blueInk, letterSpacing: 1.2 })]),
    frame('section-number', {
      name: 'Section number', reusable: true, layout: 'horizontal', alignItems: 'center', padding: [0, 8], fill: C.yellow,
    }, [caps('section-number-label', '01', { size: 32, weight: 800, letterSpacing: 0, fill: C.yellowInk })]),
    frame('input', { name: 'Input / Dimension', reusable: true, layout: 'vertical', gap: 8, width: 360 }, [
      caps('input-label', 'Wall width', { letterSpacing: 1.7 }),
      frame('input-row', { name: 'Field', layout: 'horizontal', width: 'fill_container', height: 48 }, [
        frame('input-field', { name: 'Value', layout: 'horizontal', alignItems: 'center', width: 'fill_container', height: 48, padding: [0, 16], fill: C.surface, stroke: stroke(C.edge, 2) }, [
          text('input-value', '240', { size: 16 }),
        ]),
        frame('input-unit', { name: 'Unit', layout: 'horizontal', alignItems: 'center', height: 48, padding: [0, 16], fill: C.ink }, [
          caps('input-unit-label', 'cm', { size: 14, fill: C.bg, letterSpacing: 0 }),
        ]),
      ]),
      text('input-hint', 'Measure at skirting height. We fit modules in 40 cm steps.', { size: 12, fill: C.muted }),
    ]),
    frame('product-card', { name: 'Card / Product', reusable: true, layout: 'vertical', width: 320, fill: C.surface, stroke: stroke(C.edge, RULE) }, [
      frame('product-card-art', { name: 'Shape study', layout: 'none', width: 'fill_container', height: 314, fill: C.bg, clip: true, stroke: stroke(C.edge, { bottom: RULE }) }, [
        square('product-card-sq', 120, C.blue, { x: 38, y: 38 }),
        circle('product-card-ci', 120, C.yellow, { x: 162, y: 38 }),
        triangle('product-card-tr', 244, 120, C.red, { x: 38, y: 162 }),
      ]),
      frame('product-card-body', { name: 'Body', layout: 'vertical', gap: 10, padding: 20, width: 'fill_container' }, [
        eyebrow('product-card-kicker', 'Module 04'),
        caps('product-card-title', 'Drawer unit', { size: 23, weight: 800, letterSpacing: -0.3 }),
        text('product-card-copy', 'Two drawers on soft-close runners. Fits any 40 by 40 cm bay.', { size: 14, fill: C.muted, width: 'fill_container' }),
      ]),
      frame('product-card-foot', { name: 'Price and add', layout: 'horizontal', alignItems: 'center', width: 'fill_container', height: 56, stroke: stroke(C.edge, { top: RULE }) }, [
        frame('product-card-price-box', { name: 'Price', layout: 'horizontal', alignItems: 'center', width: 'fill_container', height: 56, padding: [0, 20] }, [
          caps('product-card-price', '149 EUR', { size: 32, weight: 800, letterSpacing: 0 }),
        ]),
        frame('product-card-add', { name: 'Add', layout: 'horizontal', alignItems: 'center', height: 56, padding: [0, 20], fill: C.red, stroke: stroke(C.edge, { left: RULE }) }, [
          caps('product-card-add-label', 'Add', { size: 14, fill: C.redInk }),
        ]),
      ]),
    ]),
    frame('navbar', { name: 'Navbar', reusable: true, layout: 'horizontal', width: 1280, height: 64, fill: C.surface, stroke: stroke(C.edge, { bottom: RULE }) }, [
      frame('navbar-brand', { name: 'Wordmark', layout: 'horizontal', alignItems: 'center', gap: 10, height: 64, padding: [0, 16], stroke: stroke(C.edge, { right: RULE }) }, [
        circle('navbar-brand-ci', 16, C.red), square('navbar-brand-sq', 16, C.blue), triangle('navbar-brand-tr', 16, 16, C.yellow, { stroke: stroke(C.ink, 1) }),
        caps('navbar-brand-name', 'Quadra', { size: 23, weight: 800, letterSpacing: -0.3 }),
      ]),
      ...['Shelves', 'Modules', 'Finishes', 'Studio'].map((l, i) => frame(`navbar-link-${i}`, {
        name: l, layout: 'horizontal', alignItems: 'center', height: 64, padding: [0, 20], stroke: stroke(C.edge, { right: RULE }), ...(i === 0 ? { fill: C.ink } : {}),
      }, [caps(`navbar-link-${i}-label`, l, { size: 14, fill: i === 0 ? C.bg : C.ink })])),
      frame('navbar-spacer', { name: 'Spacer', width: 'fill_container', height: 64 }),
      frame('navbar-cart', { name: 'Cart', layout: 'horizontal', alignItems: 'center', gap: 8, height: 64, padding: [0, 16], stroke: stroke(C.edge, { left: RULE }) }, [
        caps('navbar-cart-label', 'Cart', { size: 14 }),
        frame('navbar-cart-count', { name: 'Count', layout: 'horizontal', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, fill: C.red }, [
          caps('navbar-cart-count-label', '3', { size: 14, fill: C.redInk, letterSpacing: 0 }),
        ]),
      ]),
    ]),
    frame('toast', { name: 'Toast', reusable: true, layout: 'horizontal', alignItems: 'center', width: 420, height: 48, fill: C.ink }, [
      { type: 'rectangle', id: 'toast-marker', name: 'Marker', width: 12, height: 48, fill: C.yellow },
      frame('toast-body', { name: 'Message', layout: 'horizontal', alignItems: 'center', width: 'fill_container', height: 48, padding: [0, 16] }, [
        text('toast-message', 'Drawer unit removed from bay B3.', { size: 14, fill: C.bg }),
      ]),
      frame('toast-undo', { name: 'Undo', layout: 'horizontal', alignItems: 'center', height: 48, padding: [0, 20] }, [caps('toast-undo-label', 'Undo', { size: 14, fill: C.bg })]),
    ]),
  ];
  const byId = Object.fromEntries(components.map((c) => [c.id, c]));

  // ---- boards ----
  const tokens = tokensBoard(sys, {
    mode: 'light', eyebrow, titleWeight: 800,
    displaySample: 'ONE SQUARE', bodySample: 'Measure at skirting height. We fit modules in 40 cm steps.',
    sampleText: (size) => (size >= 24 ? { weight: 800 } : {}),
  });

  const componentsBoard = board('board-components', 'Bauhaus Geometric / Components', 1400, [
    eyebrow('cmp-buttons', 'Buttons'),
    frame('cmp-row-buttons', { name: 'Buttons', layout: 'horizontal', gap: 16, alignItems: 'center' }, [byId['btn-primary'], byId['btn-secondary']]),
    eyebrow('cmp-badges', 'Badges and section number'),
    frame('cmp-row-badges', { name: 'Badges', layout: 'horizontal', gap: 8, alignItems: 'center' }, [byId['badge-stock'], byId['badge-info'], byId['section-number']]),
    eyebrow('cmp-forms', 'Input'),
    byId.input,
    eyebrow('cmp-cards', 'Product card and toast'),
    frame('cmp-row-cards', { name: 'Card and toast', layout: 'horizontal', gap: 40, alignItems: 'end' }, [byId['product-card'], byId.toast]),
    eyebrow('cmp-nav', 'Navbar'),
    frame('cmp-nav-frame', { name: 'Navbar frame', layout: 'none', width: 1152, height: 64, clip: true }, [{ ...byId.navbar, x: 0, y: 0 }]),
  ], { mode: 'light', titleWeight: 800 });

  function landing(id, mode, x) {
    const p = (s) => `${id}-${s}`;
    const cell = 210;
    return frame(id, { name: `Landing / Hero, ${mode}`, x, y: 0, width: 1280, height: 548, layout: 'none', clip: true, fill: C.bg, theme: { mode } }, [
      ref(p('nav'), 'navbar', { x: 0, y: 0 }),
      frame(p('copy'), { name: 'Copy', x: 0, y: 64, width: 840, height: 484, layout: 'vertical', gap: 28, padding: [56, 48, 48, 32], stroke: stroke(C.edge, { right: RULE }) }, [
        eyebrow(p('eyebrow'), 'Modular shelving, made in Leipzig'),
        caps(p('title'), 'One square. Every shelf you will ever need.', { size: 72, weight: 800, letterSpacing: -1.5, lineHeight: 0.9, width: 760 }),
        text(p('lede'), 'Quadra is built from one 40 cm bay. Stack frames, fill the bays with doors, drawers, or nothing, and take it apart when you move.', { size: 18, lineHeight: 1.4, width: 520 }),
        frame(p('ctas'), { name: 'Actions', layout: 'horizontal', gap: 12 }, [
          ref(p('cta-1'), 'btn-primary', { descendants: { 'btn-primary-label': { content: 'DESIGN YOUR SHELF' } } }),
          ref(p('cta-2'), 'btn-secondary', { descendants: { 'btn-secondary-label': { content: 'SEE THE MODULES' } } }),
        ]),
      ]),
      frame(p('art'), { name: 'Shape composition', x: 840, y: 64, width: 440, height: 484, layout: 'none', clip: true }, [
        { type: 'rectangle', id: p('art-blue'), name: 'Blue field', x: 0, y: 0, width: cell, height: 242, fill: C.blue, stroke: stroke(C.edge, { right: RULE, bottom: RULE }) },
        circle(p('art-red'), 160, C.red, { x: cell + 35, y: 41 }),
        triangle(p('art-yellow'), 180, 200, C.yellow, { x: 15, y: 284 }),
        { type: 'rectangle', id: p('art-ink'), name: 'Ink block', x: cell + 115, y: 242, width: 115, height: 121, fill: C.ink },
        circle(p('art-blue-dot'), 60, C.blue, { x: cell + 142, y: 393 }),
        { type: 'rectangle', id: p('art-rule-h'), name: 'Rule', x: 0, y: 241, width: 440, height: RULE, fill: C.ink },
        { type: 'rectangle', id: p('art-rule-v'), name: 'Rule', x: cell, y: 0, width: RULE, height: 484, fill: C.ink },
      ]),
    ]);
  }

  const children = [tokens, componentsBoard, landing('landing-light', 'light', 2800), landing('landing-dark', 'dark', 4200)];
  return writePen(sys, children, components.length);
}
