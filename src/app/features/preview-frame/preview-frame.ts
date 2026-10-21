import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ColorMode, FontSpec } from '../../core/models';
import { PREVIEW_HEIGHT_MESSAGE, buildPreviewDoc } from '../../core/preview-doc';

export const VIEWPORTS = [375, 768, 1280] as const;
export const DEVICE_HEIGHTS: Record<number, number> = { 375: 812, 768: 1024, 1280: 800 };

@Component({
  selector: 'app-preview-frame',
  host: { class: 'block' },
  template: `
    <div #box class="w-full overflow-hidden border border-ink" [style.height.px]="boxHeight()">
      <iframe
        #frame
        sandbox="allow-scripts"
        loading="lazy"
        class="block origin-top-left border-0"
        [title]="label()"
        [srcdoc]="doc()"
        [style.width.px]="viewport()"
        [style.height.px]="frameHeight()"
        [style.transform]="'scale(' + scale() + ')'"
      ></iframe>
    </div>
  `,
})
export class PreviewFrame {
  readonly snippet = input.required<string>();
  readonly theme = input.required<string>();
  readonly fonts = input.required<FontSpec[]>();
  readonly mode = input<ColorMode>('light');
  readonly viewport = input<number>(375);
  readonly padded = input(true);
  readonly label = input('Preview');
  readonly fit = input<'content' | 'device'>('content');

  private readonly sanitizer = inject(DomSanitizer);
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly frame = viewChild.required<ElementRef<HTMLIFrameElement>>('frame');
  private readonly boxWidth = signal(0);

  protected readonly contentHeight = signal(320);
  protected readonly frameHeight = computed(() =>
    this.fit() === 'device' ? (DEVICE_HEIGHTS[this.viewport()] ?? 800) : this.contentHeight(),
  );
  protected readonly doc = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      buildPreviewDoc(this.snippet(), { theme: this.theme(), fonts: this.fonts(), mode: this.mode(), padded: this.padded() }),
    ),
  );
  protected readonly scale = computed(() => {
    const width = this.boxWidth();
    return width > 0 ? Math.min(1, width / this.viewport()) : 1;
  });
  protected readonly boxHeight = computed(() => Math.ceil(this.frameHeight() * this.scale()));

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const onMessage = (event: MessageEvent) => {
        if (this.fit() === 'device') return;
        if (event.source !== this.frame().nativeElement.contentWindow) return;
        if (event.data?.type !== PREVIEW_HEIGHT_MESSAGE) return;
        const height = Number(event.data.height) || 0;
        this.contentHeight.set(Math.min(6000, Math.max(80, height)));
      };
      window.addEventListener('message', onMessage);
      destroyRef.onDestroy(() => window.removeEventListener('message', onMessage));

      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => this.boxWidth.set(entry.contentRect.width));
      observer.observe(this.box().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
