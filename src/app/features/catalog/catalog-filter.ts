import { CatalogEntry } from '../../core/models';

export function filterEntries(entries: CatalogEntry[], query: string, tag: string | null): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  return entries.filter((entry) => {
    const m = entry.manifest;
    if (!m) return q === '' && tag === null;
    if (tag && !m.tags.includes(tag)) return false;
    if (!q) return true;
    return [m.name, m.tagline, ...m.tags].some((text) => text.toLowerCase().includes(q));
  });
}

export function collectTags(entries: CatalogEntry[]): string[] {
  return [...new Set(entries.flatMap((e) => e.manifest?.tags ?? []))].sort();
}

/** Asymmetric bento: 2 columns on mobile, 4 from md. Six positions, then repeat. */
const SPANS = [
  'col-span-2 md:row-span-2',
  'col-span-2',
  'col-span-1',
  'col-span-1',
  'col-span-2 md:col-span-1',
  'col-span-2 md:col-span-3',
];

export function tileSpan(index: number): string {
  return SPANS[index % SPANS.length];
}

export function padNumber(n: number): string {
  return String(n).padStart(2, '0');
}
