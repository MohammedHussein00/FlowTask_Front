/**
 * WorkspaceDetailComponent
 * ────────────────────────
 * Loaded at /workspaces/:workspaceId.
 * Fetches the workspace (if not already in the store), switches it to active,
 * and renders the workspace overview matching the ClickUp screenshot:
 *   – workspace name, plan badge, member count
 *   – Settings + People quick-action buttons
 *   – Manage section (Apps, Templates, Custom Fields, Automations, Tag Manager)
 *   – Spaces list (empty state with "+ New Space")
 *   – Channels section
 */
import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Settings, Users, LayoutGrid, FileText, Sliders, Zap, Tag, Plus, Hash, Loader2 } from 'lucide-angular';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { WorkspaceStore } from '../../../core/stores/workspace.store';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [LucideAngularModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="wd-page">

  @if (loading()) {
    <div class="wd-loading">
      <lucide-icon [img]="Loader2" size="22" class="wd-spin" />
      <span>Loading workspace…</span>
    </div>

  } @else if (error()) {
    <div class="wd-error">
      <p>{{ error() }}</p>
      <button class="wd-btn" (click)="retry()">Retry</button>
    </div>

  } @else if (ws()) {
    <!-- ── Workspace header ── -->
    <div class="wd-header">
      <div class="wd-avatar">{{ ws()!.name.charAt(0).toUpperCase() }}</div>
      <div>
        <h1 class="wd-name">{{ ws()!.name }}</h1>
        <span class="wd-plan">Free Forever · {{ ws()!.memberCount }} member{{ ws()!.memberCount !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- ── Quick-action buttons ── -->
    <div class="wd-actions">
      <a class="wd-action-btn" [routerLink]="['settings']">
        <lucide-icon [img]="Settings" size="14" />Settings
      </a>
      <a class="wd-action-btn" [routerLink]="['people']">
        <lucide-icon [img]="Users" size="14" />People
      </a>
    </div>

    <hr class="wd-divider" />

    <!-- ── Manage section ── -->
    <p class="wd-section-label">Manage</p>
    <div class="wd-manage-list">
      <a class="wd-manage-item" href="#">
        <lucide-icon [img]="LayoutGrid" size="15" />Apps
      </a>
      <a class="wd-manage-item" href="#">
        <lucide-icon [img]="FileText" size="15" />Templates
      </a>
      <a class="wd-manage-item" href="#">
        <lucide-icon [img]="Sliders" size="15" />Custom Fields
      </a>
      <a class="wd-manage-item" href="#">
        <lucide-icon [img]="Zap" size="15" />Automations
      </a>
      <a class="wd-manage-item" href="#">
        <lucide-icon [img]="Tag" size="15" />Tag Manager
        <span class="wd-badge-new">New</span>
      </a>
    </div>

    <hr class="wd-divider" />

    <!-- ── Spaces ── -->
    <div class="wd-spaces-header">
      <p class="wd-section-label" style="margin:0">Spaces</p>
      <button class="wd-icon-btn" type="button" title="New space">
        <lucide-icon [img]="Plus" size="14" />
      </button>
    </div>
    <div class="wd-spaces-empty">
      <span>No spaces yet.</span>
      <a class="wd-link" href="#">+ New Space</a>
    </div>

    <hr class="wd-divider" />

    <!-- ── Channels ── -->
    <p class="wd-section-label">Channels</p>
    <a class="wd-channel-item" href="#">
      <lucide-icon [img]="Hash" size="14" />Welcome
    </a>
    <a class="wd-channel-item" href="#">
      <lucide-icon [img]="Hash" size="14" />General
      <span class="wd-channel-ws">· {{ ws()!.name }}</span>
    </a>
    <button class="wd-channel-item wd-channel-item--add" type="button">
      <lucide-icon [img]="Plus" size="14" />Add Channel
    </button>
  }

</div>
  `,
  styles: [`
    .wd-page { padding: 1.2rem 1rem; display: flex; flex-direction: column; gap: .6rem; }

    /* loading / error */
    .wd-loading, .wd-error {
      display: flex; flex-direction: column; align-items: center; gap: .6rem;
      padding: 3rem 1rem; color: var(--color-text-secondary); font-size: .84rem;
    }
    .wd-spin { animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .wd-btn { padding: .4rem .9rem; border: 1px solid var(--color-border); border-radius: .35rem; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .90rem; cursor: pointer; }

    /* header */
    .wd-header { display: flex; align-items: center; gap: .75rem; padding-bottom: .3rem; }
    .wd-avatar {
      width: 2.2rem; height: 2.2rem; border-radius: .4rem;
      display: grid; place-items: center;
      background: var(--color-accent); color: #fff;
      font-size: 1rem; font-weight: 700; flex-shrink: 0;
    }
    .wd-name { margin: 0; font-size: .95rem; font-weight: 700; color: var(--color-text-primary); }
    .wd-plan { font-size: .83rem; color: var(--color-text-muted); }

    /* quick actions */
    .wd-actions { display: flex; gap: .4rem; }
    .wd-action-btn {
      display: inline-flex; align-items: center; gap: .35rem;
      padding: .32rem .65rem;
      border: 1px solid var(--color-border);
      border-radius: .35rem;
      background: var(--color-surface-3);
      color: var(--color-text-secondary);
      font: inherit; font-size: .85rem; font-weight: 500;
      text-decoration: none; cursor: pointer;
    }
    .wd-action-btn:hover { color: var(--color-text-primary); }

    /* divider / labels */
    .wd-divider { border: 0; border-top: 1px solid var(--color-border); margin: .2rem 0; }
    .wd-section-label {
      margin: .1rem 0 .15rem;
      font-size: .70rem; font-weight: 800;
      letter-spacing: .07em; text-transform: uppercase;
      color: var(--color-text-muted);
    }

    /* manage */
    .wd-manage-list { display: flex; flex-direction: column; }
    .wd-manage-item {
      display: flex; align-items: center; gap: .5rem;
      padding: .38rem .3rem;
      color: var(--color-text-secondary);
      font-size: .91rem; text-decoration: none;
      border-radius: .3rem;
    }
    .wd-manage-item:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .wd-badge-new {
      margin-left: auto; padding: .08rem .35rem;
      border-radius: .25rem; background: var(--color-accent);
      color: #fff; font-size: .69rem; font-weight: 700;
    }

    /* spaces */
    .wd-spaces-header { display: flex; align-items: center; justify-content: space-between; }
    .wd-icon-btn { border: 0; background: transparent; color: var(--color-text-muted); cursor: pointer; padding: .15rem; border-radius: .25rem; display: grid; place-items: center; }
    .wd-icon-btn:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .wd-spaces-empty {
      display: flex; align-items: center; justify-content: space-between;
      padding: .3rem 0; font-size: .90rem; color: var(--color-text-muted);
    }
    .wd-link { color: var(--color-accent); text-decoration: none; font-size: .87rem; }
    .wd-link:hover { text-decoration: underline; }

    /* channels */
    .wd-channel-item {
      display: flex; align-items: center; gap: .45rem;
      padding: .38rem .3rem;
      color: var(--color-text-secondary); font-size: .91rem;
      text-decoration: none; border-radius: .3rem;
      border: 0; background: transparent; font: inherit; cursor: pointer; width: 100%; text-align: start;
    }
    .wd-channel-item:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .wd-channel-ws { font-size: .83rem; color: var(--color-text-muted); }
    .wd-channel-item--add { color: var(--color-text-muted); }
  `],
})
export class WorkspaceDetailComponent implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly svc    = inject(WorkspaceService);
  readonly store          = inject(WorkspaceStore);
  private readonly router = inject(Router);

  readonly Settings   = Settings;   readonly Users    = Users;
  readonly LayoutGrid = LayoutGrid; readonly FileText = FileText;
  readonly Sliders    = Sliders;    readonly Zap      = Zap;
  readonly Tag        = Tag;        readonly Plus     = Plus;
  readonly Hash       = Hash;       readonly Loader2  = Loader2;

  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);
  readonly ws      = this.store.activeWorkspace;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('workspaceId'));
    if (!id) { this.router.navigate(['/dashboard']); return; }

    // If the store already has this workspace, just switch to it
    const cached = this.store.workspaces().find(w => w.id === id);
    if (cached) {
      this.store.switchTo(id);
      return;
    }

    // Otherwise fetch from backend
    this.loading.set(true);
    this.svc.loadWorkspace(id).subscribe({
      next: () => {
        this.store.switchTo(id);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message ?? 'Workspace not found.');
      },
    });
  }

  retry(): void { this.ngOnInit(); }
}
