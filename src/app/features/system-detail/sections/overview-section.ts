import { Component, computed, input, model } from '@angular/core';
import { ColorMode, SystemBundle } from '../../../core/models';
import { PreviewControls } from '../../preview-frame/preview-controls';
import { PreviewFrame } from '../../preview-frame/preview-frame';

@Component({
  selector: 'app-overview-section',
  imports: [PreviewControls, PreviewFrame],
  template: `
    <dl class="grid gap-x-8 gap-y-4 border-b border-ink pb-6 md:grid-cols-[10rem_1fr]">
      <dt class="font-mono text-meta text-graphite">use it for</dt>
      <dd class="text-body">{{ bundle().manifest.useCases.join(', ') }}</dd>
      <dt class="font-mono text-meta text-graphite">fonts</dt>
      <dd class="text-body">
        @for (font of bundle().manifest.fonts; track font.family) {
          <span class="block"><span class="font-bold">{{ font.family }}</span>{{ ' ' }}<span class="text-graphite">{{ font.role }}</span></span>
        }
      </dd>
      <dt class="font-mono text-meta text-graphite">tags</dt>
      <dd class="flex flex-wrap gap-1.5">
        @for (tag of bundle().manifest.tags; track tag) {
          <span class="border border-ink px-2 py-0.5 font-mono text-meta">{{ tag }}</span>
        }
      </dd>
      <dt class="font-mono text-meta text-graphite">contents</dt>
      <dd class="text-body">{{ bundle().components.length }} components, {{ bundle().pages.length }} pages</dd>
    </dl>
    @if (landing(); as page) {
      <div class="mt-6">
        <app-preview-controls [(viewport)]="viewport" [(mode)]="mode" />
        <div class="mt-3">
          <app-preview-frame [snippet]="page" [theme]="bundle().theme" [fonts]="bundle().manifest.fonts" [mode]="mode()" [viewport]="viewport()" [padded]="false" fit="device" label="Landing page preview" />
        </div>
      </div>
    }
  `,
})
export class OverviewSection {
  readonly bundle = input.required<SystemBundle>();
  readonly viewport = model.required<number>();
  readonly mode = model.required<ColorMode>();
  protected readonly landing = computed(() => this.bundle().pages.find((p) => p.id === 'landing')?.snippet ?? null);
}
