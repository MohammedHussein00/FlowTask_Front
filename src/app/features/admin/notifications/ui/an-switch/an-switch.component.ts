// src/app/features/admin/notifications/ui/an-switch/an-switch.component.ts
import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Accessible on/off switch usable with formControlName or [ngModel]. */
@Component({
  selector: 'an-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AnSwitchComponent), multi: true }],
  templateUrl: './an-switch.component.html',
  styleUrl: './an-switch.component.scss',
})
export class AnSwitchComponent implements ControlValueAccessor {
  readonly ariaLabel = input('');
  readonly value = signal(false);
  readonly disabled = signal(false);

  private onChange: (v: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(v: boolean | null): void { this.value.set(!!v); }
  registerOnChange(fn: (v: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }

  toggle(): void {
    if (this.disabled()) return;
    this.value.update(v => !v);
    this.onChange(this.value());
    this.onTouched();
  }
}
