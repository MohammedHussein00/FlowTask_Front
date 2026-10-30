import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { LucideAngularModule, Check, ChevronDown, Info, X, ListTodo, Megaphone, FolderKanban, Cpu } from 'lucide-angular';
import { NotificationService } from '../../../../core/errors/notification.service';
import { SpaceService }        from '../../../../core/services/space.service';
import { WorkspaceStore }      from '../../../../core/stores/workspace.store';
import { ComponentTranslatePipe } from '../../../../core/i18n/component-translate.pipe';
import { ComponentI18nService }   from '../../../../core/i18n/component-i18n.service';

const SPACE_COLORS = ['#5B9BD5', '#E8834E', '#DE5D83', '#8E5FE0', '#3FA772', '#D6B32C', '#4EA6A6', '#7B7F87'];
interface PermissionOption { id: string; label: string; description: string; }

type WorkflowId = 'starter' | 'marketing' | 'project' | 'product';
interface WorkflowOption { id: WorkflowId; label: string; description: string; }

@Component({
  selector: 'app-new-space-modal',
  standalone: true,
  imports: [LucideAngularModule, ComponentTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="nsm-backdrop" (click)="close.emit()">
    <section class="nsm" (click)="$event.stopPropagation()" role="dialog" aria-modal="true"
      [attr.aria-label]="'title' | componentT:'new-space-modal'">

      <header>
        <div>
          @if (step() === 1) {
            <h2>{{ 'title' | componentT:'new-space-modal' }}</h2>
            <p>{{ 'description' | componentT:'new-space-modal' }}</p>
          } @else {
            <h2>Define your workflow</h2>
            <p>Choose a pre-configured solution or customize to your liking with advanced ClickApps, required views, and task statuses.</p>
          }
        </div>
        <button type="button" [attr.aria-label]="'close' | componentT:'new-space-modal'" (click)="close.emit()">
          <lucide-icon [img]="X" size="18" />
        </button>
      </header>

      <!-- ── STEP 1: Space details ── -->
      @if (step() === 1) {
        <div class="nsm-body">
          <label class="nsm-label">{{ 'iconNameLabel' | componentT:'new-space-modal' }}</label>
          <div class="nsm-name-row">
            <div class="nsm-swatch-wrap">
              <button type="button" class="nsm-swatch" [style.background]="color()"
                (click)="colorPickerOpen.update(v => !v)">{{ initial() }}</button>
              @if (colorPickerOpen()) {
                <div class="nsm-swatch-backdrop" (click)="colorPickerOpen.set(false)"></div>
                <div class="nsm-swatch-panel" role="menu" [attr.aria-label]="'spaceColor' | componentT:'new-space-modal'">
                  @for (c of colors; track c) {
                    <button type="button" class="nsm-swatch-option" [style.background]="c"
                      [class.selected]="c === color()" [attr.aria-label]="c"
                      (click)="color.set(c); colorPickerOpen.set(false)">
                      @if (c === color()) { <lucide-icon [img]="Check" size="12" /> }
                    </button>
                  }
                </div>
              }
            </div>
            <input class="nsm-input" type="text"
              [placeholder]="'namePlaceholder' | componentT:'new-space-modal'"
              [value]="name()"
              (input)="name.set($any($event.target).value)" maxlength="100" />
          </div>

          <label class="nsm-label nsm-label--spaced">
            {{ 'descriptionLabel' | componentT:'new-space-modal' }}
            <span>{{ 'descriptionOptional' | componentT:'new-space-modal' }}</span>
          </label>
          <textarea class="nsm-textarea" rows="2" [value]="description()"
            (input)="description.set($any($event.target).value)"></textarea>

          <div class="nsm-row">
            <span class="nsm-row__label">
              <lucide-icon [img]="Info" size="14" />{{ 'defaultPermission' | componentT:'new-space-modal' }}
            </span>
            <div class="nsm-perm-wrap">
              <button type="button" class="nsm-perm-trigger" (click)="permissionOpen.update(v => !v)">
                {{ activePermission().label }}<lucide-icon [img]="ChevronDown" size="14" />
              </button>
              @if (permissionOpen()) {
                <div class="nsm-swatch-backdrop" (click)="permissionOpen.set(false)"></div>
                <div class="nsm-perm-panel" role="menu"
                  [attr.aria-label]="'defaultPermission' | componentT:'new-space-modal'">
                    @for (option of permissionOptions(); track option.id){
                      <button type="button" class="nsm-perm-option"
                      (click)="permission.set(option.id); permissionOpen.set(false)">
                      <span class="nsm-perm-option__head">
                        {{ option.label }}
                        @if (option.id === permission()) { <lucide-icon [img]="Check" size="14" /> }
                      </span>
                      <span class="nsm-perm-option__desc">{{ option.description }}</span>
                    </button>
                  }
                </div>
              }
            </div>
          </div>

          <div class="nsm-row">
            <div>
              <span class="nsm-row__label">{{ 'makePrivate' | componentT:'new-space-modal' }}</span>
              <p class="nsm-row__hint">{{ 'makePrivateHint' | componentT:'new-space-modal' }}</p>
            </div>
            <button type="button" class="nsm-toggle" [class.nsm-toggle--on]="isPrivate()"
              role="switch" [attr.aria-checked]="isPrivate()" (click)="isPrivate.update(v => !v)">
              <span></span>
            </button>
          </div>

          @if (error()) { <p class="nsm-error">{{ error() }}</p> }
        </div>

        <footer>
          <button type="button" class="nsm-templates" [disabled]="submitting()">
            {{ 'useTemplates' | componentT:'new-space-modal' }}
          </button>
          <button type="button" class="nsm-continue" [disabled]="!canSubmit()" (click)="goToStep2()">
            {{ 'continue' | componentT:'new-space-modal' }}
          </button>
        </footer>
      }

      <!-- ── STEP 2: Workflow ── -->
      @if (step() === 2) {
        <div class="nsm-body">
          <!-- Workflow grid -->
          <div class="wf-grid">
            @for (w of workflowOptions; track w.id) {
              <button type="button" class="wf-card" [class.wf-card--active]="workflow() === w.id"
                (click)="workflow.set(w.id)">
                <span class="wf-card__title">{{ w.label }}</span>
                <span class="wf-card__desc">{{ w.description }}</span>
              </button>
            }
          </div>

          <!-- Customize defaults sub-section -->
          <p class="wf-sub-label">Customize defaults for <strong>{{ activeWorkflow().label }}</strong></p>

          <div class="wf-detail-list">
            <button type="button" class="wf-detail-item">
              <span class="wf-detail-item__icon"><lucide-icon [img]="ListTodo" size="16" /></span>
              <div>
                <span class="wf-detail-item__title">Default views</span>
                <span class="wf-detail-item__desc">List, Board</span>
              </div>
              <lucide-icon class="wf-detail-item__chev" [img]="ChevronDown" size="14" />
            </button>

            <button type="button" class="wf-detail-item">
              <span class="wf-detail-item__icon wf-detail-item__icon--target">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="3.5" stroke="currentColor" stroke-width="1.5"/></svg>
              </span>
              <div>
                <span class="wf-detail-item__title">Task statuses</span>
                <span class="wf-detail-item__desc">
                  <span class="wf-status wf-status--todo">TO DO</span>
                  <span class="wf-status-arrow">→</span>
                  <span class="wf-status wf-status--progress">IN PROGRESS</span>
                  <span class="wf-status-arrow">→</span>
                  <span class="wf-status wf-status--done">COMPLETE</span>
                </span>
              </div>
              <lucide-icon class="wf-detail-item__chev" [img]="ChevronDown" size="14" />
            </button>

            <button type="button" class="wf-detail-item">
              <span class="wf-detail-item__icon"><lucide-icon [img]="Cpu" size="16" /></span>
              <div>
                <span class="wf-detail-item__title">ClickApps</span>
                <span class="wf-detail-item__desc">Tags, Time Estimates, Priority, Time Tracking, Incomplete Warning,…</span>
              </div>
              <lucide-icon class="wf-detail-item__chev" [img]="ChevronDown" size="14" />
            </button>
          </div>

          @if (error()) { <p class="nsm-error">{{ error() }}</p> }
        </div>

        <footer>
          <button type="button" class="nsm-templates" (click)="step.set(1)">Back</button>
          <button type="button" class="nsm-continue" [disabled]="submitting()" (click)="submit()">
            @if (submitting()) {
              {{ 'creating' | componentT:'new-space-modal' }}
            } @else {
              Create Space
            }
          </button>
        </footer>
      }

    </section>
  </div>
  `,
  styles: [`
    :host { display: contents; }
    .nsm-backdrop { position: fixed; z-index: 55; inset: 0; display: grid; place-items: center; padding: 1rem; background: rgb(5 5 8 / .72); backdrop-filter: blur(3px); }
    .nsm { width: min(34rem, 100%); max-height: min(40rem, calc(100vh - 2rem)); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--color-border-strong); border-radius: 1rem; color: var(--color-text-primary); background: var(--color-surface-1); box-shadow: 0 2rem 5rem rgb(0 0 0 / .55); }
    .nsm header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1.3rem 1.4rem 1rem; }
    .nsm header h2 { margin: 0 0 .35rem; font-size: 1.15rem; }
    .nsm header p { margin: 0; max-width: 26rem; color: var(--color-text-muted); font-size: .90rem; line-height: 1.45; }
    .nsm header > button { flex: none; width: 1.9rem; height: 1.9rem; display: grid; place-items: center; border: 0; border-radius: .4rem; color: var(--color-text-muted); background: transparent; cursor: pointer; }
    .nsm header > button:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .nsm-body { flex: 1; overflow-y: auto; padding: 0 1.4rem 1.2rem; scrollbar-width: thin; scrollbar-color: var(--color-border) transparent; }
    .nsm-body::-webkit-scrollbar { width: .35rem; }
    .nsm-body::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: .3rem; }

    /* Step 1 */
    .nsm-label { display: block; margin: 0 0 .5rem; font-size: .82rem; font-weight: 650; }
    .nsm-label--spaced { margin-top: 1.1rem; }
    .nsm-label span { color: var(--color-text-muted); font-weight: 500; }
    .nsm-name-row { display: flex; align-items: center; gap: .6rem; }
    .nsm-swatch-wrap { position: relative; flex: none; }
    .nsm-swatch { width: 2.6rem; height: 2.6rem; display: grid; place-items: center; border: 0; border-radius: .5rem; color: #fff; font-size: .95rem; font-weight: 800; cursor: pointer; }
    .nsm-swatch-backdrop { position: fixed; z-index: 5; inset: 0; }
    .nsm-swatch-panel { position: absolute; z-index: 6; inset-block-start: calc(100% + .4rem); inset-inline-start: 0; display: grid; grid-template-columns: repeat(4, 1.7rem); gap: .5rem; padding: .6rem; border: 1px solid var(--color-border-strong); border-radius: .6rem; background: var(--color-surface-2); box-shadow: 0 1rem 2.4rem rgb(0 0 0 / .5); }
    .nsm-swatch-option { width: 1.7rem; height: 1.7rem; display: grid; place-items: center; border: 2px solid transparent; border-radius: .35rem; color: #fff; cursor: pointer; }
    .nsm-swatch-option.selected { border-color: var(--color-text-primary); }
    .nsm-input { flex: 1; min-height: 2.6rem; padding: 0 .9rem; border: 1.5px solid var(--color-border-strong); border-radius: .55rem; color: var(--color-text-primary); background: var(--color-surface-2); font: inherit; font-size: .85rem; }
    .nsm-input:focus { outline: 0; border-color: var(--color-accent); }
    .nsm-textarea { width: 100%; padding: .65rem .9rem; border: 1.5px solid var(--color-border-strong); border-radius: .55rem; color: var(--color-text-primary); background: var(--color-surface-2); font: inherit; font-size: .82rem; resize: vertical; box-sizing: border-box; }
    .nsm-textarea:focus { outline: 0; border-color: var(--color-accent); }
    .nsm-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-top: 1.3rem; }
    .nsm-row__label { display: inline-flex; align-items: center; gap: .35rem; font-size: .82rem; font-weight: 650; }
    .nsm-row__hint { margin: .2rem 0 0; color: var(--color-text-muted); font-size: .85rem; }
    .nsm-perm-wrap { position: relative; }
    .nsm-perm-trigger { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.1rem; padding: 0 .8rem; border: 1.5px solid var(--color-border-strong); border-radius: .5rem; color: var(--color-text-primary); background: transparent; font: inherit; font-size: .90rem; font-weight: 650; cursor: pointer; }
    .nsm-perm-trigger:hover { background: var(--color-surface-3); }
    .nsm-perm-panel { position: absolute; z-index: 6; inset-block-start: calc(100% + .4rem); inset-inline-end: 0; width: 17.5rem; overflow: hidden; border: 1px solid var(--color-border-strong); border-radius: .7rem; background: var(--color-surface-2); box-shadow: 0 1.2rem 3rem rgb(0 0 0 / .55); }
    .nsm-perm-option { display: block; width: 100%; padding: .7rem .9rem; border: 0; border-bottom: 1px solid var(--color-border); background: transparent; text-align: start; cursor: pointer; }
    .nsm-perm-option:last-child { border-bottom: 0; }
    .nsm-perm-option:hover { background: var(--color-surface-3); }
    .nsm-perm-option__head { display: flex; align-items: center; justify-content: space-between; color: var(--color-text-primary); font-size: .8rem; font-weight: 700; }
    .nsm-perm-option__head lucide-icon { color: var(--color-accent); }
    .nsm-perm-option__desc { display: block; margin-top: .2rem; color: var(--color-text-muted); font-size: .82rem; line-height: 1.4; }
    .nsm-toggle { flex: none; width: 2.35rem; height: 1.3rem; padding: .15rem; border: 0; border-radius: 1rem; background: var(--color-border-strong); cursor: pointer; }
    .nsm-toggle span { display: block; width: 1rem; height: 1rem; border-radius: 50%; background: #fff; transition: transform .15s ease; }
    .nsm-toggle--on { background: var(--color-accent); }
    .nsm-toggle--on span { transform: translateX(1.05rem); }
    .nsm-error { margin: 1rem 0 0; color: var(--color-danger, #e5534b); font-size: .90rem; font-weight: 600; }

    /* Footer */
    footer { display: flex; align-items: center; justify-content: space-between; padding: .9rem 1.4rem; border-top: 1px solid var(--color-border); }
    .nsm-templates { min-height: 2.15rem; padding: 0 .3rem; border: 0; background: transparent; color: var(--color-text-secondary); font: inherit; font-size: .90rem; font-weight: 650; text-decoration: underline; cursor: pointer; }
    .nsm-templates:disabled { opacity: .5; cursor: not-allowed; }
    .nsm-continue { min-height: 2.15rem; padding: 0 1.3rem; border: 0; border-radius: .5rem; color: #191919; background: #fff; font: inherit; font-size: .8rem; font-weight: 700; cursor: pointer; }
    .nsm-continue:disabled { opacity: .45; cursor: not-allowed; }
    .nsm-continue:not(:disabled):hover { filter: brightness(.94); }

    /* Step 2 — Workflow */
    .wf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; }
    .wf-card { display: flex; flex-direction: column; align-items: flex-start; gap: .22rem; padding: .8rem 1rem; border: 1.5px solid var(--color-border-strong); border-radius: .65rem; background: transparent; text-align: start; cursor: pointer; transition: border-color .15s, background .15s; }
    .wf-card:hover { background: var(--color-surface-3); }
    .wf-card--active { border-color: var(--color-accent); background: var(--color-accent-soft); }
    .wf-card__title { color: var(--color-text-primary); font-size: .82rem; font-weight: 700; }
    .wf-card__desc { color: var(--color-text-muted); font-size: .83rem; }

    .wf-sub-label { margin: 1.1rem 0 .55rem; color: var(--color-text-secondary); font-size: .90rem; }
    .wf-sub-label strong { color: var(--color-text-primary); }

    .wf-detail-list { display: flex; flex-direction: column; gap: .4rem; }
    .wf-detail-item { display: flex; align-items: center; gap: .7rem; padding: .75rem .9rem; border: 1.5px solid var(--color-border-strong); border-radius: .6rem; background: transparent; text-align: start; cursor: pointer; width: 100%; }
    .wf-detail-item:hover { background: var(--color-surface-3); }
    .wf-detail-item__icon { flex: none; width: 2rem; height: 2rem; display: grid; place-items: center; border-radius: .4rem; background: var(--color-surface-3); color: var(--color-text-secondary); }
    .wf-detail-item__icon--target { color: var(--color-accent); }
    .wf-detail-item div { flex: 1; min-width: 0; }
    .wf-detail-item__title { display: block; color: var(--color-text-primary); font-size: .8rem; font-weight: 650; }
    .wf-detail-item__desc { display: flex; align-items: center; flex-wrap: wrap; gap: .25rem; color: var(--color-text-muted); font-size: .82rem; margin-top: .12rem; }
    .wf-detail-item__chev { flex: none; color: var(--color-text-muted); margin-inline-start: auto; }
    .wf-status { padding: .1rem .35rem; border-radius: .25rem; font-size: .75rem; font-weight: 700; letter-spacing: .02em; }
    .wf-status--todo    { background: rgb(110 114 126 / .2); color: var(--color-text-muted); }
    .wf-status--progress { background: rgb(132 87 224 / .18); color: #cba5f7; }
    .wf-status--done    { background: rgb(57 201 138 / .18); color: var(--color-success-text); }
    .wf-status-arrow    { color: var(--color-text-muted); font-size: .75rem; }
  `],
})
export class NewSpaceModalComponent {
  private readonly notifications = inject(NotificationService);
  private readonly spaceService  = inject(SpaceService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly i18n = inject(ComponentI18nService);

  readonly close   = output<void>();
  readonly created = output<number>();

  readonly Check = Check; readonly ChevronDown = ChevronDown;
  readonly Info  = Info;  readonly X = X;
  readonly ListTodo = ListTodo; readonly Cpu = Cpu;

  readonly colors = SPACE_COLORS;

  readonly workflowOptions: WorkflowOption[] = [
    { id: 'starter',   label: 'Starter',           description: 'For everyday tasks' },
    { id: 'marketing', label: 'Marketing Teams',    description: 'Run effective campaigns' },
    { id: 'project',   label: 'Project Management', description: 'Plan, manage, and execute projects' },
    { id: 'product',   label: 'Product + Engineering', description: 'Streamline your product lifecycle' },
  ];

  /** Permission options are translated lazily via i18n service. */
  readonly permissionOptions = computed<PermissionOption[]>(() => [
    { id: 'full-edit', label: this.i18n.t('new-space-modal', 'permFullEdit',    'Full edit'),
      description: this.i18n.t('new-space-modal', 'permFullEditDesc',  "Can create and edit entities in this Space. Owners and admins can manage Space settings.") },
    { id: 'edit',      label: this.i18n.t('new-space-modal', 'permEdit',        'Edit'),
      description: this.i18n.t('new-space-modal', 'permEditDesc',      "Can create and edit entities in this Space. Can't manage Space settings or delete entities.") },
    { id: 'comment',   label: this.i18n.t('new-space-modal', 'permComment',     'Comment'),
      description: this.i18n.t('new-space-modal', 'permCommentDesc',   "Can comment on entities within this Space. Can't manage Space settings or edit entities.") },
    { id: 'view-only', label: this.i18n.t('new-space-modal', 'permViewOnly',    'View only'),
      description: this.i18n.t('new-space-modal', 'permViewOnlyDesc',  "Read-only. Can't edit entities or comment in this Space outside of Chat.") },
  ]);

  readonly step        = signal<1 | 2>(1);
  readonly name        = signal('');
  readonly description = signal('');
  readonly color       = signal(SPACE_COLORS[0]);
  readonly isPrivate   = signal(false);
  readonly permission  = signal('full-edit');
  readonly workflow    = signal<WorkflowId>('starter');
  readonly colorPickerOpen = signal(false);
  readonly permissionOpen  = signal(false);
  readonly submitting      = signal(false);
  readonly error           = signal<string | null>(null);

  readonly initial          = computed(() => this.name().trim().charAt(0).toUpperCase() || 'S');
  readonly activePermission = computed(() => this.permissionOptions().find(p => p.id === this.permission()) ?? this.permissionOptions()[0]);
  readonly activeWorkflow   = computed(() => this.workflowOptions.find(w => w.id === this.workflow()) ?? this.workflowOptions[0]);
  readonly canSubmit        = computed(() => this.name().trim().length > 0 && !this.submitting());

  goToStep2(): void {
    const name = this.name().trim();
    if (!name) { this.error.set(this.i18n.t('new-space-modal', 'noName')); return; }
    this.error.set(null);
    this.step.set(2);
  }

  submit(): void {
    const workspaceId = this.workspaceStore.activeId();
    const name = this.name().trim();
    if (!workspaceId) { this.error.set(this.i18n.t('new-space-modal', 'noWorkspace')); return; }
    if (!name)        { this.error.set(this.i18n.t('new-space-modal', 'noName'));      return; }
    this.submitting.set(true);
    this.error.set(null);
    this.spaceService.createSpace({ workspaceId, name, isPrivate: this.isPrivate(), color: this.color(), avatarUrl: null }).subscribe({
      next: space => {
        this.submitting.set(false);
        this.notifications.success(
          this.i18n.t('new-space-modal', 'spaceCreated'),
          `"${space.name}" ${this.i18n.t('new-space-modal', 'spaceReadyMsg')}`,
        );
        this.created.emit(space.id);
        this.close.emit();
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.error.set(err.message ?? this.i18n.t('new-space-modal', 'createError'));
      },
    });
  }
}
