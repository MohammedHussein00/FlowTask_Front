// src/app/features/admin/notifications/ui/an-confirm-host.component.ts
import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'an-confirm-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (confirm.pending(); as p) {
      <div class="backdrop" (click)="confirm.answer(false)">
        <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="an-confirm-title" aria-describedby="an-confirm-msg"
          (click)="$event.stopPropagation()">
          <h2 id="an-confirm-title" class="dialog__title">{{ p.options.title }}</h2>
          <p id="an-confirm-msg" class="dialog__msg">{{ p.options.message }}</p>
          <div class="dialog__actions">
            <button type="button" class="btn btn--ghost" autofocus (click)="confirm.answer(false)">{{ p.options.cancelLabel }}</button>
            <button type="button" class="btn" [class.btn--danger]="p.options.tone === 'danger'" (click)="confirm.answer(true)">{{ p.options.confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .backdrop { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; padding: 1rem; background: rgb(8 9 12 / .62); backdrop-filter: blur(3px); animation: fade .15s ease both; }
    .dialog { width: min(26rem, 100%); padding: 1.25rem 1.3rem 1.1rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-lg); background: var(--color-surface-1); box-shadow: var(--shadow-lg); animation: pop .18s ease both; }
    .dialog__title { margin: 0 0 .45rem; font-size: 1.02rem; font-weight: 800; color: var(--color-text-primary); }
    .dialog__msg { margin: 0; font-size: .84rem; line-height: 1.55; color: var(--color-text-secondary); }
    .dialog__actions { display: flex; justify-content: flex-end; gap: .55rem; margin-top: 1.2rem; }
    .btn { min-height: 2.25rem; padding: 0 1rem; border-radius: var(--radius-md); color: #fff; background: var(--color-accent); font-size: .8rem; font-weight: 700; }
    .btn:hover { background: var(--color-accent-strong); }
    .btn--danger { background: var(--color-danger); }
    .btn--danger:hover { filter: brightness(.92); background: var(--color-danger); }
    .btn--ghost { color: var(--color-text-secondary); background: transparent; border: 1px solid var(--color-border-strong); }
    .btn--ghost:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    @keyframes fade { from { opacity: 0; } }
    @keyframes pop { from { opacity: 0; transform: translateY(.4rem) scale(.98); } }
    @media (prefers-reduced-motion: reduce) { .backdrop, .dialog { animation: none; } }
  `],
})
export class AnConfirmHostComponent {
  readonly confirm = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.confirm.pending()) this.confirm.answer(false); }
}
