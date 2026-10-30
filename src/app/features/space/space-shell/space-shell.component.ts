import {
  ChangeDetectionStrategy, Component, computed, inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  BrainCircuit, Calendar, ChevronDown, ChartGantt,
  LayoutDashboard, Link2, ListTodo, Phone, Plus,
  Share2, Star, Users, Workflow,
} from 'lucide-angular';
import { SpaceContextService } from '../space-context.service';
import { ChannelModalService } from '../../../core/services/channel-modal.service';

@Component({
  selector: 'app-space-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ss-shell">

      <!-- ── Space tab bar ── -->
      <header class="ss-tabbar">
        <div class="ss-tabbar__left">

          <button type="button" class="ss-space-btn">
            <span class="ss-space-btn__badge" [style.background]="spaceColor()">{{ spaceInitial() }}</span>
            <b>{{ spaceName() }}</b>
            <lucide-icon [img]="ChevronDown" size="14" />
            <lucide-icon class="ss-space-btn__star" [img]="Star" size="14" />
          </button>

          <nav class="ss-tabs">
            <button type="button" class="ss-tab ss-tab--channel" (click)="channelModal.show()">Add Channel</button>

            <a class="ss-tab" routerLink="overview" routerLinkActive="ss-tab--active">
              Overview
            </a>
            <a class="ss-tab" routerLink="list" routerLinkActive="ss-tab--active">
              <lucide-icon [img]="ListTodo" size="13" />List
            </a>
            <a class="ss-tab" routerLink="board" routerLinkActive="ss-tab--active">
              <lucide-icon [img]="LayoutDashboard" size="13" />Board
            </a>
            <a class="ss-tab" routerLink="calendar" routerLinkActive="ss-tab--active">
              <lucide-icon [img]="Calendar" size="13" />Calendar
            </a>
            <a class="ss-tab" routerLink="gantt" routerLinkActive="ss-tab--active">
              <lucide-icon [img]="Gantt" size="13" />Gantt
            </a>
            <a class="ss-tab" routerLink="team" routerLinkActive="ss-tab--active">
              <lucide-icon [img]="Users" size="13" />Team
            </a>
            <button type="button" class="ss-tab">
              <lucide-icon [img]="Plus" size="13" />View
            </button>
          </nav>
        </div>

        <div class="ss-tabbar__right">
          <button type="button" class="ss-action">
            <lucide-icon [img]="Phone" size="14" />Call
            <lucide-icon [img]="ChevronDown" size="12" />
          </button>
          <button type="button" class="ss-action ss-action--icon" aria-label="Connections">
            <lucide-icon [img]="Link2" size="15" />
          </button>
          <button type="button" class="ss-action">
            <lucide-icon [img]="Workflow" size="14" />Automate
          </button>
          <button type="button" class="ss-action">
            <lucide-icon [img]="BrainCircuit" size="14" />Brain<sup>2</sup>
          </button>
          <button type="button" class="ss-action ss-action--share">
            <lucide-icon [img]="Share2" size="14" />Share
          </button>
        </div>
      </header>

      <div class="ss-content">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .ss-shell {
      display: flex; flex-direction: column; height: 100%;
      background: var(--color-canvas); color: var(--color-text-primary);
    }

    /* Tab bar */
    .ss-tabbar {
      display: flex; align-items: center; justify-content: space-between;
      min-height: 3.6rem; padding: 0 .95rem;
      border-bottom: 1px solid var(--color-border);
      flex: none; gap: .5rem;
    }
    .ss-tabbar__left {
      display: flex; align-items: flex-end;
      flex: 1; min-width: 0; overflow: hidden;
    }

    /* Space name button */
    .ss-space-btn {
      display: inline-flex; align-items: center; gap: .32rem; flex: none;
      height: 2.1rem; padding: 0 .4rem 0 .2rem;
      border: 0; background: transparent;
      color: var(--color-text-primary); font: inherit;
      font-size: .74rem; font-weight: 700;
      cursor: pointer; border-radius: .35rem; margin-bottom: .15rem;
    }
    .ss-space-btn:hover { background: var(--color-surface-3); }
    .ss-space-btn__badge {
      width: 1.15rem; height: 1.15rem;
      display: grid; place-items: center;
      border-radius: .3rem; color: #fff;
      font-size: .6rem; font-weight: 800; flex: none;
    }
    .ss-space-btn__star { color: var(--color-text-muted); }

    /* Tabs */
    .ss-tabs { display: flex; align-items: flex-end; overflow: hidden; }
    .ss-tab {
      display: inline-flex; align-items: center; gap: .3rem;
      height: 2.05rem; padding: 0 .5rem;
      border: 0; border-bottom: 2px solid transparent;
      background: transparent; color: var(--color-text-muted);
      font: inherit; font-size: .69rem; font-weight: 600;
      white-space: nowrap; cursor: pointer;
      text-decoration: none;
      transition: color .12s;
    }
    .ss-tab:hover { color: var(--color-text-primary); }
    .ss-tab--channel {
      align-self: flex-start; height: 1.8rem; margin-top: .5rem;
      padding: 0 .4rem; border: 1px solid var(--color-border-strong);
      border-radius: .32rem; margin-inline-end: .25rem; font-size: .67rem;
    }
    .ss-tab--active {
      color: var(--color-text-primary) !important;
      border-bottom-color: var(--color-accent) !important;
    }

    /* Right actions */
    .ss-tabbar__right { flex: none; display: flex; align-items: center; gap: .2rem; }
    .ss-action {
      height: 1.8rem; display: inline-flex; align-items: center; gap: .28rem;
      padding: 0 .5rem; border: 0; border-radius: .35rem;
      background: transparent; color: var(--color-text-muted);
      font: inherit; font-size: .68rem; font-weight: 600;
      white-space: nowrap; cursor: pointer;
    }
    .ss-action:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .ss-action--icon { width: 1.8rem; padding: 0; }
    .ss-action--share { color: #fff; background: var(--color-accent); }
    .ss-action--share:hover { background: color-mix(in srgb, var(--color-accent) 80%, #000); }
    .ss-action sup { font-size: .55rem; }

    .ss-content { flex: 1; overflow: hidden; position: relative; }

    @media (max-width: 1024px) { .ss-tabbar__right { display: none; } }
    @media (max-width: 700px) {
      .ss-tabbar { min-height: 3rem; overflow-x: auto; padding-inline: .65rem; }
    }
  `],
})
export class SpaceShellComponent {
  readonly ChevronDown = ChevronDown; readonly Star = Star;
  readonly ListTodo = ListTodo; readonly LayoutDashboard = LayoutDashboard;
  readonly Calendar = Calendar; readonly Gantt = ChartGantt;
  readonly Users = Users; readonly Plus = Plus;
  readonly Phone = Phone; readonly Link2 = Link2;
  readonly Workflow = Workflow; readonly BrainCircuit = BrainCircuit;
  readonly Share2 = Share2;

  private readonly ctx = inject(SpaceContextService);
  readonly channelModal = inject(ChannelModalService);

  readonly spaceName    = this.ctx.spaceName;
  readonly spaceColor   = this.ctx.spaceColor;
  readonly spaceInitial = computed(() =>
    this.spaceName().trim().charAt(0).toUpperCase() || 'S'
  );
}
