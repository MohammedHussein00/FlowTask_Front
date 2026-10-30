/**
 * WorkspaceEditComponent
 * ──────────────────────
 * Loaded at /workspaces/:workspaceId/settings.
 * Lets the owner rename the workspace and change the avatar URL.
 * Calls UpdateWorkspace mutation via WorkspaceService.
 */
import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Save, Loader2 } from 'lucide-angular';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { WorkspaceStore } from '../../../core/stores/workspace.store';

@Component({
  selector: 'app-workspace-edit',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="we-page">
  <div class="we-card">

    <a class="we-back" [routerLink]="['..']">
      <lucide-icon [img]="ArrowLeft" size="15" />Back to workspace
    </a>

    <h1 class="we-title">Workspace Settings</h1>
    <p class="we-subtitle">Update your workspace name and avatar.</p>

    @if (successMsg()) {
      <div class="we-success" role="status">{{ successMsg() }}</div>
    }
    @if (error()) {
      <div class="we-error" role="alert">{{ error() }}</div>
    }

    <div class="we-form">

      <label class="we-label">
        Workspace name <span class="we-required">*</span>
        <input
          class="we-input"
          [class.we-input--invalid]="nameInvalid()"
          type="text"
          [(ngModel)]="name"
          (input)="nameInvalid.set(false)"
          maxlength="100"
        />
        @if (nameInvalid()) {
          <span class="we-field-error">Name is required (max 100 characters).</span>
        }
      </label>

      <label class="we-label">
        Avatar URL <span class="we-optional">(optional)</span>
        <input
          class="we-input"
          type="url"
          placeholder="https://example.com/logo.png"
          [(ngModel)]="avatarUrl"
        />
      </label>

      <button
        class="we-submit"
        type="button"
        [disabled]="saving()"
        (click)="save()"
      >
        @if (saving()) {
          <lucide-icon [img]="Loader2" size="15" class="we-spin" />Saving…
        } @else {
          <lucide-icon [img]="Save" size="15" />Save changes
        }
      </button>

    </div>
  </div>
</div>
  `,
  styles: [`
    .we-page { min-height: 100%; display: grid; place-items: start center; padding: 2rem; background: var(--color-surface-1); }
    .we-card { width: 100%; max-width: 26rem; padding: 2.4rem 2rem; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: .75rem; display: flex; flex-direction: column; gap: 1rem; }

    .we-back { display: inline-flex; align-items: center; gap: .3rem; color: var(--color-text-muted); text-decoration: none; font-size: .90rem; }
    .we-back:hover { color: var(--color-text-primary); }

    .we-title { margin: 0; font-size: 1.15rem; font-weight: 750; color: var(--color-text-primary); }
    .we-subtitle { margin: 0; font-size: .82rem; color: var(--color-text-secondary); line-height: 1.5; }

    .we-success { padding: .6rem .85rem; background: rgba(22,163,74,.12); border: 1px solid rgba(22,163,74,.3); border-radius: .4rem; color: #16a34a; font-size: .8rem; }
    .we-error { padding: .6rem .85rem; background: rgba(229,83,75,.12); border: 1px solid rgba(229,83,75,.3); border-radius: .4rem; color: #e5534b; font-size: .8rem; }

    .we-form { display: flex; flex-direction: column; gap: 1rem; margin-top: .4rem; }
    .we-label { display: flex; flex-direction: column; gap: .35rem; font-size: .90rem; font-weight: 600; color: var(--color-text-secondary); }
    .we-required { color: var(--color-danger, #e5534b); }
    .we-optional { font-weight: 400; color: var(--color-text-muted); }

    .we-input { padding: .55rem .75rem; border: 1px solid var(--color-border-strong); border-radius: .4rem; background: var(--color-surface-1); color: var(--color-text-primary); font: inherit; font-size: .84rem; outline: none; transition: border-color .15s; }
    .we-input:focus { border-color: var(--color-accent); }
    .we-input--invalid { border-color: var(--color-danger, #e5534b); }
    .we-field-error { font-size: .83rem; color: var(--color-danger, #e5534b); font-weight: 400; }

    .we-submit { display: flex; align-items: center; justify-content: center; gap: .45rem; padding: .62rem 1.2rem; border: 0; border-radius: .42rem; background: var(--color-accent); color: #fff; font: inherit; font-size: .85rem; font-weight: 650; cursor: pointer; transition: opacity .15s; }
    .we-submit:disabled { opacity: .6; cursor: not-allowed; }
    .we-submit:not(:disabled):hover { opacity: .9; }

    .we-spin { animation: spin .65s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class WorkspaceEditComponent implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly svc    = inject(WorkspaceService);
  private readonly store  = inject(WorkspaceStore);
  private readonly router = inject(Router);

  readonly ArrowLeft = ArrowLeft; readonly Save = Save; readonly Loader2 = Loader2;

  name      = '';
  avatarUrl = '';
  workspaceId = 0;

  readonly saving      = signal(false);
  readonly error       = signal<string | null>(null);
  readonly successMsg  = signal<string | null>(null);
  readonly nameInvalid = signal(false);

  ngOnInit(): void {
    this.workspaceId = Number(this.route.snapshot.paramMap.get('workspaceId'));
    const ws = this.store.workspaces().find(w => w.id === this.workspaceId);
    if (ws) {
      this.name      = ws.name;
      this.avatarUrl = ws.avatarUrl ?? '';
    } else {
      // Load from API if not in store
      this.svc.loadWorkspace(this.workspaceId).subscribe({
        next: ws => { this.name = ws.name; this.avatarUrl = ws.avatarUrl ?? ''; },
        error: () => this.router.navigate(['/dashboard']),
      });
    }
  }

  save(): void {
    const trimmed = this.name.trim();
    if (!trimmed || trimmed.length > 100) { this.nameInvalid.set(true); return; }

    this.saving.set(true);
    this.error.set(null);
    this.successMsg.set(null);

    this.svc.updateWorkspace({
      id:        this.workspaceId,
      name:      trimmed,
      avatarUrl: this.avatarUrl.trim() || null,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMsg.set('Workspace updated successfully.');
        setTimeout(() => this.successMsg.set(null), 3000);
      },
      error: (err: Error) => {
        this.saving.set(false);
        this.error.set(err.message ?? 'Could not save changes.');
      },
    });
  }
}
