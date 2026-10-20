import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Catalog } from './catalog';
import { SystemsService } from '../../core/systems.service';
import { CatalogEntry, Manifest } from '../../core/models';

const entries: CatalogEntry[] = [
  { slug: 'neo-brutalist', manifest: { slug: 'neo-brutalist', number: 2, name: 'Neo-Brutalist', tagline: 'Loud.', tags: ['bold'], pages: [{ id: 'landing', name: 'Landing', file: 'pages/landing.html' }] } as Manifest },
  { slug: 'dark-luxury', manifest: { slug: 'dark-luxury', number: 6, name: 'Dark Luxury', tagline: 'Quiet.', tags: ['dark'], pages: [{ id: 'landing', name: 'Landing', file: 'pages/landing.html' }] } as Manifest },
];

describe('Catalog', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [Catalog],
      providers: [
        provideRouter([]),
        { provide: SystemsService, useValue: { loadIndex: () => Promise.resolve(entries), fileUrl: (s: string, f: string) => `/systems/${s}/${f}` } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Catalog);
    fixture.detectChanges();
    // loadIndex() is a plain promise that Angular does not track, so wait a macrotask before rendering again.
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    return fixture;
  }

  it('renders one tile per system', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelectorAll('[data-tile]').length).toBe(2);
  });

  it('filters tiles when typing a query', async () => {
    const fixture = await setup();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type=search]');
    input.value = 'luxury';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const tiles = fixture.nativeElement.querySelectorAll('[data-tile]');
    expect(tiles.length).toBe(1);
    expect(tiles[0].textContent).toContain('Dark Luxury');
  });

  it('filters tiles by tag chip', async () => {
    const fixture = await setup();
    const chip = [...fixture.nativeElement.querySelectorAll('button')].find((b: HTMLButtonElement) => b.textContent?.trim() === 'bold') as HTMLButtonElement;
    chip.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-tile]').length).toBe(1);
    expect(chip.getAttribute('aria-pressed')).toBe('true');
  });
});
