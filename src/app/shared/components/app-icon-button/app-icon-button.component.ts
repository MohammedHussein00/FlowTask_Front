import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="icon-button" [attr.aria-label]="label()" [title]="label()" [disabled]="disabled()" type="button">
      <ng-content />
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    .icon-button { width: 2.15rem; height: 2.15rem; display: inline-grid; place-items: center; border: 1px solid transparent; border-radius: var(--radius-sm); color: var(--color-text-secondary); background: transparent; cursor: pointer; font: inherit; transition: background .16s ease, color .16s ease; }
    .icon-button:hover:not(:disabled) { color: var(--color-text-primary); background: var(--color-surface-3); }
    .icon-button:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
    .icon-button:disabled { opacity: .45; cursor: not-allowed; }
  `],
})
export class AppIconButtonComponent {
  readonly label = input.required<string>();
  readonly disabled = input(false);
}
