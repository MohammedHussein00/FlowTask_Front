import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { ComponentTranslatePipe } from '../../../../core/i18n/component-translate.pipe';

@Component({
  selector: 'app-direct-messages-section',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, ComponentTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nav-section direct-messages">
      <p>{{ 'directMessages' | componentT:'sidebar' }}</p>
      <a class="context-nav__item" routerLink="/messages/mohammed-hussein">
        <b class="dm-avatar">M</b><span>Mohammed Hussein</span>
      </a>
      <a class="context-nav__item" routerLink="/messages/muhammad-hussein">
        <b class="dm-avatar">M</b><span>Muhammad Hussein ...</span>
      </a>
      <button class="context-nav__item context-nav__item--muted" type="button" (click)="newMessage.emit()">
        <lucide-icon [img]="Plus" size="16"/><span>{{ 'newMessage' | componentT:'sidebar' }}</span>
      </button>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .nav-section { margin: .55rem 0; }
    .nav-section p { margin: 0 0 .35rem .55rem; color: var(--color-text-muted); font-size: .61rem; font-weight: 800; letter-spacing: .08em; }
    .context-nav__item { width: 100%; min-height: 1.9rem; display: flex; align-items: center; gap: .55rem; padding: 0 .55rem; border: 0; border-radius: .35rem; color: var(--color-text-secondary); background: transparent; font: inherit; font-size: .75rem; font-weight: 520; text-align: start; text-decoration: none; cursor: pointer; }
    .context-nav__item:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .context-nav__item--muted { color: var(--color-text-muted); }
    .dm-avatar { width: 1rem; height: 1rem; display: grid; place-items: center; border-radius: 50%; color: #fff; background: var(--color-accent-strong); font-size: .59rem; }
  `],
})
export class DirectMessagesSectionComponent {
  readonly Plus = Plus;
  readonly newMessage = output<void>();
}
