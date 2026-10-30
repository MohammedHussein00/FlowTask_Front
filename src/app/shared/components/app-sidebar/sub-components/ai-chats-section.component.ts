import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, MessageSquareText, Plus } from 'lucide-angular';
import { ComponentTranslatePipe } from '../../../../core/i18n/component-translate.pipe';

@Component({
  selector: 'app-ai-chats-section',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, ComponentTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nav-section ai-chats">
      <p>{{ 'aiChats' | componentT:'sidebar' }}</p>
      <a class="context-nav__item" routerLink="/ai-chats/personal-onboarding" routerLinkActive="context-nav__item--active">
        <lucide-icon [img]="MessageSquareText" size="16"/>
        <span>{{ 'personalOnboarding' | componentT:'sidebar' }}</span>
      </a>
      <a class="context-nav__item context-nav__item--muted" routerLink="/ai-chats/new">
        <lucide-icon [img]="Plus" size="16"/>
        <span>{{ 'askBuildCreate' | componentT:'sidebar' }}</span>
      </a>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .nav-section { margin: .7rem 0; }
    .nav-section p { margin: 0 0 .3rem .6rem; color: var(--color-text-secondary); font-size: .84rem; font-weight: 600; }
    .context-nav__item { width: 100%; min-height: 2.1rem; display: flex; align-items: center; gap: .65rem; padding: 0 .6rem; border: 0; border-radius: .5rem; color: var(--color-text-secondary); background: transparent; font: inherit; font-size: .875rem; font-weight: 500; text-align: start; text-decoration: none; cursor: pointer; }
    .context-nav__item:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .context-nav__item--active { color: var(--color-text-primary); background: var(--color-surface-3); }
    .context-nav__item--muted { color: var(--color-text-muted); }
    .context-nav__item--muted:hover { color: var(--color-text-secondary); }
  `],
})
export class AiChatsSectionComponent {
  readonly MessageSquareText = MessageSquareText;
  readonly Plus = Plus;
}
