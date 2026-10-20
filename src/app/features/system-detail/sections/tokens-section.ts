import { Component, input } from '@angular/core';
import { SystemBundle } from '../../../core/models';
import { CodeBlock } from '../../../shared/ui/code-block';

@Component({
  selector: 'app-tokens-section',
  imports: [CodeBlock],
  template: `
    <h2 class="font-mono text-meta text-graphite">color, light and dark</h2>
    <ul class="mt-3 grid grid-cols-2 gap-px border border-ink bg-ink md:grid-cols-3">
      @for (color of bundle().manifest.palette; track color.token) {
        <li class="bg-paper">
          <div class="grid h-16 grid-cols-2" aria-hidden="true">
            <span [style.background]="color.light"></span>
            <span [style.background]="color.dark"></span>
          </div>
          <div class="border-t border-ink p-2.5">
            <p class="font-mono text-meta">{{ color.token }}</p>
            <p class="font-mono text-meta text-graphite">{{ color.light }} / {{ color.dark }}</p>
            <p class="mt-1 text-body">{{ color.role }}</p>
          </div>
        </li>
      }
    </ul>

    <h2 class="mt-10 font-mono text-meta text-graphite">type scale, ratio {{ bundle().manifest.typeScale.ratio }}</h2>
    <dl class="mt-3 border-t border-ink">
      @for (step of steps(); track step[0]) {
        <div class="flex items-baseline justify-between border-b border-ink py-2">
          <dt class="font-mono text-meta">text-{{ step[0] }}</dt>
          <dd class="font-mono text-meta text-graphite">{{ step[1] }}</dd>
        </div>
      }
    </dl>

    <h2 class="mt-10 font-mono text-meta text-graphite">theme.css</h2>
    <app-code-block class="mt-3" language="css" [code]="bundle().theme" />
  `,
})
export class TokensSection {
  readonly bundle = input.required<SystemBundle>();
  protected steps(): [string, string][] {
    return Object.entries(this.bundle().manifest.typeScale.steps);
  }
}
