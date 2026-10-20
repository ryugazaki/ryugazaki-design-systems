export const SNIPPET_START = '<!-- snippet:start -->';
export const SNIPPET_END = '<!-- snippet:end -->';

export function extractSnippet(html: string): string | null {
  const start = html.indexOf(SNIPPET_START);
  const end = html.indexOf(SNIPPET_END);
  if (start === -1 || end === -1 || end < start) return null;
  return dedent(html.slice(start + SNIPPET_START.length, end));
}

export function dedent(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  const indents = lines.filter((l) => l.trim() !== '').map((l) => /^[ \t]*/.exec(l)![0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}
