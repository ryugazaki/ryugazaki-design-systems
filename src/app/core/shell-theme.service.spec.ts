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

  it('still boots and toggles when storage is blocked', () => {
    const blocked = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    try {
      const service = TestBed.inject(ShellThemeService);
      const first = service.mode();
      expect(() => service.toggle()).not.toThrow();
      expect(service.mode()).not.toBe(first);
    } finally {
      get.mockRestore();
      set.mockRestore();
    }
  });
});
