import {
  ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule,
  AtSign, Grid2X2, ListChecks, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Plus,
  Rss, Search, Send, Settings2, SlidersHorizontal,
} from 'lucide-angular';
import { NzButtonModule }  from 'ng-zorro-antd/button';
import { NzMenuModule }    from 'ng-zorro-antd/menu';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { SpaceStore }                    from '../../../core/stores/space.store';
import { SpaceService }                  from '../../../core/services/space.service';
import { ChannelStore }                  from '../../../core/stores/channel.store';
import { WorkspaceStore }                from '../../../core/stores/workspace.store';
import { WorkspaceCustomizationService } from '../../../core/theme/workspace-customization.service';
import { ComponentTranslatePipe }        from '../../../core/i18n/component-translate.pipe';

import { AiChatsSectionComponent }        from './sub-components/ai-chats-section.component';
import { ChannelsSectionComponent }       from './sub-components/channels-section.component';
import { DirectMessagesSectionComponent } from './sub-components/direct-messages-section.component';
import { SpacesSectionComponent }         from './sub-components/spaces-section.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive, LucideAngularModule, ComponentTranslatePipe,
    NzButtonModule, NzMenuModule, NzPopoverModule, NzTooltipModule,
    AiChatsSectionComponent, ChannelsSectionComponent,
    DirectMessagesSectionComponent, SpacesSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <aside class="context-sidebar" [class.context-sidebar--collapsed]="collapsed()">

    <!-- ── Top bar: workspace label + +Create ── -->
    <div class="context-top">
      <span class="sidebar-home-label">Home</span>
      <button nz-button nzType="primary" nzSize="small" class="create" (click)="createRequested.emit()">
        <lucide-icon [img]="Plus" size="15"/><span>{{ 'create' | componentT:'sidebar' }}</span>
      </button>
    </div>

    <!-- Scrollable region -->
    <div class="context-scroll">
      <ul nz-menu nzMode="inline" [nzInlineCollapsed]="collapsed()" class="home-menu">
        @for (item of checkedHomeItems(); track item.id) {
          <li nz-menu-item [routerLink]="item.route" routerLinkActive="ant-menu-item-selected">
            <lucide-icon [img]="item.icon" size="16"/><span>{{ item.label }}</span>
          </li>
        }
      </ul>

      <!-- "More" button — opens inline popover showing hidden home items -->
      <button nz-button nzType="text" nzBlock class="more-link"
        nz-popover
        [nzPopoverContent]="moreTpl"
        [nzPopoverVisible]="moreOpen()"
        (nzPopoverVisibleChange)="moreOpen.set($event)"
        nzPopoverTrigger="click"
        nzPopoverPlacement="rightTop"
        nzPopoverOverlayClassName="sb-popover sb-more-popover">
        <lucide-icon [img]="MoreHorizontal" size="16"/><span>{{ 'more' | componentT:'sidebar' }}</span>
      </button>

      <ng-template #moreTpl>
        <div class="sb-more-menu" role="menu">
          <button class="sbm-item" type="button" routerLink="/chat-activity" (click)="moreOpen.set(false)">
            <span class="sbm-item__icon"><lucide-icon [img]="AtSign" size="15"/></span>
            Chat Activity
            <lucide-icon class="sbm-item__pin" [img]="SlidersHorizontal" size="13"/>
          </button>
          <button class="sbm-item" type="button" routerLink="/drafts-sent" (click)="moreOpen.set(false)">
            <span class="sbm-item__icon"><lucide-icon [img]="Send" size="15"/></span>
            Drafts &amp; Sent
            <lucide-icon class="sbm-item__pin" [img]="SlidersHorizontal" size="13"/>
          </button>
          <button class="sbm-item" type="button" routerLink="/posts" (click)="moreOpen.set(false)">
            <span class="sbm-item__icon"><lucide-icon [img]="Rss" size="15"/></span>
            Posts
            <lucide-icon class="sbm-item__pin" [img]="SlidersHorizontal" size="13"/>
          </button>
          <button class="sbm-item" type="button" routerLink="/all-channels" (click)="moreOpen.set(false)">
            <span class="sbm-item__icon"><lucide-icon [img]="Grid2X2" size="15"/></span>
            All Channels
            <lucide-icon class="sbm-item__pin" [img]="SlidersHorizontal" size="13"/>
          </button>
          <button class="sbm-item" type="button" routerLink="/all-tasks" (click)="moreOpen.set(false)">
            <span class="sbm-item__icon"><lucide-icon [img]="ListChecks" size="15"/></span>
            All Tasks
            <lucide-icon class="sbm-item__pin" [img]="SlidersHorizontal" size="13"/>
          </button>
          <div class="sbm-divider"></div>
          <button class="sbm-item" type="button" (click)="settings.emit(); moreOpen.set(false)">
            <span class="sbm-item__icon"><lucide-icon [img]="Settings2" size="15"/></span>
            Customize
          </button>
        </div>
      </ng-template>

      <app-ai-chats-section />
      <app-spaces-section
        [spaces]="spaceStore.spaces()"
        [loading]="spaceStore.loading()"
        [error]="spaceStore.error()"
        [hasSpaces]="spaceStore.hasSpaces()"
        [workspaceName]="activeWorkspaceName()"
        (addSpace)="addSpace.emit()"
        (createListModal)="createListModal.emit($event)"
        (createFolderModal)="createFolderModal.emit()"
        (createSprintModal)="createSprintModal.emit()"
        (createDocModal)="createDocModal.emit()"
        (createDashboard)="createDashboard.emit()"
        (createWhiteboard)="createWhiteboard.emit()"
        (createFormModal)="createFormModal.emit()"
        (createFromImport)="createFromImport.emit()"
        (createFromTemplate)="createFromTemplate.emit()" />
      <app-channels-section
        [workspaceName]="activeWorkspaceName()"
        [channels]="workspaceChannels()"
        (addChannel)="addChannel.emit()" />
      <app-direct-messages-section (newMessage)="newMessage.emit()" />
    </div>

    <footer class="context-footer">
      <button nz-button nzType="text" nzBlock (click)="settings.emit()">
        <lucide-icon [img]="SlidersHorizontal" size="15"/><span>{{ 'customizeSidebar' | componentT:'sidebar' }}</span>
      </button>
    </footer>
  </aside>
  `,
  styles: [`
    :host { display: block; height: 100%; min-height: 0; }
    .context-sidebar {
      position: relative; display: flex; flex-direction: column;
      width: 15.65rem; height: 100%; max-height: 100%; padding: .5rem .6rem .7rem;
      color: var(--color-text-secondary); background: var(--color-surface-1);
      border-inline-end: 1px solid var(--color-border); overflow: hidden;
    }
/* ── ant menu re-skinned ── */
.home-menu.ant-menu {
  background: transparent;
  border-inline-end: 0;
}

.home-menu .ant-menu-item {
  width: 100%;
  height: 2rem;
  line-height: 2rem;
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: flex-start !important;
  margin: 0 0 .1rem !important;
  padding: 0 .5rem !important;
  border-radius: .35rem;
  color: var(--color-text-secondary);
  background: transparent;
  font-size: .78rem;
  font-weight: 520;
  white-space: nowrap;
}

.home-menu .ant-menu-item:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-3);
}

.home-menu .ant-menu-item-selected {
  color: var(--color-text-primary) !important;
  background: var(--color-surface-3) !important;
}

.home-menu .ant-menu-item::after { display: none; }

/* Icon: fixed box, no external margins, spaced from text */
.home-menu .ant-menu-item lucide-icon,
.home-menu .ant-menu-item .anticon {
  flex: 0 0 auto !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 1.1rem !important;
  height: 1.1rem !important;
  margin: 0 .55rem 0 0 !important;  /* <-- the gap you were missing */
  padding: 0 !important;
  font-size: 1rem !important;
  line-height: 1 !important;
  vertical-align: middle;
}

/* Make sure lucide's inner svg doesn't add its own margins */
.home-menu .ant-menu-item lucide-icon svg {
  display: block;
  margin: 0;
}

/* Text label */
.home-menu .ant-menu-item span:not(.ant-menu-title-content) {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0;
  margin: 0;
}

/* Ant wraps content in this — neutralize its padding */
.home-menu .ant-menu-title-content {
  margin: 0 !important;
  padding: 0 !important;
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
}

/* ── More button ── */
.more-link.ant-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: .55rem !important;
  min-height: 2rem;
  height: auto;
  margin-top: .1rem;
  padding: 0 .5rem !important;
  color: var(--color-text-muted);
  font-size: .75rem;
  text-align: left;
}

.more-link.ant-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-3);
}

.more-link.ant-btn lucide-icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  margin: 0;
}

.more-link.ant-btn span {
  flex: 1 1 auto;
  text-align: left;
}
    /* ── Top bar: "Home" bold label + +Create button (matches image 2) ── */
    .context-top {
      flex: 0 0 auto; display: flex; align-items: center;
      min-height: 2.25rem; padding-inline: .45rem; margin-bottom: .3rem;
    }
    .sidebar-home-label {
      font-size: .9rem; font-weight: 800; color: var(--color-text-primary);
      letter-spacing: -.01em; flex: 1;
    }
    /* + Create pushed to the far right */
    .create {
      margin-inline-start: auto;
      display: inline-flex; align-items: center; gap: .25rem;
      padding: 0 .55rem; font-size: .73rem; font-weight: 750; height: 1.75rem;
    }

    /* ── Scroll region ── */
    .context-scroll {
      flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden;
      scrollbar-width: thin; scrollbar-color: var(--color-border) transparent;
    }
    .context-scroll::-webkit-scrollbar { width: .4rem; }
    .context-scroll::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: .3rem; }
    .context-scroll::-webkit-scrollbar-track { background: transparent; }

    /* ant menu re-skinned */
    .home-menu.ant-menu { background: transparent; border-inline-end: 0; }
    .home-menu .ant-menu-item {
      width: 100%; height: 1.9rem; line-height: 1.9rem;
      display: flex; align-items: center; gap: .55rem;
      margin: 0 0 .05rem; padding: 0 .55rem !important;
      border-radius: .35rem; color: var(--color-text-secondary);
      background: transparent; font-size: .75rem; font-weight: 520;
    }
    .home-menu .ant-menu-item:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .home-menu .ant-menu-item-selected { color: var(--color-text-primary) !important; background: var(--color-surface-3) !important; }
    .home-menu .ant-menu-item::after { display: none; }
    .home-menu .ant-menu-item .anticon,
    .home-menu .ant-menu-item lucide-icon { flex: 0 0 auto; }

    /* More button */
    .more-link.ant-btn {
      justify-content: flex-start; gap: .5rem; min-height: 1.8rem; height: auto;
      margin-top: .05rem; padding: 0 .55rem;
      color: var(--color-text-muted); font-size: .72rem;
    }
    .more-link.ant-btn:hover { color: var(--color-text-primary); background: var(--color-surface-3); }

    /* ── More popover contents ── */
    .sb-more-menu { width: 13.5rem; padding: .35rem; }
    .sbm-item {
      display: flex; align-items: center; gap: 0; width: 100%;
      min-height: 1.95rem; padding: 0 .4rem;
      border: 0; border-radius: .35rem; background: transparent;
      color: var(--color-text-secondary); font: inherit; font-size: .74rem;
      text-align: start; cursor: pointer;
    }
    .sbm-item:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .sbm-item__icon {
      flex: none; width: 1.75rem; height: 1.75rem;
      display: grid; place-items: center; margin-inline-end: .45rem;
      color: var(--color-text-muted);
    }
    .sbm-item:hover .sbm-item__icon { color: var(--color-text-secondary); }
    .sbm-item__pin { margin-inline-start: auto; color: var(--color-text-muted); opacity: .55; flex: none; }
    .sbm-divider { height: 1px; margin: .3rem 0; background: var(--color-border); }

    /* Footer */
    .context-footer { flex: 0 0 auto; margin-top: auto; padding-top: .5rem; border-top: 1px solid var(--color-border); }
    .context-footer .ant-btn { justify-content: flex-start; gap: .5rem; min-height: 1.9rem; height: auto; padding: 0 .55rem; color: var(--color-text-secondary); font-size: .72rem; }
    .context-footer .ant-btn:hover { color: var(--color-text-primary); background: var(--color-surface-3); }

    /* Collapsed state */
    .context-sidebar--collapsed { width: 4.3rem; }
    .context-sidebar--collapsed .create span,
    .context-sidebar--collapsed .more-link span,
    .context-sidebar--collapsed .context-footer .ant-btn span,
    .context-sidebar--collapsed app-ai-chats-section,
    .context-sidebar--collapsed app-spaces-section,
    .context-sidebar--collapsed app-channels-section,
    .context-sidebar--collapsed app-direct-messages-section { display: none; }
    .context-sidebar--collapsed .context-top { justify-content: center; flex-wrap: wrap; }
    .context-sidebar--collapsed .sidebar-home-label { display: none; }
    .context-sidebar--collapsed .create { margin-inline-start: 0; width: 2.1rem; padding: 0; justify-content: center; }

    @media (max-width: 720px) { .context-sidebar { display: none; } }

    /* Kill popover chrome for all sb-popover overlays */
    ::ng-deep .sb-popover .ant-popover-arrow,
    ::ng-deep .sb-popover .ant-popover-arrow-content { display: none !important; }
    ::ng-deep .sb-popover .ant-popover-inner-content { padding: 0 !important; }
    ::ng-deep .sb-popover .ant-popover-inner {
      padding: 0 !important;
      background: var(--color-surface-1) !important;
      border: 1px solid var(--color-border-strong) !important;
      border-radius: .55rem !important;
      box-shadow: 0 8px 28px rgba(0,0,0,.48) !important;
      overflow: hidden !important;
    }
  `],
})
export class AppSidebarComponent {
  readonly Search            = Search;
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly PanelLeftClose    = PanelLeftClose;
  readonly PanelLeftOpen     = PanelLeftOpen;
  readonly Plus              = Plus;
  readonly MoreHorizontal    = MoreHorizontal;
  readonly AtSign            = AtSign;
  readonly Send              = Send;
  readonly Rss               = Rss;
  readonly Grid2X2           = Grid2X2;
  readonly ListChecks        = ListChecks;
  readonly Settings2         = Settings2;

  private readonly workspace    = inject(WorkspaceCustomizationService);
  private readonly spaceService = inject(SpaceService);
  readonly workspaceStore       = inject(WorkspaceStore);
  readonly spaceStore           = inject(SpaceStore);
  readonly channelStore         = inject(ChannelStore);

  readonly moreOpen = signal(false);

  constructor() {
    effect(() => {
      const workspaceId = this.workspaceStore.activeWorkspace()?.id;
      if (workspaceId != null) {
        this.spaceService.loadSpacesByWorkspace(workspaceId).subscribe({ error: () => {} });
      }
    });
  }

  readonly checkedHomeItems    = computed(() => this.workspace.homeItems().filter(i => i.checked));
  readonly activeWorkspaceName = computed(() => this.workspaceStore.activeWorkspace()?.name ?? '');
  readonly workspaceChannels    = computed(() => this.channelStore.channelsForWorkspace(this.workspaceStore.activeId()));

  readonly collapsed       = input(false);
  readonly collapse        = output<void>();
  readonly settings        = output<void>();
  readonly more            = output<void>();
  readonly createRequested = output<void>();
  readonly addSpace        = output<void>();
  readonly addSpaceItem    = output<void>();
  readonly addChannel      = output<void>();
  readonly newMessage      = output<void>();
  readonly createListModal    = output<number>();
  readonly createFolderModal  = output<void>();
  readonly createSprintModal  = output<void>();
  readonly createDocModal     = output<void>();
  readonly createDashboard    = output<void>();
  readonly createWhiteboard   = output<void>();
  readonly createFormModal    = output<void>();
  readonly createFromImport   = output<void>();
  readonly createFromTemplate = output<void>();
}
