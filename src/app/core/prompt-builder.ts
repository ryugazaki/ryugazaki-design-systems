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

/** Lists the system's declared exceptions to the global gradient and ornament rules; empty when it declares none. */
function exceptionsSection(m: SystemBundle['manifest']): string[] {
  const entries = [...m.allowedGradients, ...(m.allowedOrnaments ?? [])];
  if (entries.length === 0) return [];
  return [
    '## Allowed exceptions',
    '',
    'These utilities are the only exceptions to the gradient and ornament rules below. Use each only for its stated reason.',
    '',
    ...entries.map((e) => `- \`${e.pattern}\`: ${e.reason}`),
    '',
  ];
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
    ...exceptionsSection(m),
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
