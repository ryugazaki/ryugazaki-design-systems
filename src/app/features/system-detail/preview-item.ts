import { Component, input, signal } from '@angular/core';
import { ColorMode, FontSpec, LoadedItem } from '../../core/models';
import { CodeBlock } from '../../shared/ui/code-block';
import { PreviewFrame } from '../preview-frame/preview-frame';

@Component({
  selector: 'app-preview-item',
  imports: [PreviewFrame, CodeBlock],
  host: { class: 'block' },
  template: `
    <article class="border-t border-ink pt-4">
      <header class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 class="text-title font-bold"><span class="mr-2 font-mono text-meta font-normal text-graphite">{{ index() }}</span>{{ item().name }}</h3>
        <div class="flex font-mono text-meta" role="group" [attr.aria-label]="item().name + ' view'">
          <button type="button" class="min-h-11 border border-ink px-2.5" [class.bg-ink]="!showCode()" [class.text-paper]="!showCode()" [attr.aria-pressed]="!showCode()" (click)="showCode.set(false)">preview</button>
          <button type="button" class="-ml-px min-h-11 border border-ink px-2.5" [class.bg-ink]="showCode()" [class.text-paper]="showCode()" [attr.aria-pressed]="showCode()" (click)="showCode.set(true)">code</button>
        </div>
      </header>
      @if (item().notes) {
        <p class="mt-2 max-w-prose text-body text-graphite">{{ item().notes }}</p>
      }
      <div class="mt-3">
        @if (item().snippet; as snippet) {
          @if (showCode()) {
            <app-code-block [code]="snippet" />
          } @else {
            <app-preview-frame [snippet]="snippet" [theme]="theme()" [fonts]="fonts()" [mode]="mode()" [viewport]="viewport()" [padded]="padded()" [fit]="fit()" [label]="item().name + ' preview'" />
          }
        } @else {
          <p class="border border-dashed border-ink p-4 font-mono text-meta text-graphite">{{ item().file }} didn't load. It's left out of the copied prompt.</p>
        }
      </div>
    </article>
  `,
})
export class PreviewItem {
  readonly item = input.required<LoadedItem>();
  readonly index = input.required<string>();
  readonly theme = input.required<string>();
  readonly fonts = input.required<FontSpec[]>();
  readonly mode = input.required<ColorMode>();
  readonly viewport = input.required<number>();
  readonly padded = input(true);
  readonly fit = input<'content' | 'device'>('content');
  protected readonly showCode = signal(false);
}
