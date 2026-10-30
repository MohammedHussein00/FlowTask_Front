/** ClickUp reference fidelity: the workspace-switcher panel opened from the top-left workspace control. */
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule, Check, LayoutTemplate, Plus, SlidersHorizontal, Tag, Users, Wand2, Workflow } from 'lucide-angular';
import { WorkspaceSnapshot } from '../../../core/stores/workspace.store';

@Component({ selector: 'app-workspace-switcher', standalone: true, imports: [LucideAngularModule], changeDetection: ChangeDetectionStrategy.OnPush, template: `
  <div class="ws-backdrop" (click)="close.emit()"></div>
  <section class="ws-panel" role="menu" aria-label="Workspace switcher">
    <header>
      <span class="ws-avatar">
        @if (active()?.avatarUrl) { <img [src]="active()!.avatarUrl" [alt]="active()!.name" /> } @else { {{ activeInitial() }} }
      </span>
      <div><strong>{{ active()?.name ?? 'Select workspace' }}</strong><small>{{ memberSummary() }}</small></div>
    </header>
    <div class="ws-plan-bar"></div>

    <div class="ws-actions">
      <button type="button" (click)="openSettings.emit(); close.emit()"><lucide-icon [img]="SlidersHorizontal" size="15" />Settings</button>
      <button type="button" (click)="close.emit()"><lucide-icon [img]="Users" size="15" />People</button>
    </div>

    <p class="ws-label">SWITCH WORKSPACES</p>
    <div class="ws-list">
      @if (loading()) {
        <p class="ws-empty">Loading workspaces…</p>
      } @else if (!workspaces().length) {
        <p class="ws-empty">You're not in any workspaces yet.</p>
      } @else {
        @for (ws of workspaces(); track ws.id) {
          <button type="button" class="ws-item" [class.ws-item--active]="ws.id === activeId()" (click)="switchWorkspace.emit(ws.id); close.emit()">
            <span class="ws-item__avatar">
              @if (ws.avatarUrl) { <img [src]="ws.avatarUrl" [alt]="ws.name" /> } @else { {{ ws.name.charAt(0).toUpperCase() }} }
            </span>
            <span class="ws-item__name">{{ ws.name }}</span>
            @if (ws.id === activeId()) { <lucide-icon [img]="Check" size="14" class="ws-item__check" /> }
          </button>
        }
      }
    </div>

    <p class="ws-label">MANAGE</p>
    <button type="button" (click)="close.emit()"><lucide-icon [img]="Wand2" size="15" />Apps</button>
    <button type="button" (click)="close.emit()"><lucide-icon [img]="LayoutTemplate" size="15" />Templates</button>
    <button type="button" (click)="close.emit()"><lucide-icon [img]="SlidersHorizontal" size="15" />Custom Fields</button>
    <button type="button" (click)="close.emit()"><lucide-icon [img]="Workflow" size="15" />Automations</button>
    <button type="button" (click)="close.emit()"><lucide-icon [img]="Tag" size="15" />Tag Manager<span class="ws-badge">New</span></button>

    <button type="button" class="ws-create" (click)="createWorkspace.emit(); close.emit()"><lucide-icon [img]="Plus" size="15" />Create Workspace</button>
  </section>
`,
  styles: [`
    :host { display: contents; }
    .ws-backdrop { position: fixed; z-index: 30; inset: 0; }
    .ws-panel { position: absolute; z-index: 31; inset-inline-start: 0; inset-block-start: 100%; width: 19.55rem; overflow: hidden; color: var(--color-text-primary); background: var(--color-surface-1); border-inline-end: 1px solid var(--color-border); border-block-end: 1px solid var(--color-border); border-end-end-radius: .8rem; box-shadow: 0 1.4rem 3.2rem rgb(0 0 0 / .5); }
    .ws-panel header { display: flex; align-items: center; gap: .65rem; padding: .95rem 1rem .8rem; }
    .ws-avatar { flex: none; width: 2.4rem; height: 2.4rem; display: grid; place-items: center; overflow: hidden; border-radius: .55rem; color: #08341f; background: #35bd7d; font-size: 1rem; font-weight: 800; }
    .ws-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .ws-panel header strong { display: block; font-size: .9rem; }
    .ws-panel header small { display: block; margin-top: .1rem; color: var(--color-text-muted); font-size: .68rem; }
    .ws-plan-bar { height: .3rem; margin: 0 1rem .85rem; border-radius: .2rem; background: linear-gradient(90deg, #ff8a5c, #ff5c8a, #c15cff, #5c8aff, #35d0c7); }
    .ws-actions { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; padding: 0 1rem .7rem; }
    .ws-actions button { min-height: 2.05rem; display: inline-flex; align-items: center; justify-content: center; gap: .4rem; border: 1px solid var(--color-border-strong); border-radius: .45rem; color: var(--color-text-primary); background: transparent; font: inherit; font-size: .72rem; font-weight: 650; cursor: pointer; }
    .ws-actions button:hover { background: var(--color-surface-3); }
    .ws-label { margin: .3rem 1rem .3rem; color: var(--color-text-muted); font-size: .6rem; font-weight: 800; letter-spacing: .08em; }
    .ws-list { max-height: 11rem; overflow-y: auto; margin-bottom: .3rem; }
    .ws-empty { margin: 0 1rem .4rem; color: var(--color-text-muted); font-size: .72rem; }
    .ws-item { position: relative; width: calc(100% - 1.2rem); margin-inline: .6rem; min-height: 2.15rem; display: flex; align-items: center; gap: .55rem; padding: 0 .5rem; border: 0; border-radius: .4rem; color: var(--color-text-secondary); background: transparent; font: inherit; font-size: .76rem; font-weight: 550; text-align: start; cursor: pointer; }
    .ws-item:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .ws-item--active { color: var(--color-text-primary); background: var(--color-surface-3); }
    .ws-item__avatar { flex: none; width: 1.5rem; height: 1.5rem; display: grid; place-items: center; overflow: hidden; border-radius: .35rem; color: #fff; background: var(--color-accent); font-size: .66rem; font-weight: 750; }
    .ws-item__avatar img { width: 100%; height: 100%; object-fit: cover; }
    .ws-item__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ws-item__check { flex: none; color: var(--color-accent); }
    .ws-panel > button:not(.ws-create) { position: relative; width: calc(100% - 1.2rem); margin-inline: .6rem; min-height: 2rem; display: flex; align-items: center; gap: .55rem; padding: 0 .5rem; border: 0; border-radius: .4rem; color: var(--color-text-secondary); background: transparent; font: inherit; font-size: .74rem; font-weight: 550; text-align: start; cursor: pointer; }
    .ws-panel > button:not(.ws-create):hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .ws-badge { margin-inline-start: auto; padding: .1rem .4rem; border-radius: .25rem; color: #fff; background: var(--color-accent); font-size: .58rem; font-weight: 750; }
    .ws-create { width: calc(100% - 2rem); margin: .8rem 1rem 1rem; min-height: 2.15rem; display: flex; align-items: center; justify-content: center; gap: .4rem; border: 1px dashed var(--color-border-strong); border-radius: .5rem; color: var(--color-text-secondary); background: transparent; font: inherit; font-size: .74rem; font-weight: 650; cursor: pointer; }
    .ws-create:hover { color: var(--color-text-primary); border-color: var(--color-accent); }
  `],
})
export class AppWorkspaceSwitcherComponent {
  readonly Check = Check; readonly LayoutTemplate = LayoutTemplate; readonly Plus = Plus; readonly SlidersHorizontal = SlidersHorizontal;
  readonly Tag = Tag; readonly Users = Users; readonly Wand2 = Wand2; readonly Workflow = Workflow;

  /** All workspaces the current user belongs to (from GraphQL, via WorkspaceStore). */
  readonly workspaces = input<WorkspaceSnapshot[]>([]);
  /** Id of the currently-active workspace. */
  readonly activeId = input<number | null>(null);
  readonly loading = input(false);

  readonly close = output<void>();
  readonly openSettings = output<void>();
  readonly createWorkspace = output<void>();
  readonly switchWorkspace = output<number>();

  readonly active = computed(() => this.workspaces().find(w => w.id === this.activeId()) ?? null);
  readonly activeInitial = computed(() => (this.active()?.name ?? 'W').charAt(0).toUpperCase());
  readonly memberSummary = computed(() => {
    const count = this.active()?.memberCount ?? 0;
    return count === 1 ? '1 member' : `${count} members`;
  });
}
