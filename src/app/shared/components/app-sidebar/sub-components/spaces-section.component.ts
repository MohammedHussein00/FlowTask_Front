import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Star, Plus } from 'lucide-angular';
import { ComponentTranslatePipe } from '../../../../core/i18n/component-translate.pipe';
import { SpaceRowComponent, SidebarSpace } from './space-row.component';
import { SpaceContextService } from '../../../../features/space/space-context.service';

@Component({
  selector: 'app-spaces-section',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, ComponentTranslatePipe, SpaceRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nav-section spaces">
      <header>
        <p>{{ 'spaces' | componentT:'sidebar' }}</p>
        <button type="button" [attr.aria-label]="'addSpace' | componentT:'sidebar'" (click)="addSpace.emit()">
          <lucide-icon [img]="Plus" size="16"/>
        </button>
      </header>

      <a class="context-nav__item" routerLink="/all-tasks">
        <lucide-icon [img]="Star" size="16"/>
        <span>{{ 'allTasks' | componentT:'sidebar' }} <em>· {{ workspaceName() }}</em></span>
      </a>

      @if (loading() && !hasSpaces()) {
        <p class="space-empty">{{ 'loadingSpaces' | componentT:'sidebar' }}</p>
      } @else if (error() && !hasSpaces()) {
        <p class="space-empty space-empty--error">{{ error() }}</p>
      } @else if (!hasSpaces()) {
        <p class="space-empty">{{ 'noSpaces' | componentT:'sidebar' }}</p>
      } @else {
        @for (space of spaces(); track space.id) {
          <app-space-row
            [space]="space"
            [expanded]="expandedSpaceId() === space.id"
            (expandToggle)="toggleExpanded($event)"
            (createListModal)="createListModal.emit($event)"
            (createFolderModal)="createFolderModal.emit()"
            (createSprintModal)="createSprintModal.emit()"
            (createDocModal)="createDocModal.emit()"
            (createDashboard)="createDashboard.emit()"
            (createWhiteboard)="createWhiteboard.emit()"
            (createFormModal)="createFormModal.emit()"
            (createFromImport)="createFromImport.emit()"
            (createFromTemplate)="createFromTemplate.emit()" />
        }
      }

      <button class="space-child" type="button" (click)="addSpace.emit()">
        <lucide-icon [img]="Plus" size="14"/>{{ 'newSpace' | componentT:'sidebar' }}
      </button>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .nav-section { margin: .7rem 0; overflow: visible; }
    .nav-section > p, .nav-section header p { margin: 0 0 .3rem .6rem; color: var(--color-text-secondary); font-size: .84rem; font-weight: 600; }
    .nav-section header { display: flex; align-items: center; justify-content: space-between; }
    .nav-section header p { margin-bottom: 0; }
    .nav-section header button { width: 1.75rem; height: 1.75rem; display: grid; place-items: center; margin-inline-end: .1rem; margin-bottom: .3rem; border: 0; border-radius: .5rem; color: var(--color-text-secondary); background: var(--color-surface-3); cursor: pointer; padding: 0; }
    .nav-section header button:hover { color: var(--color-text-primary); filter: brightness(1.2); }
    .context-nav__item { width: 100%; min-height: 2.1rem; display: flex; align-items: center; gap: .65rem; padding: 0 .6rem; border: 0; border-radius: .5rem; color: var(--color-text-secondary); background: transparent; font: inherit; font-size: .875rem; font-weight: 500; text-align: start; text-decoration: none; cursor: pointer; }
    .context-nav__item:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .context-nav__item em { color: var(--color-text-muted); font-size: .78rem; font-style: normal; }
    .space-empty { margin: .1rem 0 .3rem .6rem; color: var(--color-text-muted); font-size: .8rem; }
    .space-empty--error { color: #e05c5c; }
    .space-child { width: 100%; min-height: 2.1rem; display: flex; align-items: center; gap: .65rem; padding: 0 .6rem; border: 0; border-radius: .5rem; color: var(--color-text-muted); background: transparent; font: inherit; font-size: .875rem; cursor: pointer; }
    .space-child:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
  `],
})
export class SpacesSectionComponent {
  readonly Star = Star;
  readonly Plus = Plus;
  readonly spaces        = input<SidebarSpace[]>([]);
  readonly loading       = input(false);
  readonly error         = input<string | null>(null);
  readonly hasSpaces     = input(false);
  readonly workspaceName = input('');
  readonly addSpace           = output<void>();
  readonly createListModal    = output<number>();
  readonly createFolderModal  = output<void>();
  readonly createSprintModal  = output<void>();
  readonly createDocModal     = output<void>();
  readonly createDashboard    = output<void>();
  readonly createWhiteboard   = output<void>();
  readonly createFormModal    = output<void>();
  readonly createFromImport   = output<void>();
  readonly createFromTemplate = output<void>();

  private readonly ctx = inject(SpaceContextService);

  /** Explicit user toggle overrides the "follow the route" default; null means "not overridden". */
  private readonly manualExpandId = signal<number | null>(null);

  /** The space matching the current route auto-expands; a manual click can override that. */
  readonly expandedSpaceId = computed(() => this.manualExpandId() ?? this.ctx.activeSpaceId() ?? 0);

  toggleExpanded(id: number): void {
    const current = this.expandedSpaceId();
    this.manualExpandId.set(current === id ? 0 : id);
  }

  constructor() {
    // Whenever the route lands on a different Space, let auto-expand take over again.
    effect(() => {
      if (this.ctx.activeSpaceId() != null) this.manualExpandId.set(null);
    });
  }
}
