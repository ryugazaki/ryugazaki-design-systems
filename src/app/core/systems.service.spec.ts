import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SystemsService } from './systems.service';
import { validManifest } from './testing/fixtures';

const flush = () => new Promise((r) => setTimeout(r));

describe('SystemsService', () => {
  let service: SystemsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SystemsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the index and marks broken manifests as null', async () => {
    const result = service.loadIndex();
    http.expectOne('/systems/index.json').flush({ systems: ['neo-brutalist', 'broken'] });
    await flush();
    http.expectOne('/systems/neo-brutalist/manifest.json').flush(validManifest);
    http.expectOne('/systems/broken/manifest.json').flush({ slug: 'broken' });
    const entries = await result;
    expect(entries.map((e) => e.slug)).toEqual(['neo-brutalist', 'broken']);
    expect(entries[0].manifest?.name).toBe('Neo-Brutalist');
    expect(entries[1].manifest).toBeNull();
  });

  it('loads a bundle, extracts snippets, and tolerates a missing file', async () => {
    const result = service.loadBundle('neo-brutalist');
    http.expectOne('/systems/neo-brutalist/manifest.json').flush(validManifest);
    await flush();
    http.expectOne('/systems/neo-brutalist/theme.css').flush('@theme {}');
    http.expectOne('/systems/neo-brutalist/components/button.html').flush('<!-- snippet:start --><button>Go</button><!-- snippet:end -->');
    http.expectOne('/systems/neo-brutalist/pages/landing.html').flush('missing', { status: 404, statusText: 'Not Found' });
    const bundle = await result;
    expect(bundle.theme).toBe('@theme {}');
    expect(bundle.components[0]).toEqual({ id: 'button', name: 'Button', notes: 'Three variants.', file: 'components/button.html', snippet: '<button>Go</button>' });
    expect(bundle.pages[0].snippet).toBeNull();

    expect(await service.loadBundle('neo-brutalist')).toBe(bundle);
  });

  it('does not cache a failed bundle', async () => {
    const first = service.loadBundle('nope');
    http.expectOne('/systems/nope/manifest.json').flush('missing', { status: 404, statusText: 'Not Found' });
    await expect(first).rejects.toMatchObject({ status: 404 });
    service.loadBundle('nope').catch(() => undefined);
    http.expectOne('/systems/nope/manifest.json').flush('missing', { status: 404, statusText: 'Not Found' });
  });

  it('caches the anti-slop rules', async () => {
    const first = service.loadAntiSlop();
    http.expectOne('/systems/_global/anti-slop.md').flush('1. No gradients.');
    expect(await first).toBe('1. No gradients.');
    expect(await service.loadAntiSlop()).toBe('1. No gradients.');
  });
});
