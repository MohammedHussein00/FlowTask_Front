// src/app/features/admin/notifications/ui/an-field/an-field.component.ts
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { AnI18n } from '../../utils/an-i18n';
import { validationMessage } from '../../utils/validation-messages';

/**
 * Label + projected input + hint/error line. Shows the first validation message once the control is
 * touched/dirty (or `forceShow` after a failed submit). `extraError` lets the parent surface group-level errors.
 */
@Component({
  selector: 'an-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './an-field.component.html',
  styleUrl: './an-field.component.scss',
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
