// src/app/features/admin/notifications/ui/an-switch.component.ts
import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Accessible on/off switch usable with formControlName or [ngModel]. */
@Component({
  selector: 'an-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AnSwitchComponent), multi: true }],
  template: `
    <button type="button" role="switch" class="sw" [class.sw--on]="value()"
      [attr.aria-checked]="value()" [attr.aria-label]="ariaLabel() || null" [disabled]="disabled()" (click)="toggle()">
      <span class="sw__knob"></span>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    .sw { position: relative; width: 2.3rem; height: 1.3rem; padding: 0; border-radius: 999px; background: var(--color-surface-3); border: 1px solid var(--color-border-strong); transition: background .18s ease, border-color .18s ease; flex: none; }
    .sw__knob { position: absolute; inset-block-start: 50%; inset-inline-start: .14rem; width: .9rem; height: .9rem; border-radius: 50%; background: var(--color-text-secondary); transform: translateY(-50%); transition: inset-inline-start .18s ease, background .18s ease; }
    .sw--on { background: var(--color-accent); border-color: var(--color-accent); }
    .sw--on .sw__knob { inset-inline-start: calc(100% - 1.04rem); background: #fff; }
    .sw:disabled { opacity: .5; cursor: not-allowed; }
    .sw:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) { .sw, .sw__knob { transition: none; } }
  `],
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
