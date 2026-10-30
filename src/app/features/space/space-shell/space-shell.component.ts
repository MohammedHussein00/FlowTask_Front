import {
  ChangeDetectionStrategy, Component, computed, inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  BrainCircuit, Calendar, ChevronDown, ChartGantt, Hash, Info,
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
            <button type="button" class="ss-tab" (click)="channelModal.show()">
              <span class="ss-chip ss-chip--plum"><lucide-icon [img]="Hash" size="11" /></span>Channel
            </button>

            <a class="ss-tab" routerLink="overview" routerLinkActive="ss-tab--active">
              <span class="ss-chip ss-chip--gray"><lucide-icon [img]="Info" size="11" /></span>Overview
            </a>
            <span class="ss-tabs__sep" aria-hidden="true"></span>
            <a class="ss-tab" routerLink="list" routerLinkActive="ss-tab--active">
              <span class="ss-chip ss-chip--gray"><lucide-icon [img]="ListTodo" size="11" /></span>List
            </a>
            <a class="ss-tab" routerLink="board" routerLinkActive="ss-tab--active">
              <span class="ss-chip ss-chip--blue"><lucide-icon [img]="LayoutDashboard" size="11" /></span>Board
            </a>
            <a class="ss-tab" routerLink="calendar" routerLinkActive="ss-tab--active">
              <span class="ss-chip ss-chip--orange"><lucide-icon [img]="Calendar" size="11" /></span>Calendar
            </a>
            <a class="ss-tab" routerLink="gantt" routerLinkActive="ss-tab--active">
              <span class="ss-chip ss-chip--red"><lucide-icon [img]="Gantt" size="11" /></span>Gantt
            </a>
            <a class="ss-tab" routerLink="team" routerLinkActive="ss-tab--active">
              <span class="ss-chip ss-chip--plum"><lucide-icon [img]="Users" size="11" /></span>Team
            </a>
            <span class="ss-tabs__sep" aria-hidden="true"></span>
            <button type="button" class="ss-tab ss-tab--add">
              <lucide-icon [img]="Plus" size="14" />View
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

    /* Tab bar: no divider line, like ClickUp's header */
    .ss-tabbar {
      display: flex; align-items: center; justify-content: space-between;
      min-height: 4.4rem; padding: 0 1rem 0 .75rem;
      flex: none; gap: .5rem;
    }
    .ss-tabbar__left { display: flex; flex-direction: column; justify-content: center; gap: .15rem; flex: 1; min-width: 0; align-self: stretch; padding-top: .45rem; }

    /* Space name button */
    .ss-space-btn {
      display: inline-flex; align-items: center; gap: .4rem; align-self: flex-start; flex: none;
      height: 2rem; padding: 0 .5rem 0 .25rem;
      border: 0; background: transparent;
      color: var(--color-text-primary); font: inherit;
      font-size: .9rem; font-weight: 600;
      cursor: pointer; border-radius: .5rem;
    }
    .ss-space-btn:hover { background: var(--color-surface-3); }
    .ss-space-btn b { font-weight: 600; }
    .ss-space-btn__badge {
      width: 1.35rem; height: 1.35rem;
      display: grid; place-items: center;
      border-radius: .35rem; color: #fff;
      font-size: .72rem; font-weight: 700; flex: none;
    }
    .ss-space-btn lucide-icon { color: var(--color-text-secondary); }
    .ss-space-btn__star { color: var(--color-text-secondary); margin-inline-start: .15rem; }

    /* Tabs */
    .ss-tabs { display: flex; align-items: flex-end; overflow: hidden; gap: .05rem; }
    .ss-tabs__sep { width: 1px; height: 1.1rem; align-self: center; margin: 0 .35rem; background: var(--color-border-strong); flex: none; }
    .ss-tab {
      display: inline-flex; align-items: center; gap: .4rem;
      height: 2.1rem; padding: 0 .5rem;
      border: 0; border-bottom: 2px solid transparent;
      background: transparent; color: var(--color-text-secondary);
      font: inherit; font-size: .8rem; font-weight: 500;
      white-space: nowrap; cursor: pointer;
      text-decoration: none;
      transition: color .12s;
    }
    .ss-tab:hover { color: var(--color-text-primary); }
    .ss-tab--active {
      color: var(--color-text-primary) !important;
      border-bottom-color: var(--color-text-primary) !important;
    }
    .ss-tab--add lucide-icon { color: var(--color-text-secondary); }

    /* Coloured icon chips in front of each view */
    .ss-chip { width: 1.1rem; height: 1.1rem; display: inline-grid; place-items: center; flex: none; border-radius: .3rem; color: #fff; }
    .ss-chip--gray   { background: var(--cu-gray); }
    .ss-chip--plum   { background: var(--cu-plum); }
    .ss-chip--blue   { background: var(--cu-blue); }
    .ss-chip--orange { background: var(--cu-orange); }
    .ss-chip--red    { background: var(--cu-red); }

    /* Right actions: plain text buttons, no accent-filled Share */
    .ss-tabbar__right { flex: none; display: flex; align-items: center; gap: .1rem; align-self: flex-start; padding-top: .45rem; }
    .ss-action {
      height: 2rem; display: inline-flex; align-items: center; gap: .4rem;
      padding: 0 .6rem; border: 0; border-radius: .5rem;
      background: transparent; color: var(--color-text-secondary);
      font: inherit; font-size: .82rem; font-weight: 600;
      white-space: nowrap; cursor: pointer;
    }
    .ss-action:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .ss-action--icon { width: 2rem; padding: 0; justify-content: center; }
    .ss-action--share { color: var(--color-text-primary); }
    .ss-action lucide-icon { color: var(--color-text-secondary); }
    .ss-action:hover lucide-icon { color: var(--color-text-primary); }
    .ss-action sup { font-size: .6rem; margin-inline-start: -.2rem; }

    .ss-content { flex: 1; overflow: hidden; position: relative; }

    @media (max-width: 1024px) { .ss-tabbar__right { display: none; } }
    @media (max-width: 700px) {
      .ss-tabbar { min-height: 3.6rem; overflow-x: auto; padding-inline: .65rem; }
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
  readonly Hash = Hash; readonly Info = Info;

  private readonly ctx = inject(SpaceContextService);
  readonly channelModal = inject(ChannelModalService);

  readonly spaceName    = this.ctx.spaceName;
  readonly spaceColor   = this.ctx.spaceColor;
  readonly spaceInitial = computed(() =>
    this.spaceName().trim().charAt(0).toUpperCase() || 'S'
  );
}
