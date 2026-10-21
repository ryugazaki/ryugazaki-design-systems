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
    expect(doc).toContain('document.body.scrollHeight');
    expect(doc).toContain('addEventListener("toggle",send,true)');
    expect(doc).toContain('<html lang="en">');
  });

  it('adds the dark class and drops padding when asked', () => {
    const doc = buildPreviewDoc('<main></main>', { theme: '', fonts: [], mode: 'dark', padded: false });
    expect(doc).toContain('<html lang="en" class="dark">');
    expect(doc).toContain('<body>\n<main></main>');
  });
});
