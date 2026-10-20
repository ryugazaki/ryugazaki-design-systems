import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColorMode, SECTIONS, Section, SystemBundle } from '../../core/models';
import { buildPrompt } from '../../core/prompt-builder';
import { SystemsService } from '../../core/systems.service';
import { padNumber } from '../catalog/catalog-filter';
import { CopyBar } from './copy-bar';
import { ItemsSection } from './sections/items-section';
import { OverviewSection } from './sections/overview-section';
import { RulesSection } from './sections/rules-section';
import { TokensSection } from './sections/tokens-section';

@Component({
  selector: 'app-system-detail',
  imports: [RouterLink, CopyBar, OverviewSection, TokensSection, ItemsSection, RulesSection],
  template: `
    @switch (state()) {
      @case ('loading') {
        <p class="px-4 py-16 font-mono text-meta text-graphite md:px-8">Loading {{ slug() }}…</p>
      }
      @case ('not-found') {
        <div class="px-4 py-16 md:px-8">
          <p class="text-heading font-extrabold tracking-[-0.03em]">Not in the archive</p>
          <p class="mt-3 text-body text-graphite">There's no design system called "{{ slug() }}".</p>
          <a routerLink="/" class="mt-5 inline-flex min-h-11 items-center border border-ink px-5 font-bold hover:text-signal">Back to the archive</a>
        </div>
      }
      @case ('error') {
        <div class="px-4 py-16 md:px-8">
          <p class="text-title font-bold">{{ slug() }} didn't load.</p>
          <button type="button" class="mt-5 min-h-11 border border-ink bg-ink px-5 font-bold text-paper hover:border-signal hover:bg-signal" (click)="load(slug())">Retry</button>
        </div>
      }
      @default {
        @if (bundle(); as b) {
          <div class="pb-20 md:grid md:grid-cols-[17rem_1fr] md:pb-0 lg:grid-cols-[20rem_1fr]">
            <aside class="md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:border-r md:border-ink">
              <div class="border-b border-ink px-4 pb-5 pt-6 md:px-6">
                <a routerLink="/" class="inline-flex min-h-11 items-center font-mono text-meta hover:text-signal">← archive</a>
                <p class="font-mono text-meta text-graphite">No. {{ number() }}</p>
                <h1 class="mt-2 text-heading font-extrabold tracking-[-0.03em] md:text-[2.75rem] md:leading-none">{{ b.manifest.name }}</h1>
                <p class="mt-3 text-body text-graphite">{{ b.manifest.tagline }}</p>
              </div>
              <nav class="flex overflow-x-auto border-b border-ink font-mono text-meta md:flex-col md:border-b-0" aria-label="Sections">
                @for (s of sections; track s) {
                  <a
                    [routerLink]="['/s', slug(), s]"
                    class="flex min-h-11 shrink-0 items-center border-b-2 px-4 hover:text-signal md:border-b md:px-6"
                    [class]="active() === s ? 'border-b-signal md:border-b-ink md:bg-ink md:text-paper' : 'border-b-transparent md:border-b-ink'"
                    [attr.aria-current]="active() === s ? 'page' : null"
                  >{{ s }}</a>
                }
              </nav>
              <app-copy-bar class="fixed inset-x-0 bottom-0 z-20 border-t border-ink md:sticky md:mt-auto md:border-t-0" [prompt]="prompt()" [name]="b.manifest.name" />
            </aside>

            <div class="min-w-0 px-4 py-6 md:px-8">
              <p class="mb-6 max-w-prose text-body">{{ b.manifest.description }}</p>
              @switch (active()) {
                @case ('overview') { <app-overview-section [bundle]="b" [(viewport)]="viewport" [(mode)]="mode" /> }
                @case ('tokens') { <app-tokens-section [bundle]="b" /> }
                @case ('components') { <app-items-section prefix="c" [items]="b.components" [theme]="b.theme" [fonts]="b.manifest.fonts" [(viewport)]="viewport" [(mode)]="mode" /> }
                @case ('pages') { <app-items-section prefix="p" [padded]="false" fit="device" [items]="b.pages" [theme]="b.theme" [fonts]="b.manifest.fonts" [(viewport)]="viewport" [(mode)]="mode" /> }
                @case ('rules') { <app-rules-section [manifest]="b.manifest" [antiSlop]="antiSlop()" /> }
              }
            </div>
          </div>
        }
      }
    }
  `,
})
export class SystemDetail {
  readonly slug = input.required<string>();
  readonly section = input<string>();

  private readonly systems = inject(SystemsService);
  protected readonly sections = SECTIONS;
  protected readonly state = signal<'loading' | 'ready' | 'not-found' | 'error'>('loading');
  protected readonly bundle = signal<SystemBundle | null>(null);
  protected readonly antiSlop = signal('');
  protected readonly viewport = signal(375);
  protected readonly mode = signal<ColorMode>('light');

  protected readonly active = computed<Section>(() => {
    const s = this.section();
    return (SECTIONS as readonly string[]).includes(s ?? '') ? (s as Section) : 'overview';
  });
  protected readonly number = computed(() => padNumber(this.bundle()?.manifest.number ?? 0));
  protected readonly prompt = computed(() => {
    const b = this.bundle();
    return b ? buildPrompt(b, this.antiSlop()) : '';
  });

  constructor() {
    effect(() => {
      const slug = this.slug();
      untracked(() => this.load(slug));
    });
  }

  protected async load(slug: string): Promise<void> {
    this.state.set('loading');
    try {
      const [bundle, antiSlop] = await Promise.all([this.systems.loadBundle(slug), this.systems.loadAntiSlop()]);
      this.bundle.set(bundle);
      this.antiSlop.set(antiSlop);
      this.mode.set(bundle.manifest.defaultMode);
      this.state.set('ready');
    } catch (err) {
      this.state.set(err instanceof HttpErrorResponse && err.status === 404 ? 'not-found' : 'error');
    }
  }
}
