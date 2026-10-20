import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Manifest } from '../../core/models';
import { SystemsService } from '../../core/systems.service';
import { padNumber } from './catalog-filter';

const THUMB_WIDTH = 1280;

@Component({
  selector: 'app-catalog-tile',
  imports: [RouterLink],
  host: { class: 'block bg-paper' },
  template: `
    <a [routerLink]="['/s', manifest().slug]" class="group flex h-full flex-col p-3.5 md:p-5" data-tile>
      <div #box class="relative flex-1 overflow-hidden border border-ink" [style.min-height.px]="featured() ? 240 : 132">
        @if (src(); as url) {
          <iframe
            [src]="url"
            loading="lazy"
            sandbox="allow-scripts"
            tabindex="-1"
            aria-hidden="true"
            title=""
            class="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
            [style.width.px]="thumbWidth"
            [style.height.px]="thumbWidth"
            [style.transform]="'scale(' + scale() + ')'"
          ></iframe>
        }
      </div>
      <div class="mt-3 flex items-baseline justify-between gap-3">
        <span class="font-bold group-hover:text-signal" [class]="featured() ? 'text-heading tracking-[-0.03em]' : 'text-title'">{{ manifest().name }}</span>
        <span class="shrink-0 font-mono text-meta">No. {{ number() }}</span>
      </div>
      <p class="mt-1 text-body text-graphite">{{ manifest().tagline }}</p>
    </a>
  `,
})
export class CatalogTile {
  readonly manifest = input.required<Manifest>();
  readonly featured = input(false);

  private readonly systems = inject(SystemsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly boxWidth = signal(0);

  protected readonly thumbWidth = THUMB_WIDTH;
  protected readonly number = computed(() => padNumber(this.manifest().number));
  protected readonly scale = computed(() => (this.boxWidth() || THUMB_WIDTH) / THUMB_WIDTH);
  protected readonly src = computed(() => {
    const landing = this.manifest().pages.find((p) => p.id === 'landing');
    return landing
      ? this.sanitizer.bypassSecurityTrustResourceUrl(this.systems.fileUrl(this.manifest().slug, landing.file))
      : null;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => this.boxWidth.set(entry.contentRect.width));
      observer.observe(this.box().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
