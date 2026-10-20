import { Component, inject, input, signal } from '@angular/core';
import { ClipboardService } from '../../core/clipboard.service';
import { ToastService } from '../../core/toast.service';
import { CopyFallbackSheet } from './copy-fallback-sheet';

@Component({
  selector: 'app-code-block',
  imports: [CopyFallbackSheet],
  host: { class: 'block' },
  template: `
    <div class="border border-ink">
      <div class="flex items-center justify-between border-b border-ink px-3 font-mono text-meta">
        <span class="text-graphite">{{ language() }}</span>
        <button type="button" class="min-h-11 px-2 hover:text-signal" (click)="copy()">copy code</button>
      </div>
      <pre class="max-h-[28rem] overflow-auto p-3 font-mono text-meta leading-relaxed"><code>{{ code() }}</code></pre>
    </div>
    @if (fallback()) {
      <app-copy-fallback-sheet [text]="code()" (closed)="fallback.set(false)" />
    }
  `,
})
export class CodeBlock {
  readonly code = input.required<string>();
  readonly language = input('html');

  private readonly clipboard = inject(ClipboardService);
  private readonly toast = inject(ToastService);
  protected readonly fallback = signal(false);

  protected async copy(): Promise<void> {
    if (await this.clipboard.copy(this.code())) this.toast.show('Code copied');
    else this.fallback.set(true);
  }
}
