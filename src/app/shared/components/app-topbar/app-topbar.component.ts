/** ClickUp reference fidelity: full-width top bar — translated version. */
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideAngularModule, AlarmClock, Bell, Briefcase, Calendar, Camera, ChevronDown, ChevronRight,
  CircleHelp, CircleUserRound, Clapperboard, Clock, Download, ExternalLink, FileText,
  Keyboard, LayoutDashboard, ListChecks, LogOut, Mic, NotebookPen, Palette, PenLine, Pin, Search, Settings2,
  Sparkles, Users, Video, VolumeX,
} from 'lucide-angular';
import { NzAvatarModule }  from 'ng-zorro-antd/avatar';
import { NzBadgeModule }   from 'ng-zorro-antd/badge';
import { NzButtonModule }  from 'ng-zorro-antd/button';
import { NzInputModule }   from 'ng-zorro-antd/input';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { LocaleService, LOCALES } from '../../../core/i18n/locale.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { WorkspaceStore } from '../../../core/stores/workspace.store';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthSessionStore } from '../../../core/auth/auth-session.store';
import { ComponentTranslatePipe } from '../../../core/i18n/component-translate.pipe';
import { AppWorkspaceSwitcherComponent } from '../app-workspace-switcher/app-workspace-switcher.component';

@Component({ selector: 'app-topbar', standalone: true,
  imports: [
    LucideAngularModule, ComponentTranslatePipe, AppWorkspaceSwitcherComponent,
    NzAvatarModule, NzBadgeModule, NzButtonModule, NzInputModule, NzPopoverModule, NzTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush, template: `
  <header class="topbar">
    <div class="topbar__brand">
      <button nz-button nzType="text" class="workspace-switch"
        [attr.aria-label]="'switchWorkspace' | componentT:'topbar'"
        (click)="workspaceMenuOpen.update(value => !value)">
        <nz-avatar nzText="{{ activeInitial() }}" class="workspace-switch__mark" [nzSize]="20" />
        <strong>{{ activeName() }}</strong>
        <lucide-icon [img]="ChevronDown" size="14" />
      </button>
      @if (workspaceMenuOpen()) {
        <app-workspace-switcher
          [workspaces]="workspaceStore.workspaces()"
          [activeId]="workspaceStore.activeId()"
          [loading]="workspaceStore.loading()"
          (close)="workspaceMenuOpen.set(false)"
          (openSettings)="goToSettings()"
          (createWorkspace)="createWorkspace.emit()"
          (switchWorkspace)="switchWorkspace($event)" />
      }
    </div>

    <!-- ClickUp search pill: search on the left, "AI Chats" segment tucked inside on the right -->
    <div class="search-wrap">
      <label class="search-bar" role="search">
        <lucide-icon class="search-bar__icon" [img]="Search" size="16" />
        <input class="search-bar__input" type="search" [placeholder]="'search' | componentT:'topbar'" />
        <kbd class="search-bar__kbd">Ctrl K</kbd>
      </label>
      <button nz-button nzType="text" class="ai-trigger" type="button">
        {{ 'aiChats' | componentT:'topbar' }} <lucide-icon [img]="Sparkles" size="14" />
      </button>
    </div>

    <div class="actions">
      <button nz-button nzType="text" nzShape="circle" class="icon-btn" nz-tooltip [nzTooltipTitle]="'screenRecord' | componentT:'topbar'" [attr.aria-label]="'screenRecord' | componentT:'topbar'"><lucide-icon [img]="Camera" size="17" /></button>
      <button nz-button nzType="text" nzShape="circle" class="icon-btn" nz-tooltip [nzTooltipTitle]="'startVideo'   | componentT:'topbar'" [attr.aria-label]="'startVideo'   | componentT:'topbar'"><lucide-icon [img]="Video"  size="17" /></button>
      <button nz-button nzType="text" nzShape="circle" class="icon-btn" nz-tooltip [nzTooltipTitle]="'voiceMessage' | componentT:'topbar'" [attr.aria-label]="'voiceMessage' | componentT:'topbar'"><lucide-icon [img]="Mic"    size="17" /></button>
      <button nz-button nzType="text" class="account"
        nz-popover [nzPopoverContent]="profileTpl" [nzPopoverVisible]="profileOpen()"
        (nzPopoverVisibleChange)="profileOpen.set($event)"
        nzPopoverTrigger="click" nzPopoverPlacement="bottomRight" nzPopoverOverlayClassName="app-profile-popover">
        <nz-badge nzStatus="success" [nzDot]="true">
          <nz-avatar nzText="{{ userInitials() }}" [nzSize]="28" />
        </nz-badge>
        <lucide-icon [img]="ChevronDown" size="13" />
      </button>
    </div>

    <ng-template #profileTpl>
      <section class="profile-menu" role="menu">
        <header class="pm-header">
          <nz-avatar nzText="{{ userInitials() }}" [nzSize]="32" class="pm-avatar" />
          <div class="pm-header__info">
            <strong>{{ userName() }}</strong>
            <small>{{ 'online' | componentT:'topbar' }}</small>
          </div>
        </header>

        <div class="pm-section">
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="CircleUserRound" size="15" /></span>{{ 'setStatus' | componentT:'topbar' }}</button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="VolumeX" size="15" /></span>{{ 'muteNotifications' | componentT:'topbar' }}<lucide-icon class="pm-item__trail" [img]="ChevronRight" size="13" /></button>
        </div>

        <div class="pm-divider"></div>

        <div class="pm-section">
          <button class="pm-item" type="button" (click)="goToSettings()"><span class="pm-item__icon"><lucide-icon [img]="Settings2" size="15" /></span>{{ 'settings' | componentT:'topbar' }}</button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="Bell" size="15" /></span>{{ 'notifications' | componentT:'topbar' }}</button>
          <button class="pm-item" type="button" (click)="settings.emit(); profileOpen.set(false)"><span class="pm-item__icon"><lucide-icon [img]="Palette" size="15" /></span>{{ 'themes' | componentT:'topbar' }}</button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="Keyboard" size="15" /></span>{{ 'keyboardShortcuts' | componentT:'topbar' }}</button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="Download" size="15" /></span>{{ 'downloadApp' | componentT:'topbar' }}<lucide-icon class="pm-item__trail" [img]="ExternalLink" size="12" /></button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="CircleHelp" size="15" /></span>{{ 'help' | componentT:'topbar' }}<lucide-icon class="pm-item__trail" [img]="ChevronRight" size="13" /></button>
        </div>

        <div class="pm-divider"></div>

        <p class="pm-label">{{ 'personalTools' | componentT:'topbar' }}</p>
        <div class="pm-section">
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="ListChecks" size="15" /></span>{{ 'createTask' | componentT:'topbar' }}<lucide-icon class="pm-item__trail pm-item__trail--pin" [img]="Pin" size="12" /></button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="Briefcase" size="15" /></span>{{ 'myWork' | componentT:'topbar' }}</button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="Clock" size="15" /></span>{{ 'trackTime' | componentT:'topbar' }}</button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="NotebookPen" size="15" /></span>{{ 'notepad' | componentT:'topbar' }}</button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="Clapperboard" size="15" /></span>{{ 'recordClip' | componentT:'topbar' }}<lucide-icon class="pm-item__trail pm-item__trail--pin" [img]="Pin" size="12" /></button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="Mic" size="15" /></span>{{ 'talkToText' | componentT:'topbar' }}<lucide-icon class="pm-item__trail pm-item__trail--pin" [img]="Pin" size="12" /></button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="AlarmClock" size="15" /></span>{{ 'createReminder' | componentT:'topbar' }}</button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="FileText" size="15" /></span>{{ 'createDoc' | componentT:'topbar' }}</button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="PenLine" size="15" /></span>{{ 'createWhiteboard' | componentT:'topbar' }}</button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="Users" size="15" /></span>{{ 'viewPeople' | componentT:'topbar' }}</button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="LayoutDashboard" size="15" /></span>{{ 'createDashboard' | componentT:'topbar' }}<lucide-icon class="pm-item__trail pm-item__trail--pin" [img]="Pin" size="12" /></button>
          <button class="pm-item" type="button"><span class="pm-item__icon"><lucide-icon [img]="Sparkles" size="15" /></span>{{ 'aiNotetaker' | componentT:'topbar' }}</button>
        </div>

        <div class="pm-divider"></div>
        <div class="pm-section">
          <button class="pm-item pm-item--danger" type="button" (click)="onLogout()">
            <span class="pm-item__icon"><lucide-icon [img]="LogOut" size="15" /></span>{{ 'logout' | componentT:'topbar' }}
          </button>
        </div>
      </section>
    </ng-template>
  </header>
`, styles: [`
  :host { display: block; }
  /* ClickUp: header shares the canvas colour (no divider); brand left, search centred, actions right. */
  .topbar { position: relative; z-index: 10; min-height: 3rem; display: grid; grid-template-columns: minmax(0,1fr) minmax(15rem, 31rem) minmax(0,1fr); align-items: center; gap: .75rem; padding: .3rem .75rem; color: var(--color-text-primary); background: var(--color-topbar); }
  .topbar__brand { position: relative; display: flex; align-items: center; gap: .2rem; justify-self: start; }
  .workspace-switch.ant-btn { display: inline-flex; align-items: center; gap: .5rem; height: 2.1rem; padding: 0 .6rem 0 .45rem; border: 1px solid transparent; border-radius: .6rem; color: var(--color-text-primary); background: transparent; font: inherit; font-size: .84rem; font-weight: 600; }
  .workspace-switch.ant-btn:hover { background: var(--color-surface-3); }
  .workspace-switch lucide-icon { color: var(--color-text-muted); }
  .workspace-switch__mark.ant-avatar { color: #fff; background: var(--cu-teal); border-radius: .35rem; font-size: .7rem; font-weight: 700; }
  .icon-btn.ant-btn { width: 2.1rem; height: 2.1rem; display: grid; place-items: center; border-radius: .6rem; color: var(--color-text-secondary); }
  .icon-btn.ant-btn:hover { color: var(--color-text-primary); background: var(--color-surface-3); }

  /* ── Search pill (with the AI Chats segment inside) ── */
  .search-wrap { display: flex; align-items: center; gap: .25rem; width: 100%; min-height: 2.1rem; padding: .15rem .2rem .15rem .7rem; border: 1px solid var(--color-border-strong); border-radius: 999px; background: var(--color-surface-1); transition: border-color .15s, background .15s; }
  .search-wrap:hover { background: var(--color-surface-2); }
  .search-wrap:focus-within { border-color: var(--color-text-muted); }
  .search-bar { display: flex; align-items: center; gap: .45rem; flex: 1; min-width: 0; cursor: text; }
  .search-bar__icon { flex: none; color: var(--color-text-secondary); display: flex; align-items: center; }
  .search-bar__input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .84rem; }
  .search-bar__input::placeholder { color: var(--color-text-secondary); }
  .search-bar__input::-webkit-search-cancel-button { display: none; }
  .search-bar__kbd { flex: none; color: var(--color-text-muted); font-size: .72rem; font-family: inherit; }

  .ai-trigger.ant-btn { flex: none; display: inline-flex; align-items: center; gap: .35rem; height: 1.75rem; padding: 0 .7rem; border-radius: 999px; color: var(--color-text-secondary); background: var(--color-surface-2); font: inherit; font-size: .78rem; font-weight: 500; }
  .ai-trigger.ant-btn:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
  .ai-trigger lucide-icon { color: var(--color-accent-bright); }
  .actions { justify-self: end; display: flex; align-items: center; gap: .15rem; }
  .actions > .icon-btn.ant-btn { width: 2.1rem; height: 2.1rem; }
  .account.ant-btn { position: relative; display: flex !important; align-items: center; justify-content: center; gap: .25rem; width: auto !important; height: auto; padding: 0 .15rem; margin-inline-start: .2rem; }
  .account nz-avatar.ant-avatar { color: #111; background: #eee; font-size: .68rem; font-weight: 700; }

  /* ── Profile menu ── */
  .profile-menu {
    width: 18.5rem;
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
    padding: .45rem;
    /* Sidebar-matching scrollbar */
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }
  .profile-menu::-webkit-scrollbar { width: .35rem; }
  .profile-menu::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: .3rem; }
  .profile-menu::-webkit-scrollbar-track { background: transparent; }

  /* Header */
  .pm-header { display: flex; align-items: center; gap: .6rem; padding: .35rem .5rem .7rem; }
  .pm-avatar.ant-avatar { color: #111; background: #eee; font-size: .62rem; flex: none; }
  .pm-header__info strong { display: block; color: var(--color-text-primary); font-size: .86rem; font-weight: 700; }
  .pm-header__info small { display: block; margin-top: .1rem; color: var(--color-success-text); font-size: .62rem; }

  /* Section + divider */
  .pm-section { display: flex; flex-direction: column; gap: 1px; }
  .pm-divider { height: 1px; margin: .3rem 0; background: var(--color-border); }
  .pm-label { margin: .5rem .45rem .2rem; color: var(--color-text-muted); font-size: .72rem; font-weight: 600; }

  /* Items */
  .pm-item {
    display: flex; align-items: center; gap: 0; width: 100%;
    min-height: 2.15rem; padding: 0 .45rem;
    border: 0; border-radius: .45rem;
    background: transparent;
    color: var(--color-text-secondary);
    font: inherit; font-size: .82rem;
    text-align: start; cursor: pointer;
    transition: background .1s, color .1s;
  }
  .pm-item:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

  /* Icon cell — fixed width, perfectly centered */
  .pm-item__icon {
    flex: none;
    width: 1.85rem; height: 1.85rem;
    display: grid; place-items: center;
    margin-inline-end: .3rem;
    color: var(--color-text-muted);
    border-radius: .3rem;
  }
  .pm-item:hover .pm-item__icon { color: var(--color-text-secondary); }

  /* Trail icons (chevron, pin, external) */
  .pm-item__trail { margin-inline-start: auto; color: var(--color-text-muted); flex: none; }
  .pm-item__trail--pin { opacity: .6; }

  /* Danger */
  .pm-item--danger { color: var(--color-danger-text, #ff9a9a); }
  .pm-item--danger:hover { background: var(--color-danger-soft); color: var(--color-danger-text, #ff9a9a); }
  .pm-item--danger .pm-item__icon { color: var(--color-danger-text, #ff9a9a); }

  ::ng-deep .app-profile-popover .ant-popover-inner { padding: 0 !important; border: 1px solid var(--color-border-strong) !important; border-radius: .75rem !important; background: var(--color-surface-2) !important; box-shadow: 0 1.1rem 2.8rem rgb(0 0 0 / .5) !important; overflow: hidden !important; }
  ::ng-deep .app-profile-popover .ant-popover-arrow { display: none !important; }
  @media (max-width: 720px) { .topbar { grid-template-columns: auto 1fr auto; min-height: 3rem; } .ai-trigger { display: none; } .search-wrap { width: 100%; } .actions > button:not(.account) { display: none; } .search-bar__kbd { display: none; } }
`]})
export class AppTopbarComponent {
  readonly locale = inject(LocaleService);
  readonly theme = inject(ThemeService);
  readonly workspaceStore = inject(WorkspaceStore);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly sessionStore = inject(AuthSessionStore);
  readonly locales = LOCALES;
  readonly settings = output<void>();
  readonly createWorkspace = output<void>();
  readonly profileOpen = signal(false);
  readonly workspaceMenuOpen = signal(false);

  readonly activeName    = computed(() => this.workspaceStore.activeWorkspace()?.name ?? 'Select workspace');
  readonly activeInitial = computed(() => (this.workspaceStore.activeWorkspace()?.name ?? 'W').charAt(0).toUpperCase());
  readonly userName      = computed(() => this.sessionStore.current()?.user?.fullName ?? 'Account');
  readonly userInitials  = computed(() => {
    const name = this.sessionStore.current()?.user?.fullName ?? '';
    return name.split(' ').map((p: string) => p[0] ?? '').join('').slice(0, 2).toUpperCase() || 'MM';
  });

  goToSettings(): void { this.profileOpen.set(false); this.workspaceMenuOpen.set(false); this.router.navigateByUrl('/settings'); }
  switchWorkspace(id: number): void { this.workspaceStore.switchTo(id); this.workspaceMenuOpen.set(false); }
  onLogout(): void { this.profileOpen.set(false); this.auth.logout(); this.router.navigateByUrl('/auth/login'); }

  readonly AlarmClock = AlarmClock; readonly Bell = Bell; readonly Briefcase = Briefcase; readonly Calendar = Calendar;
  readonly Camera = Camera; readonly ChevronDown = ChevronDown; readonly ChevronRight = ChevronRight;
  readonly CircleHelp = CircleHelp; readonly CircleUserRound = CircleUserRound; readonly Clapperboard = Clapperboard;
  readonly Clock = Clock; readonly Download = Download; readonly ExternalLink = ExternalLink; readonly FileText = FileText;
  readonly Keyboard = Keyboard; readonly LayoutDashboard = LayoutDashboard; readonly ListChecks = ListChecks;
  readonly LogOut = LogOut; readonly Mic = Mic; readonly NotebookPen = NotebookPen; readonly Palette = Palette;
  readonly PenLine = PenLine; readonly Pin = Pin; readonly Search = Search; readonly Settings2 = Settings2;
  readonly Sparkles = Sparkles; readonly Users = Users; readonly Video = Video; readonly VolumeX = VolumeX;
}
