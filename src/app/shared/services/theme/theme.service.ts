import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'dark' | 'light';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _isBrowser = isPlatformBrowser(this._platformId);
  private readonly _storageKey = 'theme';

  isDarkMode = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    if (!this._isBrowser) {
      return;
    }

    const savedTheme = localStorage.getItem(this._storageKey);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    let initialIsDark = false;
    if (savedTheme === 'dark') {
      initialIsDark = true;
    } else if (savedTheme === 'light') {
      initialIsDark = false;
    } else {
      // Default to system preference
      initialIsDark = systemPrefersDark.matches;
    }

    this.applyTheme(initialIsDark, false);

    // Listen to OS changes when user hasn't explicitly set a preference
    systemPrefersDark.addEventListener('change', (event) => {
      const currentStored = localStorage.getItem(this._storageKey);
      if (!currentStored) {
        this.applyTheme(event.matches, false);
      }
    });
  }

  toggleTheme(): void {
    this.setDarkMode(!this.isDarkMode());
  }

  setDarkMode(isDark: boolean): void {
    this.applyTheme(isDark, true);
  }

  private applyTheme(isDark: boolean, saveToStorage: boolean): void {
    this.isDarkMode.set(isDark);

    if (this._isBrowser) {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      if (saveToStorage) {
        localStorage.setItem(this._storageKey, isDark ? 'dark' : 'light');
      }
    }
  }
}
