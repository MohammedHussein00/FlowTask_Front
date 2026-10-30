/**
 * WorkspaceSwitcherComponent
 * ──────────────────────────
 * The workspace chip shown at the top of the contextual sidebar.
 * Clicking it opens a dropdown with:
 *   • all workspaces the user belongs to (switch on click)
 *   • "Create workspace" CTA
 *   • Settings + People quick-links for the active workspace
 *
 * Mirrors the ClickUp UI from the screenshot exactly.
 */
import {
  ChangeDetectionStrategy, Component, inject, signal, output,
  HostListener,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Settings, Users, Plus, Check, ChevronDown, Building2 } from 'lucide-angular';
import { WorkspaceStore } from '../../../core/stores/workspace.store';
import { WorkspaceService } from '../../../core/services/workspace.service';

@Component({
  selector: 'app-workspace-switcher',
  standalone: true,
  imports: [LucideAngularModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="ws-switcher">

  <!-- ── Trigger chip ── -->
  <button
    class="ws-chip"
    type="button"
    [attr.aria-expanded]="open()"
    aria-haspopup="true"
    (click)="open.update(v => !v)"
  >
    <span class="ws-chip__avatar" [attr.data-initial]="initial()">
      @if (store.activeWorkspace()?.avatarUrl) {
        <img [src]="store.activeWorkspace()!.avatarUrl" [alt]="store.activeWorkspace()!.name" />
      } @else {
        {{ initial() }}
      }
    </span>
    <span class="ws-chip__name">{{ store.activeWorkspace()?.name ?? 'Select workspace' }}</span>
    <lucide-icon [img]="ChevronDown" size="13" class="ws-chip__caret" />
  </button>

  <!-- ── Dropdown ── -->
  @if (open()) {
    <div class="ws-dropdown" role="menu">

      <!-- Header quick-actions -->
      <div class="ws-dropdown__actions">
        <a class="ws-dropdown__action-btn" [routerLink]="['/workspaces', store.activeId(), 'settings']" (click)="open.set(false)">
          <lucide-icon [img]="Settings" size="14" />Settings
        </a>
        <a class="ws-dropdown__action-btn" [routerLink]="['/workspaces', store.activeId(), 'people']" (click)="open.set(false)">
          <lucide-icon [img]="Users" size="14" />People
        </a>
      </div>

      <hr class="ws-dropdown__divider" />

      <!-- Manage section label -->
      <p class="ws-dropdown__section-label">Manage</p>
      <a class="ws-dropdown__menu-item" [routerLink]="['/workspaces', store.activeId(), 'settings', 'apps']" (click)="open.set(false)">
        <lucide-icon [img]="Building2" size="14" />Apps
      </a>

      <hr class="ws-dropdown__divider" />

      <!-- Switch workspaces -->
      <p class="ws-dropdown__section-label">Switch Workspaces</p>

      @if (store.loading()) {
        <p class="ws-dropdown__empty">Loading…</p>
      } @else if (!store.hasWorkspaces()) {
        <p class="ws-dropdown__empty">No workspaces yet.</p>
      } @else {
        @for (ws of store.workspaces(); track ws.id) {
          <button
            class="ws-dropdown__ws-item"
            [class.ws-dropdown__ws-item--active]="ws.id === store.activeId()"
            type="button"
            role="menuitem"
            (click)="switchTo(ws.id)"
          >
            <span class="ws-item__avatar">
              @if (ws.avatarUrl) {
                <img [src]="ws.avatarUrl" [alt]="ws.name" />
              } @else {
                {{ ws.name.charAt(0).toUpperCase() }}
              }
            </span>
            <span class="ws-item__name">{{ ws.name }}</span>
            @if (ws.id === store.activeId()) {
              <lucide-icon [img]="Check" size="13" class="ws-item__check" />
            }
          </button>
        }
      }

      <hr class="ws-dropdown__divider" />

      <!-- Create workspace -->
      <button
        class="ws-dropdown__create-btn"
        type="button"
        (click)="openCreate()"
      >
        <lucide-icon [img]="Plus" size="14" />
        <span>Create Workspace</span>
      </button>

    </div>
  }

</div>
  `,
  styles: [`
    .ws-switcher { position: relative; }

    /* ── Chip ──────────────────────────────────────────────── */
    .ws-chip {
      display: flex; align-items: center; gap: .45rem;
      width: 100%; padding: .3rem .4rem;
      border: 0; border-radius: .4rem;
      background: transparent; cursor: pointer;
      color: var(--color-text-primary);
      font: inherit;
    }
    .ws-chip:hover { background: var(--color-surface-3); }

    .ws-chip__avatar {
      display: grid; place-items: center; flex-shrink: 0;
      width: 1.6rem; height: 1.6rem;
      border-radius: .3rem;
      background: var(--color-accent);
      color: #fff; font-size: .72rem; font-weight: 700;
      overflow: hidden;
    }
    .ws-chip__avatar img { width: 100%; height: 100%; object-fit: cover; }

    .ws-chip__name {
      flex: 1; min-width: 0;
      font-size: .82rem; font-weight: 650;
      text-align: start; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .ws-chip__caret { color: var(--color-text-muted); flex-shrink: 0; }

    /* ── Dropdown ──────────────────────────────────────────── */
    .ws-dropdown {
      position: absolute;
      top: calc(100% + .25rem);
      left: 0;
      z-index: 100;
      width: 17rem;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: .5rem;
      box-shadow: 0 8px 24px rgba(0,0,0,.25);
      padding: .4rem 0;
      overflow: hidden;
    }

    .ws-dropdown__actions {
      display: flex; gap: .3rem;
      padding: .3rem .5rem;
    }
    .ws-dropdown__action-btn {
      display: flex; align-items: center; gap: .35rem;
      flex: 1; padding: .38rem .55rem;
      border: 1px solid var(--color-border);
      border-radius: .35rem;
      background: var(--color-surface-3);
      color: var(--color-text-secondary);
      font: inherit; font-size: .73rem; font-weight: 500;
      text-decoration: none; cursor: pointer;
      justify-content: center;
      transition: color .12s, background .12s;
    }
    .ws-dropdown__action-btn:hover { color: var(--color-text-primary); background: var(--color-surface-1); }

    .ws-dropdown__divider {
      margin: .35rem 0; border: 0;
      border-top: 1px solid var(--color-border);
    }

    .ws-dropdown__section-label {
      margin: 0; padding: .2rem .75rem .15rem;
      font-size: .62rem; font-weight: 700;
      letter-spacing: .06em; text-transform: uppercase;
      color: var(--color-text-muted);
    }

    .ws-dropdown__menu-item {
      display: flex; align-items: center; gap: .5rem;
      width: 100%; padding: .42rem .75rem;
      border: 0; background: transparent;
      color: var(--color-text-secondary);
      font: inherit; font-size: .78rem; text-decoration: none;
      cursor: pointer;
    }
    .ws-dropdown__menu-item:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

    .ws-dropdown__empty {
      padding: .35rem .75rem;
      font-size: .75rem; color: var(--color-text-muted);
      margin: 0;
    }

    /* ── Workspace items ───────────────────────────────────── */
    .ws-dropdown__ws-item {
      display: flex; align-items: center; gap: .6rem;
      width: 100%; padding: .4rem .75rem;
      border: 0; background: transparent;
      color: var(--color-text-secondary);
      font: inherit; font-size: .8rem;
      text-align: start; cursor: pointer;
    }
    .ws-dropdown__ws-item:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .ws-dropdown__ws-item--active { color: var(--color-text-primary); }

    .ws-item__avatar {
      display: grid; place-items: center; flex-shrink: 0;
      width: 1.6rem; height: 1.6rem;
      border-radius: .3rem;
      background: var(--color-accent);
      color: #fff; font-size: .7rem; font-weight: 700; overflow: hidden;
    }
    .ws-item__avatar img { width: 100%; height: 100%; object-fit: cover; }
    .ws-item__name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ws-item__check { color: var(--color-accent); flex-shrink: 0; }

    /* ── Create button ─────────────────────────────────────── */
    .ws-dropdown__create-btn {
      display: flex; align-items: center; gap: .5rem;
      width: 100%; padding: .42rem .75rem;
      border: 0; background: transparent;
      color: var(--color-text-secondary);
      font: inherit; font-size: .78rem; cursor: pointer;
    }
    .ws-dropdown__create-btn:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
  `],
})
export class WorkspaceSwitcherComponent {
  readonly store  = inject(WorkspaceStore);
  private readonly svc    = inject(WorkspaceService);
  private readonly router = inject(Router);

  readonly open = signal(false);
  readonly createWorkspace = output<void>();

  readonly Settings = Settings; readonly Users = Users;
  readonly Plus = Plus; readonly Check = Check;
  readonly ChevronDown = ChevronDown; readonly Building2 = Building2;

  initial(): string {
    return this.store.activeWorkspace()?.name?.charAt(0).toUpperCase() ?? 'W';
  }

  switchTo(id: number): void {
    this.svc.switchWorkspace(id);
    this.open.set(false);
    // Navigate into the newly-active workspace's dashboard
    this.router.navigate(['/workspaces', id]);
  }

  openCreate(): void {
    this.open.set(false);
    this.createWorkspace.emit();
    this.router.navigate(['/workspaces/create']);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('app-workspace-switcher')) {
      this.open.set(false);
    }
  }
}
