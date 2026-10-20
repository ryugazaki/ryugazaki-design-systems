import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ShellThemeService } from './core/shell-theme.service';
import { Toast } from './shared/ui/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Toast],
  template: `
    <header class="flex items-center justify-between border-b border-ink px-4 font-mono text-meta md:px-8">
      <a routerLink="/" class="flex min-h-11 items-center hover:text-signal">ryugazaki / archive</a>
      <button
        type="button"
        class="-mr-2 min-h-11 px-2 hover:text-signal"
        [attr.aria-label]="'Switch to ' + nextMode() + ' theme'"
        (click)="theme.toggle()"
      >
        {{ nextMode() }}
      </button>
    </header>
    <main>
      <router-outlet />
    </main>
    <app-toast />
  `,
})
export class App {
  protected readonly theme = inject(ShellThemeService);
  protected nextMode(): string {
    return this.theme.mode() === 'dark' ? 'light' : 'dark';
  }
}
