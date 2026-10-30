/**
 * Flowspace Command Refresh: the one actual language switcher in the app.
 *
 * The translation pipeline (ComponentI18nService + componentT pipe) already
 * worked, and LocaleService.setLocale() already worked — but nothing in the
 * UI ever called it. This is the missing control: a small globe button that
 * opens a list of the supported locales. Used on the auth pages (via
 * AuthLayoutComponent) and in the topbar for the signed-in app shell.
 */
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { LucideAngularModule, Globe, Check } from 'lucide-angular';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { ComponentTranslatePipe } from '../../../core/i18n/component-translate.pipe';
import { LocaleService, LOCALES } from '../../../core/i18n/locale.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [LucideAngularModule, NzPopoverModule, ComponentTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="lang-trigger"
      [class.lang-trigger--compact]="compact()"
      nz-popover
      [nzPopoverContent]="langMenu"
      nzPopoverTrigger="click"
      nzPopoverPlacement="bottomRight"
      nzPopoverOverlayClassName="sb-popover"
      [attr.aria-label]="'language' | componentT:'shared'">
      <lucide-icon [img]="Globe" size="15" />
      @if (!compact()) { <span class="lang-trigger__label">{{ locale.currentOption.nativeLabel }}</span> }
    </button>
    <ng-template #langMenu>
      <ul class="sb-menu" role="menu">
        <li class="sb-group-label">{{ 'language' | componentT:'shared' }}</li>
        @for (option of locales; track option.code) {
          <li class="sb-item" role="menuitemradio" [attr.aria-checked]="option.code === locale.current" (click)="select(option.code)">
            <span>{{ option.nativeLabel }}</span>
            @if (option.code === locale.current) { <lucide-icon [img]="Check" size="13" class="lang-option__check" /> }
          </li>
        }
      </ul>
    </ng-template>
  `,
  styles: [`
    .lang-trigger { display: inline-flex; align-items: center; gap: .4rem; height: 2.1rem; padding: 0 .65rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); color: var(--color-text-secondary); background: var(--color-surface-2); font: inherit; font-size: .7rem; font-weight: 700; cursor: pointer; transition: background .16s ease, border-color .16s ease, color .16s ease; }
    .lang-trigger:hover { color: var(--color-text-primary); background: var(--color-surface-3); border-color: var(--color-accent); }
    .lang-trigger__label { white-space: nowrap; }
    .lang-trigger--compact { width: 2.1rem; padding: 0; justify-content: center; border-radius: 50%; background: transparent; border-color: transparent; }
    .lang-trigger--compact:hover { background: var(--color-surface-3); border-color: transparent; }
    .sb-menu { list-style: none; margin: 0; padding: .35rem 0; min-width: 10.5rem; color: var(--color-text-secondary); font-size: .75rem; font-family: inherit; }
    .sb-group-label { padding: .3rem .75rem .1rem; color: var(--color-text-muted); font-size: .63rem; font-weight: 700; letter-spacing: .07em; pointer-events: none; }
    .sb-item { display: flex; align-items: center; justify-content: space-between; gap: .55rem; padding: .4rem .75rem; cursor: pointer; white-space: nowrap; color: var(--color-text-secondary); transition: background 80ms, color 80ms; }
    .sb-item:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .lang-option__check { color: var(--color-accent-bright); }
  `],
})
export class LanguageSwitcherComponent {
  readonly locale = inject(LocaleService);
  readonly locales = LOCALES;
  readonly compact = input(false);
  readonly Globe = Globe;
  readonly Check = Check;

  select(code: string): void {
    this.locale.setLocale(code);
  }
}
