import { Component, ElementRef, afterNextRender, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-copy-fallback-sheet',
  template: `
    <div class="fixed inset-0 z-40 flex items-end bg-ink/60 md:items-center md:justify-center" (click)="closed.emit()">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fallback-title"
        class="w-full border-t border-ink bg-paper p-4 md:max-w-2xl md:border"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p id="fallback-title" class="text-title font-bold">Copy it manually</p>
            <p class="mt-1 text-body text-graphite">Your browser blocked clipboard access. The text is selected; press Ctrl+C or Cmd+C.</p>
          </div>
          <button type="button" class="min-h-11 shrink-0 px-2 font-mono text-meta hover:text-signal" (click)="closed.emit()">close</button>
        </div>
        <textarea #area readonly class="mt-4 h-72 w-full resize-none border border-ink bg-paper p-3 font-mono text-meta" [value]="text()"></textarea>
      </div>
    </div>
  `,
})
export class CopyFallbackSheet {
  readonly text = input.required<string>();
  readonly closed = output<void>();
  private readonly area = viewChild.required<ElementRef<HTMLTextAreaElement>>('area');

  constructor() {
    afterNextRender(() => {
      const el = this.area().nativeElement;
      el.focus();
      el.select();
    });
  }
}
