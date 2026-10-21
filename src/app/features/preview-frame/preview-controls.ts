import { Component, model } from '@angular/core';
import { ColorMode } from '../../core/models';
import { VIEWPORTS } from './preview-frame';

@Component({
  selector: 'app-preview-controls',
  template: `
    <div class="flex flex-wrap items-center gap-1.5 font-mono text-meta">
      <div class="flex" role="group" aria-label="Preview width">
        @for (width of viewports; track width) {
          <button
            type="button"
            class="-ml-px min-h-11 min-w-11 border border-ink px-2.5 first:ml-0"
            [class.bg-ink]="viewport() === width"
            [class.text-paper]="viewport() === width"
            [attr.aria-pressed]="viewport() === width"
            (click)="viewport.set(width)"
          >
            {{ width }}
          </button>
        }
      </div>
      <button
        type="button"
        class="ml-auto min-h-11 border border-ink px-2.5"
        [attr.aria-pressed]="mode() === 'dark'"
        [attr.aria-label]="'Preview in ' + (mode() === 'dark' ? 'light' : 'dark') + ' mode'"
        (click)="mode.set(mode() === 'dark' ? 'light' : 'dark')"
      >
        {{ mode() }}
      </button>
    </div>
  `,
})
export class PreviewControls {
  readonly viewport = model<number>(375);
  readonly mode = model<ColorMode>('light');
  protected readonly viewports = VIEWPORTS;
}
