// src/app/features/admin/notifications/ui/an-segmented/an-segmented.component.ts
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
  templateUrl: './an-segmented.component.html',
  styleUrl: './an-segmented.component.scss',
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
