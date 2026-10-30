import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Hash, Lock, Plus } from 'lucide-angular';
import { ComponentTranslatePipe } from '../../../../core/i18n/component-translate.pipe';
import { ChannelSnapshot } from '../../../../core/stores/channel.store';

@Component({
  selector: 'app-channels-section',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, ComponentTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nav-section channels">
      <p>{{ 'channels' | componentT:'sidebar' }}</p>
      <a class="context-nav__item" routerLink="/channels/welcome" routerLinkActive="context-nav__item--active">
        <lucide-icon [img]="Hash" size="16"/><span>{{ 'welcome' | componentT:'sidebar' }}</span>
      </a>
      <a class="context-nav__item" routerLink="/channels/general" routerLinkActive="context-nav__item--active">
        <b class="channel-dot">f</b>
        <span>{{ 'general' | componentT:'sidebar' }} <em>· {{ workspaceName() }}</em></span>
      </a>

      @for (channel of channels(); track channel.id) {
        <a class="context-nav__item" [routerLink]="['/channels', channel.id]" routerLinkActive="context-nav__item--active">
          <b class="channel-dot" [style.background]="channel.color">
            @if (channel.isPrivate) { <lucide-icon [img]="Lock" size="10"/> } @else { {{ channel.name.charAt(0).toUpperCase() }} }
          </b>
          <span>{{ channel.name }} <em>· {{ workspaceName() }}</em></span>
        </a>
      }

      <button class="context-nav__item context-nav__item--muted" type="button" (click)="addChannel.emit()">
        <lucide-icon [img]="Plus" size="16"/><span>{{ 'addChannel' | componentT:'sidebar' }}</span>
      </button>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .nav-section { margin: .7rem 0; }
    .nav-section p { margin: 0 0 .3rem .6rem; color: var(--color-text-secondary); font-size: .75rem; font-weight: 600; }
    .context-nav__item { width: 100%; min-height: 2rem; display: flex; align-items: center; gap: .6rem; padding: 0 .6rem; border: 0; border-radius: .5rem; color: var(--color-text-secondary); background: transparent; font: inherit; font-size: .8125rem; font-weight: 500; text-align: start; text-decoration: none; cursor: pointer; }
    .context-nav__item:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .context-nav__item--active { color: var(--color-text-primary); background: var(--color-surface-3); }
    .context-nav__item em { color: var(--color-text-muted); font-size: .72rem; font-style: normal; }
    .context-nav__item--muted { color: var(--color-text-muted); }
    .context-nav__item--muted:hover { color: var(--color-text-secondary); }
    .context-nav__item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .channel-dot { flex: none; width: 1rem; height: 1rem; display: grid; place-items: center; border-radius: 50%; color: #fff; background: #16a883; font-size: .59rem; font-weight: 700; }
  `],
})
export class ChannelsSectionComponent {
  readonly Hash = Hash;
  readonly Lock = Lock;
  readonly Plus = Plus;
  readonly workspaceName = input('');
  readonly channels = input<ChannelSnapshot[]>([]);
  readonly addChannel = output<void>();
}
