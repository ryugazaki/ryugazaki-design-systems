import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-tag-chip',
  template: `
    <button
      type="button"
      class="min-h-9 shrink-0 border border-ink px-3 font-mono text-meta transition-colors hover:text-signal"
      [class.bg-ink]="active()"
      [class.text-paper]="active()"
      [attr.aria-pressed]="active()"
      (click)="pressed.emit()"
    >
      {{ label() }}
    </button>
  `,
})
export class TagChip {
  readonly label = input.required<string>();
  readonly active = input(false);
  readonly pressed = output<void>();
}
