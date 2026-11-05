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

  it('lists allowed exceptions only when the system declares some', () => {
    expect(md).not.toContain('## Allowed exceptions');
    const withGlass: SystemBundle = {
      ...bundle,
      manifest: { ...bundle.manifest, allowedOrnaments: [{ pattern: 'glass-pane', reason: 'overlay legibility' }] },
    };
    const out = buildPrompt(withGlass, '1. No gradients.\n');
    expect(out).toContain('## Allowed exceptions');
    expect(out).toContain('- `glass-pane`: overlay legibility');
    expect(out.indexOf('## Allowed exceptions')).toBeLessThan(out.indexOf('## Global anti-slop rules'));
  });

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
