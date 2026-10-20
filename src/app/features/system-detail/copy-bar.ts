import { Component, computed, inject, input, signal } from '@angular/core';
import { ClipboardService } from '../../core/clipboard.service';
import { estimateTokens } from '../../core/prompt-builder';
import { ToastService } from '../../core/toast.service';
import { CopyFallbackSheet } from '../../shared/ui/copy-fallback-sheet';

@Component({
  selector: 'app-copy-bar',
  imports: [CopyFallbackSheet],
  host: { class: 'block' },
  template: `
    <button
      type="button"
      class="flex min-h-14 w-full items-center justify-between gap-4 bg-ink px-4 text-left text-paper transition-colors hover:bg-signal"
      (click)="copy()"
    >
      <span class="text-title font-bold">Copy for AI</span>
      <span class="font-mono text-meta">~{{ tokens() }} tokens</span>
    </button>
    @if (fallback()) {
      <app-copy-fallback-sheet [text]="prompt()" (closed)="fallback.set(false)" />
    }
  `,
})
export class CopyBar {
  readonly prompt = input.required<string>();
  readonly name = input.required<string>();

  private readonly clipboard = inject(ClipboardService);
  private readonly toast = inject(ToastService);
  protected readonly fallback = signal(false);
  protected readonly tokens = computed(() => `${(estimateTokens(this.prompt()) / 1000).toFixed(1)}k`);

  protected async copy(): Promise<void> {
    if (await this.clipboard.copy(this.prompt())) this.toast.show(`Copied ${this.name()} for your agent`);
    else this.fallback.set(true);
  }
}
