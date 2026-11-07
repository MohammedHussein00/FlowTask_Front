// src/app/features/admin/notifications/ui/an-field.component.ts
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { AnI18n } from '../utils/an-i18n';
import { validationMessage } from '../utils/validation-messages';

/**
 * Label + projected input + hint/error line. Shows the first validation message once the control is
 * touched/dirty (or `forceShow` after a failed submit). `extraError` lets the parent surface group-level errors.
 */
@Component({
  selector: 'an-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field" [class.field--invalid]="!!message()">
      @if (label()) {
        <label class="field__label" [attr.for]="forId() || null">
          {{ label() }}@if (required()) { <span class="field__req" aria-hidden="true">*</span> }
          @if (optional()) { <span class="field__opt">{{ optionalText() }}</span> }
        </label>
      }
      <ng-content />
      @if (message()) {
        <p class="field__error" role="alert">{{ message() }}</p>
      } @else if (hint()) {
        <p class="field__hint">{{ hint() }}</p>
      }
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .field { display: grid; gap: .38rem; }
    .field__label { font-size: .75rem; font-weight: 700; color: var(--color-text-secondary); letter-spacing: .01em; }
    .field__req { margin-inline-start: .2rem; color: var(--color-danger-text); }
    .field__opt { margin-inline-start: .4rem; font-weight: 500; color: var(--color-text-muted); }
    .field__hint { margin: 0; font-size: .72rem; line-height: 1.45; color: var(--color-text-muted); }
    .field__error { margin: 0; font-size: .74rem; line-height: 1.4; font-weight: 600; color: var(--color-danger-text); }
  `],
})
export class AnFieldComponent {
  private readonly i18n = inject(AnI18n);

  readonly label = input('');
  readonly hint = input('');
  readonly forId = input('');
  readonly required = input(false);
  readonly optional = input(false);
  readonly control = input<AbstractControl | null>(null);
  readonly forceShow = input(false);
  readonly extraError = input('');

  private readonly tick = signal(0);
  readonly optionalText = computed(() => this.i18n.t('common.optional'));

  constructor() {
    effect(onCleanup => {
      const c = this.control();
      if (!c) return;
      const sub = c.events.subscribe(() => this.tick.update(v => v + 1));
      onCleanup(() => sub.unsubscribe());
    });
  }

  readonly message = computed(() => {
    this.tick();
    if (this.extraError()) return this.extraError();
    const c = this.control();
    if (!c?.errors) return '';
    if (!(c.touched || c.dirty || this.forceShow())) return '';
    return validationMessage(c.errors, this.i18n);
  });
}
