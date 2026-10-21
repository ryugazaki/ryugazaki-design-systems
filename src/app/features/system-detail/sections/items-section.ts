import { Component, input, model } from '@angular/core';
import { ColorMode, FontSpec, LoadedItem } from '../../../core/models';
import { PreviewControls } from '../../preview-frame/preview-controls';
import { PreviewItem } from '../preview-item';
import { padNumber } from '../../catalog/catalog-filter';

@Component({
  selector: 'app-items-section',
  imports: [PreviewControls, PreviewItem],
  template: `
    <h2 class="sr-only">{{ heading() }}</h2>
    <div class="sticky top-0 z-10 -mx-4 border-b border-ink bg-paper px-4 py-2 md:mx-0 md:px-0">
      <app-preview-controls [(viewport)]="viewport" [(mode)]="mode" />
    </div>
    <div class="mt-4 flex flex-col gap-10">
      @for (item of items(); track item.id; let i = $index) {
        <app-preview-item [item]="item" [index]="prefix() + '.' + pad(i + 1)" [theme]="theme()" [fonts]="fonts()" [mode]="mode()" [viewport]="viewport()" [padded]="padded()" [fit]="fit()" />
      }
    </div>
  `,
})
export class ItemsSection {
  readonly items = input.required<LoadedItem[]>();
  readonly theme = input.required<string>();
  readonly fonts = input.required<FontSpec[]>();
  readonly prefix = input.required<string>();
  readonly heading = input.required<string>();
  readonly padded = input(true);
  readonly fit = input<'content' | 'device'>('content');
  readonly viewport = model.required<number>();
  readonly mode = model.required<ColorMode>();
  protected pad(n: number): string {
    return padNumber(n);
  }
}
