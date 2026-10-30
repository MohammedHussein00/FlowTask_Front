import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="button"
      [class]="'button button--' + variant()"
      [class.button--loading]="loading()"
      [disabled]="disabled() || loading()"
      [type]="type()"
    >
      @if (loading()) { <span class="button__spinner" aria-hidden="true"></span> }
      <span [class.button__content--hidden]="loading()"><ng-content /></span>
    </button>
  `,
  styles: [`
    :host { display: block; }
    .button { width: 100%; min-height: 2.5rem; display: inline-flex; align-items: center; justify-content: center; gap: .5rem; border: 1px solid transparent; border-radius: var(--radius-md); padding: 0 1rem; font: inherit; font-size: .875rem; font-weight: 650; cursor: pointer; transition: background .16s ease, border-color .16s ease, transform .16s ease, opacity .16s ease; }
    .button:hover:not(:disabled) { transform: translateY(-1px); }
    .button:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
    .button:disabled { cursor: not-allowed; opacity: .58; }
    .button--primary { color: #fff; background: var(--color-accent); }
    .button--primary:hover:not(:disabled) { background: var(--color-accent-strong); }
    .button--secondary { color: var(--color-text-primary); background: var(--color-surface-2); border-color: var(--color-border-strong); }
    .button--secondary:hover:not(:disabled), .button--ghost:hover:not(:disabled) { background: var(--color-surface-3); }
    .button--ghost { color: var(--color-text-secondary); background: transparent; }
    .button--danger { color: #fff; background: var(--color-danger); }
    .button__content--hidden { visibility: hidden; }
    .button__spinner { position: absolute; width: 1rem; height: 1rem; border: 2px solid rgb(255 255 255 / .35); border-top-color: currentColor; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class AppButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'ghost' | 'danger'>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
}
