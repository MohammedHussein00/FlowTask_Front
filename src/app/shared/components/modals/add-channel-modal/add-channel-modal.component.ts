/**
 * AddChannelModalComponent
 * ────────────────────────
 * Opened from two places — the sidebar's CHANNELS "+ Add Channel" row and the
 * space tab bar's "Add Channel" pill (see `ChannelModalService`) — both of
 * which just call `ChannelModalService.show()`, so this component is
 * self-sufficient: it reads/writes the shared open signal itself instead of
 * relying on a parent to wire up `(close)`.
 *
 * Flow: type a name → "Create Channel" → `submitting()` flips true (the
 * Create button shows a spinner and disables) → `ChannelService.createChannel`
 * resolves → the new channel is upserted into `ChannelStore`, the modal
 * closes, and the user is navigated straight to `/channels/:id`, landing on
 * the same page the sidebar link would take them to.
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Hash, Loader2, Lock, X } from 'lucide-angular';
import { NotificationService }    from '../../../../core/errors/notification.service';
import { ChannelService }         from '../../../../core/services/channel.service';
import { ChannelModalService }    from '../../../../core/services/channel-modal.service';
import { WorkspaceStore }         from '../../../../core/stores/workspace.store';
import { ComponentTranslatePipe } from '../../../../core/i18n/component-translate.pipe';
import { ComponentI18nService }   from '../../../../core/i18n/component-i18n.service';

@Component({
  selector: 'app-add-channel-modal',
  standalone: true,
  imports: [LucideAngularModule, ComponentTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="acm-backdrop" (click)="dismiss()">
    <section class="acm" (click)="$event.stopPropagation()" role="dialog" aria-modal="true"
      [attr.aria-label]="'title' | componentT:'add-channel-modal'">

      <header>
        <div>
          <h2>{{ 'title' | componentT:'add-channel-modal' }}</h2>
          <p>{{ 'description' | componentT:'add-channel-modal' }}</p>
        </div>
        <button type="button" class="acm-close" [attr.aria-label]="'close' | componentT:'add-channel-modal'"
          [disabled]="submitting()" (click)="dismiss()">
          <lucide-icon [img]="X" size="18" />
        </button>
      </header>

      <div class="acm-body">
        <label class="acm-label" for="acm-name">
          {{ 'nameLabel' | componentT:'add-channel-modal' }}
          <span class="acm-scope">{{ 'in' | componentT:'add-channel-modal' }} {{ workspaceName() }}</span>
        </label>
        <div class="acm-name-row">
          <lucide-icon class="acm-hash" [img]="isPrivate() ? Lock : Hash" size="15" />
          <input #nameInput id="acm-name" class="acm-input" type="text"
            [placeholder]="'namePlaceholder' | componentT:'add-channel-modal'"
            [value]="name()" maxlength="80" [disabled]="submitting()"
            (input)="name.set($any($event.target).value)"
            (keydown.enter)="submit()" />
        </div>

        <label class="acm-label acm-label--spaced" for="acm-topic">
          {{ 'topicLabel' | componentT:'add-channel-modal' }}
          <span>{{ 'topicOptional' | componentT:'add-channel-modal' }}</span>
        </label>
        <input id="acm-topic" class="acm-input" type="text"
          [placeholder]="'topicPlaceholder' | componentT:'add-channel-modal'"
          [value]="topic()" maxlength="120" [disabled]="submitting()"
          (input)="topic.set($any($event.target).value)" />

        <div class="acm-row">
          <div>
            <span class="acm-row__label">{{ 'makePrivate' | componentT:'add-channel-modal' }}</span>
            <p class="acm-row__hint">{{ 'makePrivateHint' | componentT:'add-channel-modal' }}</p>
          </div>
          <button type="button" class="acm-toggle" [class.acm-toggle--on]="isPrivate()"
            role="switch" [attr.aria-checked]="isPrivate()" [disabled]="submitting()"
            (click)="isPrivate.update(v => !v)">
            <span></span>
          </button>
        </div>

        @if (error()) { <p class="acm-error">{{ error() }}</p> }
      </div>

      <footer>
        <button type="button" class="acm-cancel" [disabled]="submitting()" (click)="dismiss()">
          {{ 'cancel' | componentT:'add-channel-modal' }}
        </button>
        <button type="button" class="acm-create" [disabled]="!canSubmit()" (click)="submit()">
          @if (submitting()) {
            <lucide-icon class="acm-spin" [img]="Loader2" size="15" />
            <span>{{ 'creating' | componentT:'add-channel-modal' }}</span>
          } @else {
            <span>{{ 'create' | componentT:'add-channel-modal' }}</span>
          }
        </button>
      </footer>
    </section>
  </div>
  `,
  styles: [`
    :host { display: contents; }

    .acm-backdrop {
      position: fixed; inset: 0; z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      padding: 1rem; background: rgb(0 0 0 / .55);
    }
    .acm {
      display: flex; flex-direction: column;
      width: 100%; max-width: 27rem; max-height: calc(100vh - 2rem);
      border: 1px solid var(--color-border-strong); border-radius: .8rem;
      background: var(--color-surface-2); color: var(--color-text-primary);
      box-shadow: 0 1.5rem 4rem rgb(0 0 0 / .55); overflow: hidden;
    }

    header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: .8rem; padding: 1.1rem 1.3rem .9rem;
      border-bottom: 1px solid var(--color-border);
    }
    header h2 { margin: 0 0 .3rem; font-size: 1.02rem; font-weight: 800; }
    header p { margin: 0; color: var(--color-text-secondary); font-size: .90rem; line-height: 1.45; }
    .acm-close {
      flex: none; width: 1.8rem; height: 1.8rem; display: grid; place-items: center;
      border: 0; border-radius: .4rem; color: var(--color-text-muted);
      background: transparent; cursor: pointer;
    }
    .acm-close:hover:not(:disabled) { color: var(--color-text-primary); background: var(--color-surface-3); }
    .acm-close:disabled { opacity: .5; cursor: not-allowed; }

    .acm-body { padding: 1.1rem 1.3rem; overflow-y: auto; }

    .acm-label {
      display: flex; align-items: baseline; justify-content: space-between; gap: .5rem;
      margin: 0 0 .35rem; color: var(--color-text-secondary); font-size: .85rem; font-weight: 650;
    }
    .acm-label--spaced { margin-top: .9rem; }
    .acm-label span { color: var(--color-text-muted); font-weight: 520; }
    .acm-scope { text-transform: none; }

    .acm-name-row {
      display: flex; align-items: center; gap: .45rem;
      padding-inline-start: .7rem;
      border: 1px solid var(--color-border-strong); border-radius: .5rem;
      background: var(--color-surface-1);
    }
    .acm-hash { flex: none; color: var(--color-text-muted); }
    .acm-name-row .acm-input { border: 0; background: transparent; padding-inline-start: 0; }

    .acm-input {
      width: 100%; min-height: 2.35rem; padding: 0 .75rem;
      border: 1px solid var(--color-border-strong); border-radius: .5rem;
      background: var(--color-surface-1); color: var(--color-text-primary);
      font: inherit; font-size: .82rem;
    }
    .acm-input::placeholder { color: var(--color-text-muted); }
    .acm-input:focus, .acm-name-row:has(.acm-input:focus) {
      outline: none; border-color: var(--color-accent);
    }
    .acm-input:disabled { opacity: .65; cursor: not-allowed; }

    .acm-row {
      display: flex; align-items: center; justify-content: space-between; gap: .8rem;
      margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border);
    }
    .acm-row__label { display: block; color: var(--color-text-primary); font-size: .8rem; font-weight: 650; }
    .acm-row__hint { margin: .2rem 0 0; color: var(--color-text-muted); font-size: .82rem; line-height: 1.4; }
    .acm-toggle {
      flex: none; width: 2.35rem; height: 1.3rem; padding: .15rem;
      border: 0; border-radius: 1rem; background: var(--color-border-strong); cursor: pointer;
    }
    .acm-toggle span {
      display: block; width: 1rem; height: 1rem; border-radius: 50%;
      background: #fff; transition: transform .15s ease;
    }
    .acm-toggle--on { background: var(--color-accent); }
    .acm-toggle--on span { transform: translateX(1.05rem); }
    :root[dir='rtl'] .acm-toggle--on span { transform: translateX(-1.05rem); }
    .acm-toggle:disabled { opacity: .6; cursor: not-allowed; }

    .acm-error { margin: .9rem 0 0; color: var(--color-danger, #e5534b); font-size: .90rem; font-weight: 600; }

    footer {
      display: flex; align-items: center; justify-content: flex-end; gap: .5rem;
      padding: .9rem 1.3rem; border-top: 1px solid var(--color-border);
    }
    .acm-cancel {
      min-height: 2.15rem; padding: 0 .95rem; border: 1px solid var(--color-border-strong);
      border-radius: .5rem; background: transparent; color: var(--color-text-secondary);
      font: inherit; font-size: .8rem; font-weight: 650; cursor: pointer;
    }
    .acm-cancel:hover:not(:disabled) { background: var(--color-surface-3); color: var(--color-text-primary); }
    .acm-cancel:disabled { opacity: .5; cursor: not-allowed; }

    .acm-create {
      display: inline-flex; align-items: center; gap: .45rem;
      min-height: 2.15rem; min-width: 8.4rem; justify-content: center;
      padding: 0 1.1rem; border: 0; border-radius: .5rem;
      color: #191919; background: #fff; font: inherit; font-size: .8rem; font-weight: 700; cursor: pointer;
    }
    .acm-create:disabled { opacity: .55; cursor: not-allowed; }
    .acm-create:not(:disabled):hover { filter: brightness(.94); }
    .acm-spin { animation: acm-spin .7s linear infinite; }
    @keyframes acm-spin { to { transform: rotate(360deg); } }
  `],
})
export class AddChannelModalComponent {
  private readonly channelService = inject(ChannelService);
  private readonly modal          = inject(ChannelModalService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly notifications  = inject(NotificationService);
  private readonly router         = inject(Router);
  private readonly i18n           = inject(ComponentI18nService);

  readonly X = X; readonly Hash = Hash; readonly Lock = Lock; readonly Loader2 = Loader2;

  readonly name        = signal('');
  readonly topic       = signal('');
  readonly isPrivate   = signal(false);
  readonly submitting  = signal(false);
  readonly error       = signal<string | null>(null);

  readonly workspaceName = computed(() => this.workspaceStore.activeWorkspace()?.name ?? '');
  readonly canSubmit     = computed(() => this.name().trim().length > 0 && !this.submitting());

  dismiss(): void {
    if (this.submitting()) return;
    this.modal.hide();
  }

  submit(): void {
    const name = this.name().trim();
    if (!name) { this.error.set(this.i18n.t('add-channel-modal', 'noName')); return; }
    if (this.workspaceStore.activeId() == null) {
      this.error.set(this.i18n.t('add-channel-modal', 'noWorkspace'));
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    this.channelService.createChannel({
      name,
      isPrivate: this.isPrivate(),
      topic: this.topic(),
    }).subscribe({
      next: channel => {
        this.submitting.set(false);
        this.modal.hide();
        this.notifications.success(
          this.i18n.t('add-channel-modal', 'channelCreated'),
          `#${channel.name} ${this.i18n.t('add-channel-modal', 'channelReadyMsg')}`,
        );
        this.router.navigateByUrl(`/channels/${channel.id}`);
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.error.set(err?.message ?? this.i18n.t('add-channel-modal', 'createError'));
      },
    });
  }
}
