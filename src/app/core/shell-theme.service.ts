import { Injectable, signal } from '@angular/core';
import { ColorMode } from './models';

const STORAGE_KEY = 'archive-theme';

@Injectable({ providedIn: 'root' })
export class ShellThemeService {
  readonly mode = signal<ColorMode>(this.initialMode());

  constructor() {
    this.apply(this.mode());
  }

  toggle(): void {
    const next: ColorMode = this.mode() === 'dark' ? 'light' : 'dark';
    this.mode.set(next);
    localStorage.setItem(STORAGE_KEY, next);
    this.apply(next);
  }

  private apply(mode: ColorMode): void {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }

  private initialMode(): ColorMode {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    const prefersDark =
      typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}
