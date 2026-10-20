import { Component, input } from '@angular/core';
import { Manifest } from '../../../core/models';

@Component({
  selector: 'app-rules-section',
  template: `
    <div class="grid gap-8 md:grid-cols-2">
      <section>
        <h2 class="font-mono text-meta text-graphite">do</h2>
        <ol class="mt-3 border-t border-ink">
          @for (rule of manifest().rules.do; track rule) {
            <li class="border-b border-ink py-3 text-body">{{ rule }}</li>
          }
        </ol>
      </section>
      <section>
        <h2 class="font-mono text-meta font-bold text-ink">don't</h2>
        <ol class="mt-3 border-t border-ink">
          @for (rule of manifest().rules.dont; track rule) {
            <li class="border-b border-ink py-3 text-body">{{ rule }}</li>
          }
        </ol>
      </section>
    </div>
    <section class="mt-10">
      <h2 class="font-mono text-meta text-graphite">global anti-slop rules, included in every prompt</h2>
      <p class="mt-3 whitespace-pre-line border border-ink p-4 text-body">{{ antiSlop() }}</p>
    </section>
  `,
})
export class RulesSection {
  readonly manifest = input.required<Manifest>();
  readonly antiSlop = input.required<string>();
}
