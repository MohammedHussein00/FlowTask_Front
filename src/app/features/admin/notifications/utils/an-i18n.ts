// src/app/features/admin/notifications/utils/an-i18n.ts
import { Injectable, Pipe, PipeTransform, inject } from '@angular/core';
import { ComponentI18nService } from '../../../../core/i18n/component-i18n.service';

export const AN_SCOPE = 'admin-notifications';

/** Thin wrapper over ComponentI18nService for the `admin-notifications` dictionary (en / ar / fr). Supports `{param}` placeholders. */
@Injectable({ providedIn: 'root' })
export class AnI18n {
  private readonly i18n = inject(ComponentI18nService);

  constructor() { this.i18n.load(AN_SCOPE); }

  t(key: string, params?: Record<string, string | number>): string {
    const text = this.i18n.t(AN_SCOPE, key, key);
    return params ? text.replace(/\{(\w+)\}/g, (_m, k: string) => String(params[k] ?? '')) : text;
  }
}

/** {{ 'list.title' | anT }}  or  {{ 'list.range' | anT: { from: 1, to: 10 } }} */
@Pipe({ name: 'anT', standalone: true, pure: false })
export class AnTPipe implements PipeTransform {
  private readonly i18n = inject(AnI18n);
  transform(key: string, params?: Record<string, string | number>): string { return this.i18n.t(key, params); }
}
