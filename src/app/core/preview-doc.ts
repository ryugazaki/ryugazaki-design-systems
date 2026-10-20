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
