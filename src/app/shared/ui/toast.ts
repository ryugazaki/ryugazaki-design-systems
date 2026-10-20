import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div role="status" aria-live="polite" class="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex justify-center md:bottom-6">
      @if (toast.message(); as message) {
        <p class="border border-ink bg-ink px-4 py-3 font-mono text-meta text-paper">{{ message }}</p>
      }
    </div>
  `,
})
export class Toast {
  protected readonly toast = inject(ToastService);
}
