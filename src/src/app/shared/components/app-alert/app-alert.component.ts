import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alert" [class]="'alert alert--' + kind()" role="alert">
      <span class="alert__icon" aria-hidden="true">{{ icon }}</span>
      <p class="alert__message">{{ message() }}</p>
    </section>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .alert { display: flex; align-items: flex-start; gap: .625rem; padding: .75rem .875rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); color: var(--color-text-primary); background: var(--color-surface-2); font-size: .8125rem; }
    .alert--error { color: var(--color-danger-text); background: var(--color-danger-soft); border-color: var(--color-danger-border); }
    .alert--success { color: var(--color-success-text); background: var(--color-success-soft); border-color: var(--color-success-border); }
    .alert--warning { color: var(--color-warning-text); background: var(--color-warning-soft); border-color: var(--color-warning-border); }
    .alert__icon { flex: 0 0 auto; font-weight: 700; }
    .alert__message { margin: 0; line-height: 1.45; }
  `],
})
export class AppAlertComponent {
  readonly message = input.required<string>();
  readonly kind = input<'info' | 'success' | 'warning' | 'error'>('error');
  get icon(): string { return this.kind() === 'success' ? '✓' : this.kind() === 'warning' ? '!' : this.kind() === 'info' ? 'i' : '×'; }
}
