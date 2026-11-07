// src/app/features/admin/notifications/ui/an-segmented.component.ts
import { ChangeDetectionStrategy, Component, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule, type LucideIconData } from 'lucide-angular';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
  icon?: LucideIconData;
}

/** Radio-group look-alike. `cards` variant shows icon + hint (used for trigger type); `pills` is the compact filter style. */
@Component({
  selector: 'an-segmented',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AnSegmentedComponent), multi: true }],
  template: `
    <div class="seg" [class.seg--cards]="variant() === 'cards'" role="radiogroup" [attr.aria-label]="ariaLabel() || null">
      @for (o of options(); track o.value) {
        <button type="button" role="radio" class="seg__item" [class.seg__item--on]="o.value === value()"
          [attr.aria-checked]="o.value === value()" [disabled]="disabled()" (click)="select(o.value)">
          @if (o.icon) { <lucide-icon class="seg__icon" [img]="o.icon" size="17" /> }
          <span class="seg__text">
            <span class="seg__label">{{ o.label }}</span>
            @if (variant() === 'cards' && o.hint) { <span class="seg__hint">{{ o.hint }}</span> }
          </span>
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .seg { display: inline-flex; flex-wrap: wrap; gap: .25rem; padding: .22rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-2); }
    .seg__item { display: inline-flex; align-items: center; gap: .4rem; min-height: 2rem; padding: 0 .75rem; border-radius: calc(var(--radius-md) - .15rem); color: var(--color-text-secondary); font-size: .78rem; font-weight: 650; transition: background .15s ease, color .15s ease; }
    .seg__item:hover:not(:disabled):not(.seg__item--on) { color: var(--color-text-primary); background: var(--color-surface-3); }
    .seg__item--on { color: #fff; background: var(--color-accent); }
    .seg__item:disabled { opacity: .55; cursor: not-allowed; }
    .seg__item:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 1px; }
    .seg__text { display: grid; text-align: start; }

    .seg--cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: .6rem; padding: 0; border: 0; background: none; }
    .seg--cards .seg__item { align-items: flex-start; gap: .75rem; min-height: 4.2rem; padding: .85rem .95rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-1); color: var(--color-text-primary); }
    .seg--cards .seg__item:hover:not(:disabled):not(.seg__item--on) { background: var(--color-surface-2); border-color: var(--color-border-strong); }
    .seg--cards .seg__item--on { background: var(--color-accent-soft); border-color: var(--color-accent); color: var(--color-text-primary); }
    .seg--cards .seg__icon { margin-block-start: .1rem; color: var(--color-accent-bright); }
    .seg--cards .seg__label { font-size: .85rem; font-weight: 750; }
    .seg__hint { margin-block-start: .15rem; font-size: .72rem; font-weight: 500; line-height: 1.4; color: var(--color-text-secondary); }
  `],
})
export class AnSegmentedComponent<T extends string = string> implements ControlValueAccessor {
  readonly options = input.required<readonly SegmentOption<T>[]>();
  readonly variant = input<'pills' | 'cards'>('pills');
  readonly ariaLabel = input('');
  readonly changed = output<T>();

  readonly value = signal<string | null>(null);
  readonly disabled = signal(false);

  private onChange: (v: T) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(v: T | null): void { this.value.set(v); }
  registerOnChange(fn: (v: T) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }

  select(v: T): void {
    this.value.set(v);
    this.onChange(v);
    this.onTouched();
    this.changed.emit(v);
  }
}
