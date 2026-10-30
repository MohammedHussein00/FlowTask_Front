import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocaleCode, LocaleService } from './locale.service';

export type TranslationMap = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class ComponentI18nService {
  private readonly http = inject(HttpClient);
  private readonly localeService = inject(LocaleService);
  private readonly loaded = new Set<string>();
  private readonly dictionaries = signal<Record<string, TranslationMap>>({});

  constructor() {
    this.localeService.locale$.subscribe(locale => {
      for (const scope of this.loadedScopes()) this.load(scope, locale);
    });
  }

  load(scope: string, locale: LocaleCode = this.localeService.current): void {
    const cacheKey = `${scope}:${locale}`;
    if (this.loaded.has(cacheKey)) return;
    this.loaded.add(cacheKey);
    this.http.get<TranslationMap>(`/assets/i18n/components/${scope}/${locale}.json`).subscribe({
      next: translations => {
        this.dictionaries.update(current => ({ ...current, [cacheKey]: translations }));
      },
      error: () => {
        // Keep the UI usable if an optional locale file is missing. English is
        // the safe fallback and missing keys remain visible to developers.
        if (locale !== 'en') this.load(scope, 'en');
      },
    });
  }

  t(scope: string, key: string, fallback = key): string {
    this.load(scope);
    const localeKey = `${scope}:${this.localeService.current}`;
    const englishKey = `${scope}:en`;
    const dictionaries = this.dictionaries();
    return dictionaries[localeKey]?.[key] ?? dictionaries[englishKey]?.[key] ?? fallback;
  }

  private loadedScopes(): string[] {
    return [...new Set([...this.loaded].map(key => key.split(':')[0]))];
  }
}
