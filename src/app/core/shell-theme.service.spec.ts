import { TestBed } from '@angular/core/testing';
import { ShellThemeService } from './shell-theme.service';

describe('ShellThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    TestBed.resetTestingModule();
  });

  it('restores the saved mode and applies it to <html>', () => {
    localStorage.setItem('archive-theme', 'dark');
    const service = TestBed.inject(ShellThemeService);
    expect(service.mode()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles, persists, and updates the dark class', () => {
    localStorage.setItem('archive-theme', 'light');
    const service = TestBed.inject(ShellThemeService);
    service.toggle();
    expect(service.mode()).toBe('dark');
    expect(localStorage.getItem('archive-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    service.toggle();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
