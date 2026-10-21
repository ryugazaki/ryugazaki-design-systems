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
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked (privacy mode, sandbox): the toggle still works for this session.
    }
    this.apply(next);
  }

  private apply(mode: ColorMode): void {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }

  private initialMode(): ColorMode {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage blocked: fall back to the system preference.
    }
    if (saved === 'light' || saved === 'dark') return saved;
    const prefersDark =
      typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}
