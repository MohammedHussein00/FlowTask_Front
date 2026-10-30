/** ClickUp reference fidelity: the "Create Workspace" onboarding stepper. */
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import {
  LucideAngularModule, ArrowLeft, ArrowRight, Check, LayoutGrid, X,
} from 'lucide-angular';
import { NotificationService } from '../../../core/errors/notification.service';
import { WorkspaceService } from '../../../core/services/workspace.service';

interface WizardOption { id: string; label: string; initial?: string; }
interface WizardStep {
  title: string;
  kind: 'single' | 'multi' | 'email' | 'text';
  options?: WizardOption[];
  hint?: string;
  placeholder?: string;
}

const STEPS: WizardStep[] = [
  { title: 'What will you use this Workspace for?', kind: 'single', options: [
    { id: 'work', label: 'Work' }, { id: 'personal', label: 'Personal' }, { id: 'school', label: 'School' },
  ] },
  { title: 'What would you like to manage?', kind: 'multi', options: [
    { id: 'personal-use', label: 'Personal Use' }, { id: 'startup', label: 'Startup' }, { id: 'operations', label: 'Operations' },
    { id: 'support', label: 'Support' }, { id: 'it', label: 'IT' }, { id: 'marketing', label: 'Marketing' },
    { id: 'sales-crm', label: 'Sales & CRM' }, { id: 'finance', label: 'Finance & Accounting' }, { id: 'prof-services', label: 'Professional Services' },
    { id: 'pmo', label: 'PMO' }, { id: 'software-dev', label: 'Software Development' }, { id: 'hr', label: 'HR & Recruiting' },
    { id: 'creative', label: 'Creative & Design' }, { id: 'other', label: 'Other' },
  ] },
  { title: 'Invite people to your Workspace:', kind: 'email', placeholder: 'Enter email addresses (or paste multiple)', hint: "Don't do it alone – invite your team to get started 200% faster." },
  { title: 'Do you use any of these tools?', kind: 'multi', options: [
    { id: 'wrike', label: 'Wrike', initial: 'W' }, { id: 'google-drive', label: 'Google Drive', initial: 'G' }, { id: 'ms-teams', label: 'MS Teams', initial: 'T' },
    { id: 'jira', label: 'Jira', initial: 'J' }, { id: 'trello', label: 'Trello', initial: 'T' }, { id: 'notion', label: 'Notion', initial: 'N' },
    { id: 'todoist', label: 'Todoist', initial: 'T' }, { id: 'dropbox', label: 'Dropbox', initial: 'D' }, { id: 'figma', label: 'Figma', initial: 'F' },
    { id: 'monday', label: 'Monday', initial: 'M' }, { id: 'salesforce', label: 'Salesforce', initial: 'S' }, { id: 'github', label: 'GitHub', initial: 'G' },
    { id: 'zoom', label: 'Zoom', initial: 'Z' }, { id: 'slack', label: 'Slack', initial: 'S' }, { id: 'asana', label: 'Asana', initial: 'A' },
    { id: 'confluence', label: 'Confluence', initial: 'C' }, { id: 'excel-csv', label: 'Excel & CSV', initial: 'X' }, { id: 'basecamp', label: 'Basecamp', initial: 'B' },
  ] },
  { title: 'Which features are you interested in trying?', kind: 'multi', options: [
    { id: 'time-tracking', label: 'Time Tracking' }, { id: 'crm', label: 'CRM' }, { id: 'whiteboards', label: 'Whiteboards' }, { id: 'dashboards', label: 'Dashboards' },
    { id: 'calendar', label: 'Calendar' }, { id: 'docs-wikis', label: 'Docs & Wikis' }, { id: 'sprints', label: 'Sprints' }, { id: 'workload', label: 'Workload' },
    { id: 'boards-kanban', label: 'Boards & Kanban' }, { id: 'gantt', label: 'Gantt Charts' }, { id: 'chat', label: 'Chat' }, { id: 'clips', label: 'Clips' },
    { id: 'automations', label: 'Automations' }, { id: 'tasks-projects', label: 'Tasks & Projects' }, { id: 'forms', label: 'Forms' }, { id: 'goals', label: 'Goals & OKRs' },
    { id: 'ai', label: 'AI' }, { id: 'scheduling', label: 'Scheduling' },
  ] },
  { title: 'Lastly, what would you like to name your Workspace?', kind: 'text', placeholder: 'e.g. Acme Inc.', hint: 'Try the name of your company or organization.' },
];

@Component({ selector: 'app-create-workspace-wizard', standalone: true, imports: [LucideAngularModule], changeDetection: ChangeDetectionStrategy.OnPush, template: `
  <div class="wizard-backdrop" (click)="close.emit()">
    <section class="wizard" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-label="Create workspace">
      <header>
        <span class="wizard-brand"><lucide-icon [img]="LayoutGrid" size="18" />Flowspace</span>
        <button type="button" aria-label="Close" (click)="close.emit()"><lucide-icon [img]="X" size="18" /></button>
      </header>

      <div class="wizard-body">
        <h2>{{ step().title }}</h2>

        @switch (step().kind) {
          @case ('single') {
            <div class="pill-row">
              @for (option of step().options; track option.id) {
                <button type="button" class="pill" [class.selected]="singleValue() === option.id" (click)="singleValue.set(option.id)">{{ option.label }}</button>
              }
            </div>
          }
          @case ('multi') {
            <div class="pill-grid">
              @for (option of step().options; track option.id) {
                <button type="button" class="pill pill--tile" [class.selected]="multiValues().has(option.id)" (click)="toggleMulti(option.id)">
                  @if (option.initial) { <span class="tile-badge">{{ option.initial }}</span> }
                  {{ option.label }}
                  <span class="tile-radio" [class.checked]="multiValues().has(option.id)">@if (multiValues().has(option.id)) { <lucide-icon [img]="Check" size="11" /> }</span>
                </button>
              }
            </div>
          }
          @case ('email') {
            <input class="text-field" type="text" [placeholder]="step().placeholder" [value]="emailValue()" (input)="emailValue.set($any($event.target).value)" />
            @if (step().hint) { <p class="wizard-tip">📍 {{ step().hint }}</p> }
          }
          @case ('text') {
            <input class="text-field" type="text" [placeholder]="step().placeholder" [value]="textValue()" (input)="textValue.set($any($event.target).value)" />
            @if (step().hint) { <p class="wizard-hint">{{ step().hint }}</p> }
            @if (error()) { <p class="wizard-error">{{ error() }}</p> }
          }
        }
      </div>

      <div class="wizard-progress"><i [style.width.%]="progress()"></i></div>

      <footer>
        @if (index() > 0) { <button type="button" class="ghost" [disabled]="submitting()" (click)="back()"><lucide-icon [img]="ArrowLeft" size="15" />Back</button> } @else { <span></span> }
        @if (isLastStep()) {
          <button type="button" class="primary" [disabled]="submitting()" (click)="finish()">
            @if (submitting()) { Creating… } @else { <lucide-icon [img]="Check" size="15" />Finish }
          </button>
        } @else {
          <button type="button" class="primary" [disabled]="!canAdvance()" (click)="next()">Next<lucide-icon [img]="ArrowRight" size="15" /></button>
        }
      </footer>
    </section>
  </div>
`,
  styles: [`
    :host { display: contents; }
    .wizard-backdrop { position: fixed; z-index: 55; inset: 0; display: grid; place-items: center; padding: 1rem; background: rgb(5 5 8 / .72); backdrop-filter: blur(3px); }
    .wizard { width: min(46rem, 100%); max-height: min(34rem, calc(100vh - 2rem)); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--color-border-strong); border-radius: 1rem; color: var(--color-text-primary); background: var(--color-surface-1); box-shadow: 0 2rem 5rem rgb(0 0 0 / .55); }
    .wizard header { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 1.3rem; }
    .wizard-brand { display: inline-flex; align-items: center; gap: .5rem; color: var(--color-text-primary); font-size: .95rem; font-weight: 800; }
    .wizard-brand lucide-icon { color: var(--color-accent); }
    .wizard header > button { width: 1.9rem; height: 1.9rem; display: grid; place-items: center; border: 0; border-radius: .4rem; color: var(--color-text-muted); background: transparent; cursor: pointer; }
    .wizard header > button:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .wizard-body { flex: 1; overflow-y: auto; padding: 1.5rem 2.2rem 1rem; }
    .wizard-body h2 { max-width: 30rem; margin: 0 0 1.3rem; font-size: 1.35rem; line-height: 1.3; }
    .pill-row { display: flex; flex-wrap: wrap; gap: .65rem; }
    .pill { min-height: 2.4rem; padding: 0 1.15rem; border: 1.5px solid var(--color-border-strong); border-radius: 1.4rem; color: var(--color-text-primary); background: transparent; font: inherit; font-size: .8rem; font-weight: 650; cursor: pointer; }
    .pill:hover { background: var(--color-surface-3); }
    .pill.selected { border-color: var(--color-accent); background: var(--color-accent-soft); color: var(--color-accent-bright); }
    .pill-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: .55rem; }
    .pill--tile { position: relative; min-height: 2.4rem; display: flex; align-items: center; justify-content: flex-start; gap: .5rem; padding-inline: .8rem 1.8rem; text-align: start; }
    .tile-badge { flex: none; width: 1.15rem; height: 1.15rem; display: grid; place-items: center; border-radius: .3rem; color: #fff; background: var(--color-text-muted); font-size: .58rem; font-weight: 800; }
    .tile-radio { position: absolute; inset-inline-end: .7rem; width: .95rem; height: .95rem; display: grid; place-items: center; border: 1.5px solid var(--color-border-strong); border-radius: 50%; color: #fff; }
    .tile-radio.checked { border-color: var(--color-accent); background: var(--color-accent); }
    .text-field { width: 100%; min-height: 2.75rem; padding: 0 .9rem; border: 1.5px solid var(--color-border-strong); border-radius: .55rem; color: var(--color-text-primary); background: var(--color-surface-2); font: inherit; font-size: .85rem; }
    .text-field:focus { outline: 0; border-color: var(--color-accent); }
    .wizard-tip { display: inline-flex; align-items: center; gap: .4rem; margin: .8rem 0 0; padding: .5rem .75rem; border-radius: .5rem; color: var(--color-success-text); background: var(--color-success-soft); font-size: .74rem; font-weight: 600; }
    .wizard-hint { margin: .5rem 0 0; color: var(--color-text-muted); font-size: .74rem; }
    .wizard-error { margin: .6rem 0 0; color: var(--color-danger, #e5534b); font-size: .76rem; font-weight: 600; }
    .wizard-progress { height: .22rem; background: var(--color-border); }
    .wizard-progress > i { display: block; height: 100%; background: var(--color-text-primary); transition: width .2s ease; }
    footer { display: flex; align-items: center; justify-content: space-between; padding: .9rem 1.3rem; }
    footer .ghost { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.15rem; padding: 0 .9rem; border: 1.5px solid var(--color-border-strong); border-radius: .5rem; color: var(--color-text-primary); background: transparent; font: inherit; font-size: .78rem; font-weight: 650; cursor: pointer; }
    footer .ghost:hover { background: var(--color-surface-3); }
    footer .ghost:disabled { opacity: .45; cursor: not-allowed; }
    footer .primary { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.15rem; padding: 0 1.1rem; border: 0; border-radius: .5rem; color: #17181b; background: #fff; font: inherit; font-size: .78rem; font-weight: 700; cursor: pointer; }
    footer .primary:disabled { opacity: .45; cursor: not-allowed; }
    footer .primary:not(:disabled):hover { filter: brightness(.94); }
    @media (max-width: 640px) { .wizard-body { padding: 1.2rem 1.2rem .8rem; }.pill-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
  `],
})
export class CreateWorkspaceWizardComponent {
  private readonly notifications = inject(NotificationService);
  private readonly workspaceService = inject(WorkspaceService);

  readonly close = output<void>();
  /** Emits the id of the newly-created workspace once the GraphQL mutation succeeds. */
  readonly created = output<number>();

  readonly index = signal(0);
  readonly step = computed(() => STEPS[this.index()]);
  readonly isLastStep = computed(() => this.index() === STEPS.length - 1);
  readonly progress = computed(() => ((this.index() + 1) / STEPS.length) * 100);

  readonly singleValue = signal<string | null>(null);
  readonly multiValues = signal<Set<string>>(new Set());
  readonly emailValue = signal('');
  readonly textValue = signal('');
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly LayoutGrid = LayoutGrid; readonly ArrowLeft = ArrowLeft; readonly ArrowRight = ArrowRight;
  readonly Check = Check; readonly X = X;

  readonly canAdvance = computed(() => {
    const step = this.step();
    if (step.kind === 'single') return this.singleValue() !== null;
    return true; // multi/email steps are optional in the reference flow
  });

  toggleMulti(id: string): void {
    this.multiValues.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  next(): void {
    this.singleValue.set(null);
    this.index.update(value => Math.min(value + 1, STEPS.length - 1));
  }

  back(): void {
    this.singleValue.set(null);
    this.error.set(null);
    this.index.update(value => Math.max(value - 1, 0));
  }

  /** Calls the real CreateWorkspace GraphQL mutation and updates the WorkspaceStore on success. */
  finish(): void {
    const name = this.textValue().trim();
    if (!name) {
      this.error.set('Please enter a workspace name.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    this.workspaceService.createWorkspace({ name, avatarUrl: null }).subscribe({
      next: ws => {
        this.submitting.set(false);
        this.notifications.success('Workspace created', `"${ws.name}" is ready to go.`);
        this.created.emit(ws.id);
        this.close.emit();
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.error.set(err.message ?? 'Could not create workspace. Please try again.');
      },
    });
  }
}
