import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { AppStorage } from '../storage/app-storage';

export type ThemeMode = 'system' | 'light' | 'dark';
export type AccentName = 'black' | 'purple' | 'blue' | 'pink' | 'violet' | 'indigo' | 'orange' | 'teal' | 'bronze' | 'mint';
export type NavDensity = 'icons' | 'icons-labels';

type ThemePreference = { mode: ThemeMode; accent: AccentName };

const STORAGE_KEY = 'appearance';
const DEFAULT_PREFERENCE: ThemePreference = { mode: 'dark', accent: 'pink' };
const ACCENTS: readonly AccentName[] = ['black', 'purple', 'blue', 'pink', 'violet', 'indigo', 'orange', 'teal', 'bronze', 'mint'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly browser: boolean;
  private readonly mediaQuery: MediaQueryList | null;
  readonly preference = signal<ThemePreference>(DEFAULT_PREFERENCE);
  readonly effectiveTheme = signal<'light' | 'dark'>('dark');

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.browser = isPlatformBrowser(platformId);
    this.mediaQuery = this.browser ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const preference = this.browser ? this.readPreference() : DEFAULT_PREFERENCE;
    this.preference.set(preference);
    this.apply(preference);
    this.mediaQuery?.addEventListener('change', () => {
      if (this.preference().mode === 'system') this.apply(this.preference());
    });
  }

  setMode(mode: ThemeMode): void {
    if (!['system', 'light', 'dark'].includes(mode)) return;
    this.update({ ...this.preference(), mode });
  }

  setAccent(accent: string): void {
    if (!ACCENTS.includes(accent as AccentName)) return;
    this.update({ ...this.preference(), accent: accent as AccentName });
  }

  toggle(): void {
    this.setMode(this.effectiveTheme() === 'dark' ? 'light' : 'dark');
  }

  private update(preference: ThemePreference): void {
    this.preference.set(preference);
    this.apply(preference);
    if (this.browser) AppStorage.setJSON(STORAGE_KEY, preference);
  }

  private apply(preference: ThemePreference): void {
    const theme = preference.mode === 'system'
      ? (this.mediaQuery?.matches ? 'dark' : 'light')
      : preference.mode;
    this.effectiveTheme.set(theme);
    this.document.documentElement.dataset['theme'] = theme;
    this.document.documentElement.dataset['accent'] = preference.accent;
    this.document.documentElement.style.colorScheme = theme;
  }

  private readPreference(): ThemePreference {
    const parsed = AppStorage.getJSON<Partial<ThemePreference>>(STORAGE_KEY) ?? {};
    const mode = ['system', 'light', 'dark'].includes(parsed.mode ?? '') ? parsed.mode as ThemeMode : DEFAULT_PREFERENCE.mode;
    const accent = ACCENTS.includes(parsed.accent as AccentName) ? parsed.accent as AccentName : DEFAULT_PREFERENCE.accent;
    return { mode, accent };
  }
}
