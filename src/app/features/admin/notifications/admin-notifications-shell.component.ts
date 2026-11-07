// src/app/features/admin/notifications/admin-notifications-shell.component.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BookOpen, BellRing, LayoutDashboard, ListChecks, LucideAngularModule, Plus } from 'lucide-angular';
import { AnConfirmHostComponent } from './ui/an-confirm-host.component';
import { AnTPipe } from './utils/an-i18n';

/** Frame for every notification-admin page: header, section tabs, and the shared confirm dialog. */
@Component({
  selector: 'app-admin-notifications-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, AnTPipe, AnConfirmHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <header class="head">
        <div class="head__title">
          <span class="head__mark" aria-hidden="true"><lucide-icon [img]="BellRing" size="22" /></span>
          <div>
            <p class="head__eyebrow">{{ 'shell.eyebrow' | anT }}</p>
            <h1>{{ 'shell.title' | anT }}</h1>
            <p class="head__sub">{{ 'shell.subtitle' | anT }}</p>
          </div>
        </div>
        <a class="cta" routerLink="/admin/notifications/triggers/new">
          <lucide-icon [img]="Plus" size="16" /> {{ 'shell.newTrigger' | anT }}
        </a>
      </header>

      <nav class="tabs" [attr.aria-label]="'shell.navLabel' | anT">
        <a class="tab" routerLink="/admin/notifications/overview" routerLinkActive="tab--on" ariaCurrentWhenActive="page">
          <lucide-icon [img]="LayoutDashboard" size="16" /> {{ 'shell.tabOverview' | anT }}
        </a>
        <a class="tab" routerLink="/admin/notifications/triggers" routerLinkActive="tab--on" ariaCurrentWhenActive="page">
          <lucide-icon [img]="ListChecks" size="16" /> {{ 'shell.tabTriggers' | anT }}
        </a>
        <a class="tab" routerLink="/admin/notifications/guide" routerLinkActive="tab--on" ariaCurrentWhenActive="page">
          <lucide-icon [img]="BookOpen" size="16" /> {{ 'shell.tabGuide' | anT }}
        </a>
      </nav>

      <router-outlet />
    </div>
    <an-confirm-host />
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; color: var(--color-text-primary); background: var(--color-canvas); }
    .wrap { width: 100%; max-width: 80rem; margin: 0 auto; padding: 1.5rem 1.5rem 3.5rem; }
    .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .head__title { display: flex; align-items: center; gap: .9rem; min-width: 0; }
    .head__mark { display: grid; place-items: center; flex: none; width: 3rem; height: 3rem; border-radius: .9rem; color: #fff;
      background: linear-gradient(135deg, var(--color-accent), var(--color-accent-strong)); box-shadow: 0 .5rem 1.4rem color-mix(in srgb, var(--color-accent) 35%, transparent); }
    .head__eyebrow { margin: 0 0 .1rem; font-size: .68rem; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; color: var(--color-accent-bright); }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -.01em; }
    .head__sub { margin: .2rem 0 0; max-width: 38rem; font-size: .83rem; line-height: 1.5; color: var(--color-text-secondary); }
    .cta { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.45rem; padding: 0 1.05rem; border-radius: var(--radius-md); color: #fff; background: var(--color-accent);
      font-size: .82rem; font-weight: 750; text-decoration: none; transition: background .16s ease, transform .16s ease; }
    .cta:hover { background: var(--color-accent-strong); transform: translateY(-1px); }
    .tabs { display: flex; gap: .3rem; margin: 1.35rem 0 1.4rem; padding-bottom: .1rem; border-bottom: 1px solid var(--color-border); overflow-x: auto; scrollbar-width: none; }
    .tab { position: relative; display: inline-flex; align-items: center; gap: .45rem; padding: .7rem .95rem; color: var(--color-text-secondary); font-size: .82rem; font-weight: 700; text-decoration: none; white-space: nowrap; border-radius: .5rem .5rem 0 0; transition: color .15s ease, background .15s ease; }
    .tab:hover { color: var(--color-text-primary); background: var(--color-surface-2); }
    .tab--on { color: var(--color-text-primary); }
    .tab--on::after { content: ''; position: absolute; inset-inline: .6rem; inset-block-end: -1px; height: 2px; border-radius: 2px; background: var(--color-accent); }
    @media (max-width: 640px) { .wrap { padding: 1rem 1rem 3rem; } h1 { font-size: 1.25rem; } .cta { width: 100%; justify-content: center; } }
  `],
})
export class AdminNotificationsShellComponent {
  readonly BellRing = BellRing;
  readonly BookOpen = BookOpen;
  readonly LayoutDashboard = LayoutDashboard;
  readonly ListChecks = ListChecks;
  readonly Plus = Plus;
}
