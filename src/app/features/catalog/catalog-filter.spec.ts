import { CatalogEntry, Manifest } from '../../core/models';
import { collectTags, filterEntries, padNumber, tileSpan } from './catalog-filter';

const make = (slug: string, name: string, tagline: string, tags: string[]): CatalogEntry => ({
  slug,
  manifest: { slug, name, tagline, tags } as Manifest,
});

const entries: CatalogEntry[] = [
  make('neo-brutalist', 'Neo-Brutalist', 'Thick rules, hard shadows.', ['bold', 'light']),
  make('dark-luxury', 'Dark Luxury', 'Quiet, expensive, slow.', ['dark', 'premium']),
  { slug: 'broken', manifest: null },
];

describe('filterEntries', () => {
  it('returns everything with no query or tag', () => {
    expect(filterEntries(entries, '', null).length).toBe(3);
  });

  it('matches name, tagline, and tags case-insensitively', () => {
    expect(filterEntries(entries, 'BRUTAL', null).map((e) => e.slug)).toEqual(['neo-brutalist']);
    expect(filterEntries(entries, 'expensive', null).map((e) => e.slug)).toEqual(['dark-luxury']);
    expect(filterEntries(entries, 'premium', null).map((e) => e.slug)).toEqual(['dark-luxury']);
  });

  it('filters by tag and hides broken entries while filtering', () => {
    expect(filterEntries(entries, '', 'dark').map((e) => e.slug)).toEqual(['dark-luxury']);
  });
});

describe('helpers', () => {
  it('collects sorted unique tags', () => {
    expect(collectTags(entries)).toEqual(['bold', 'dark', 'light', 'premium']);
  });

  it('cycles asymmetric spans', () => {
    expect(tileSpan(0)).toBe('col-span-2 md:row-span-2');
    expect(tileSpan(6)).toBe(tileSpan(0));
  });

  it('pads entry numbers', () => {
    expect(padNumber(2)).toBe('02');
  });
});
