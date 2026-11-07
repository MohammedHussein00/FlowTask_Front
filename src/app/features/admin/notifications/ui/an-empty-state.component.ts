// src/app/features/admin/notifications/ui/an-empty-state.component.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, type LucideIconData } from 'lucide-angular';

@Component({
  selector: 'an-empty-state',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <span class="empty__icon" [class.empty__icon--danger]="tone() === 'danger'"><lucide-icon [img]="icon()" size="26" /></span>
      <h3 class="empty__title">{{ title() }}</h3>
      @if (text()) { <p class="empty__text">{{ text() }}</p> }
      <div class="empty__actions"><ng-content /></div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .empty { display: grid; justify-items: center; gap: .55rem; padding: 3rem 1.25rem; text-align: center; }
    .empty__icon { display: grid; place-items: center; width: 3.4rem; height: 3.4rem; border-radius: 1rem; color: var(--color-accent-bright); background: var(--color-accent-soft); }
    .empty__icon--danger { color: var(--color-danger-text); background: var(--color-danger-soft); }
    .empty__title { margin: .3rem 0 0; font-size: 1rem; font-weight: 750; color: var(--color-text-primary); }
    .empty__text { margin: 0; max-width: 30rem; font-size: .82rem; line-height: 1.55; color: var(--color-text-secondary); }
    .empty__actions { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; margin-top: .5rem; }
    .empty__actions:empty { display: none; }
  `],
})
export class AnEmptyStateComponent {
  readonly icon = input.required<LucideIconData>();
  readonly title = input.required<string>();
  readonly text = input('');
  readonly tone = input<'accent' | 'danger'>('accent');
}
