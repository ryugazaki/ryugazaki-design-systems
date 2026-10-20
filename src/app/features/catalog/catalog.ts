import { Component, computed, inject, signal } from '@angular/core';
import { CatalogEntry } from '../../core/models';
import { SystemsService } from '../../core/systems.service';
import { TagChip } from '../../shared/ui/tag-chip';
import { CatalogTile } from './catalog-tile';
import { collectTags, filterEntries, padNumber, tileSpan } from './catalog-filter';

@Component({
  selector: 'app-catalog',
  imports: [TagChip, CatalogTile],
  template: `
    <section class="px-4 pb-6 pt-8 md:px-8 md:pt-14">
      <p class="font-mono text-meta text-graphite">vol. 01, design systems</p>
      <h1 class="mt-3 text-display font-extrabold tracking-[-0.03em] lg:text-display-lg">Specimens<br />for agents</h1>
      <p class="mt-5 max-w-md text-body text-graphite">
        Design systems written in plain HTML and Tailwind. Pick one, copy it, and hand it to your coding agent so the UI it writes looks intentional.
      </p>
    </section>

    <div class="sticky top-0 z-10 border-y border-ink bg-paper px-4 py-2 md:px-8">
      <div class="flex flex-col gap-2 md:flex-row md:items-center">
        <label class="flex min-h-11 flex-1 items-center gap-3 border border-ink px-3 md:max-w-sm">
          <span class="font-mono text-meta text-graphite">search</span>
          <input
            type="search"
            class="w-full bg-transparent text-body outline-none placeholder:text-graphite"
            placeholder="brutalist, dark, dashboard"
            aria-label="Search design systems"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
        </label>
        <div class="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 md:mx-0 md:px-0" role="group" aria-label="Filter by tag">
          <app-tag-chip label="all" [active]="tag() === null" (pressed)="tag.set(null)" />
          @for (t of tags(); track t) {
            <app-tag-chip [label]="t" [active]="tag() === t" (pressed)="tag.set(tag() === t ? null : t)" />
          }
        </div>
        <p class="font-mono text-meta text-graphite md:ml-auto">{{ countLabel() }}</p>
      </div>
    </div>

    @switch (state()) {
      @case ('loading') {
        <p class="px-4 py-16 font-mono text-meta text-graphite md:px-8">Loading the archive…</p>
      }
      @case ('error') {
        <div class="px-4 py-16 md:px-8">
          <p class="text-title font-bold">The archive index didn't load.</p>
          <p class="mt-2 text-body text-graphite">Check that the dev server is running, then try again.</p>
          <button type="button" class="mt-5 min-h-11 border border-ink bg-ink px-5 font-bold text-paper hover:bg-signal hover:border-signal" (click)="load()">Retry</button>
        </div>
      }
      @default {
        @if (visible().length === 0) {
          <div class="px-4 py-16 md:px-8">
            <p class="text-title font-bold">No systems match "{{ query() }}".</p>
            <button type="button" class="mt-4 min-h-11 font-mono text-meta underline underline-offset-4 hover:text-signal" (click)="clear()">Clear search and filters</button>
          </div>
        } @else {
          <div class="grid grid-cols-2 gap-px border-b border-ink bg-ink md:grid-cols-4">
            @for (entry of visible(); track entry.slug; let i = $index) {
              <div [class]="span(i)">
                @if (entry.manifest; as manifest) {
                  <app-catalog-tile class="h-full" [manifest]="manifest" [featured]="i === 0" />
                } @else {
                  <div class="h-full bg-paper p-3.5 md:p-5" data-tile>
                    <p class="font-mono text-meta text-graphite">No. ??</p>
                    <p class="mt-2 text-title font-bold">{{ entry.slug }}</p>
                    <p class="mt-1 text-body text-graphite">This entry is unavailable. Its manifest didn't load.</p>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    }
  `,
})
export class Catalog {
  private readonly systems = inject(SystemsService);

  protected readonly state = signal<'loading' | 'error' | 'ready'>('loading');
  protected readonly entries = signal<CatalogEntry[]>([]);
  protected readonly query = signal('');
  protected readonly tag = signal<string | null>(null);

  protected readonly tags = computed(() => collectTags(this.entries()));
  protected readonly visible = computed(() => filterEntries(this.entries(), this.query(), this.tag()));
  protected readonly countLabel = computed(() => `${padNumber(this.visible().length)} of ${padNumber(this.entries().length)} entries`);

  constructor() {
    this.load();
  }

  protected async load(): Promise<void> {
    this.state.set('loading');
    try {
      this.entries.set(await this.systems.loadIndex());
      this.state.set('ready');
    } catch {
      this.state.set('error');
    }
  }

  protected clear(): void {
    this.query.set('');
    this.tag.set(null);
  }

  protected span(index: number): string {
    return tileSpan(index);
  }
}
