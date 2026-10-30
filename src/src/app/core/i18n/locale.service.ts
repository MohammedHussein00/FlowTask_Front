import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type LocaleCode = 'en' | 'ar' | 'fr';
export type TextDirection = 'ltr' | 'rtl';

export interface LocaleOption {
  code: LocaleCode;
  label: string;
  nativeLabel: string;
  direction: TextDirection;
}

const STORAGE_KEY = 'flowtask.locale';
const DEFAULT_LOCALE: LocaleCode = 'en';

export const LOCALES: readonly LocaleOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', direction: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', direction: 'rtl' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', direction: 'ltr' },
];

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly browser: boolean;
  private  localeSubject!: BehaviorSubject<LocaleCode>;
  readonly locale = signal<LocaleCode>(DEFAULT_LOCALE);
  readonly locale$ = (this.localeSubject = new BehaviorSubject<LocaleCode>(DEFAULT_LOCALE)).asObservable();

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.browser = isPlatformBrowser(platformId);
    const initial = this.browser ? this.readStoredLocale() : DEFAULT_LOCALE;
    this.locale.set(initial);
    this.localeSubject.next(initial);
    this.applyDocumentSettings(initial);
  }

  get current(): LocaleCode {
    return this.locale();
  }

  get currentOption(): LocaleOption {
    return LOCALES.find(item => item.code === this.current) ?? LOCALES[0];
  }

  setLocale(next: string): void {
    if (!this.isSupported(next) || next === this.current) return;
    const value = next as LocaleCode;
    this.locale.set(value);
    this.localeSubject.next(value);
    this.applyDocumentSettings(value);
    if (this.browser) localStorage.setItem(STORAGE_KEY, value);
  }

  isSupported(value: string): value is LocaleCode {
    return LOCALES.some(item => item.code === value);
  }

  private readStoredLocale(): LocaleCode {
    const value = localStorage.getItem(STORAGE_KEY);
    return value && this.isSupported(value) ? value : DEFAULT_LOCALE;
  }

  private applyDocumentSettings(value: LocaleCode): void {
    const direction = LOCALES.find(item => item.code === value)?.direction ?? 'ltr';
    this.document.documentElement.lang = value;
    this.document.documentElement.dir = direction;
    this.document.documentElement.dataset['locale'] = value;
  }
}
