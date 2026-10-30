/**
 * CreateWorkspaceComponent
 * ────────────────────────
 * Full-page form (like ClickUp's "Create workspace" flow).
 * On success it navigates to the new workspace's dashboard.
 */
import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Upload, Building2 } from 'lucide-angular';
import { WorkspaceService } from '../../../core/services/workspace.service';

@Component({
  selector: 'app-create-workspace',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="cw-page">
  <div class="cw-card">

    <!-- Back link -->
    <a class="cw-back" [routerLink]="['/dashboard']">
      <lucide-icon [img]="ArrowLeft" size="15" />Back
    </a>

    <!-- Icon -->
    <div class="cw-icon">
      <lucide-icon [img]="Building2" size="28" />
    </div>

    <h1 class="cw-title">Create a new Workspace</h1>
    <p class="cw-subtitle">
      A Workspace is a shared environment for your team's projects, spaces, and tasks.
    </p>

    @if (error()) {
      <div class="cw-error" role="alert">{{ error() }}</div>
    }

    <!-- Form -->
    <div class="cw-form">

      <label class="cw-label">
        Workspace name <span class="cw-required">*</span>
        <input
          class="cw-input"
          [class.cw-input--invalid]="nameInvalid()"
          type="text"
          placeholder="e.g. Acme Corp"
          [(ngModel)]="name"
          (input)="nameInvalid.set(false)"
          maxlength="100"
          autofocus
        />
        @if (nameInvalid()) {
          <span class="cw-field-error">Workspace name is required (max 100 characters).</span>
        }
      </label>

      <label class="cw-label">
        Avatar URL <span class="cw-optional">(optional)</span>
        <div class="cw-input-icon-wrap">
          <lucide-icon [img]="Upload" size="14" />
          <input
            class="cw-input cw-input--icon"
            type="url"
            placeholder="https://example.com/logo.png"
            [(ngModel)]="avatarUrl"
          />
        </div>
      </label>

      <button
        class="cw-submit"
        type="button"
        [disabled]="loading()"
        (click)="submit()"
      >
        @if (loading()) {
          <span class="cw-spinner"></span>Creating…
        } @else {
          Create Workspace
        }
      </button>

    </div>

  </div>
</div>
  `,
  styles: [`
    .cw-page {
      min-height: 100vh;
      display: grid; place-items: center;
      padding: 2rem;
      background: var(--color-surface-1);
    }

    .cw-card {
      width: 100%; max-width: 26rem;
      padding: 2.4rem 2rem;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: .75rem;
      display: flex; flex-direction: column; gap: 1rem;
    }

    .cw-back {
      display: inline-flex; align-items: center; gap: .3rem;
      color: var(--color-text-muted); text-decoration: none;
      font-size: .90rem;
    }
    .cw-back:hover { color: var(--color-text-primary); }

    .cw-icon {
      display: grid; place-items: center;
      width: 3.2rem; height: 3.2rem;
      border-radius: .6rem;
      background: var(--color-accent);
      color: #fff; margin-bottom: .25rem;
    }

    .cw-title {
      margin: 0; font-size: 1.25rem; font-weight: 750;
      color: var(--color-text-primary);
    }
    .cw-subtitle {
      margin: 0; font-size: .82rem;
      color: var(--color-text-secondary); line-height: 1.5;
    }

    .cw-error {
      padding: .6rem .85rem;
      background: rgba(229,83,75,.12); border: 1px solid rgba(229,83,75,.3);
      border-radius: .4rem; color: #e5534b;
      font-size: .8rem;
    }

    .cw-form { display: flex; flex-direction: column; gap: 1rem; margin-top: .4rem; }

    .cw-label {
      display: flex; flex-direction: column; gap: .35rem;
      font-size: .90rem; font-weight: 600;
      color: var(--color-text-secondary);
    }
    .cw-required { color: var(--color-danger, #e5534b); }
    .cw-optional { font-weight: 400; color: var(--color-text-muted); }

    .cw-input {
      padding: .55rem .75rem;
      border: 1px solid var(--color-border-strong);
      border-radius: .4rem;
      background: var(--color-surface-1);
      color: var(--color-text-primary);
      font: inherit; font-size: .84rem;
      outline: none; transition: border-color .15s;
    }
    .cw-input:focus { border-color: var(--color-accent); }
    .cw-input--invalid { border-color: var(--color-danger, #e5534b); }
    .cw-input--icon { padding-left: 0; border: 0; background: transparent; flex: 1; }

    .cw-input-icon-wrap {
      display: flex; align-items: center; gap: .5rem;
      padding: .55rem .75rem;
      border: 1px solid var(--color-border-strong);
      border-radius: .4rem;
      background: var(--color-surface-1);
      color: var(--color-text-muted);
    }
    .cw-input-icon-wrap:focus-within { border-color: var(--color-accent); }

    .cw-field-error { font-size: .83rem; color: var(--color-danger, #e5534b); font-weight: 400; }

    .cw-submit {
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      padding: .65rem 1.2rem; margin-top: .4rem;
      border: 0; border-radius: .42rem;
      background: var(--color-accent); color: #fff;
      font: inherit; font-size: .85rem; font-weight: 650;
      cursor: pointer; transition: opacity .15s;
    }
    .cw-submit:disabled { opacity: .6; cursor: not-allowed; }
    .cw-submit:not(:disabled):hover { opacity: .9; }

    .cw-spinner {
      width: 1rem; height: 1rem;
      border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .65s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class CreateWorkspaceComponent {
  private readonly svc    = inject(WorkspaceService);
  private readonly router = inject(Router);

  readonly ArrowLeft  = ArrowLeft;
  readonly Upload     = Upload;
  readonly Building2  = Building2;

  name      = '';
  avatarUrl = '';

  readonly loading     = signal(false);
  readonly error       = signal<string | null>(null);
  readonly nameInvalid = signal(false);

  submit(): void {
    const trimmed = this.name.trim();
    if (!trimmed || trimmed.length > 100) {
      this.nameInvalid.set(true);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.svc.createWorkspace({
      name:      trimmed,
      avatarUrl: this.avatarUrl.trim() || null,
    }).subscribe({
      next: ws => {
        this.loading.set(false);
        this.router.navigate(['/workspaces', ws.id]);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message ?? 'Could not create workspace. Please try again.');
      },
    });
  }
}
