import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, inject,
  input, output, signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule,
  ChevronRight, ChevronDown, Lock, MoreHorizontal, Plus, ListTodo,
} from 'lucide-angular';
import { NzPopoverModule, NzPopoverDirective } from 'ng-zorro-antd/popover';
import { SpaceContextMenuComponent } from '../popovers/space-context-menu.component';
import { CreateMenuComponent } from '../popovers/create-menu.component';
import { SpaceListStore } from '../../../../core/stores/space-list.store';

export interface SidebarSpace {
  id: number;
  name: string;
  color: string;
  isPrivate?: boolean;
}

@Component({
  selector: 'app-space-row',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive, LucideAngularModule,
    NzPopoverModule, SpaceContextMenuComponent, CreateMenuComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-row-wrap"
      (mouseenter)="hovered.set(true)"
      (mouseleave)="hovered.set(false)">

      @if (hovered()) {
        <div class="space-tooltip">Create Folders, Lists, Docs and more</div>
      }

      <!-- Navigate to space overview when clicking the space row -->
      <a class="space-row"
        [routerLink]="['/spaces', space().id, 'overview']"
        routerLinkActive="space-row--selected">
        <button class="space-chevron" type="button"
          (click)="$event.preventDefault(); expandToggle.emit(space().id)">
          <lucide-icon [img]="expanded() ? ChevronDown : ChevronRight" size="12"/>
        </button>
        <b class="space-badge" [style.background]="space().color">
          {{ space().name.charAt(0).toUpperCase() }}
        </b>
        <span class="space-name">{{ space().name }}</span>
        @if (space().isPrivate) {
          <lucide-icon [img]="Lock" size="12" class="space-row__lock"/>
        }

        <div class="space-row-actions">
          <!-- ··· 3-dots context menu ··· -->
          <button class="space-action-btn" type="button"
            #contextRef="nzPopover"
            nz-popover
            [nzPopoverContent]="contextTpl"
            nzPopoverTrigger="click"
            nzPopoverPlacement="rightTop"
            nzPopoverOverlayClassName="sb-popover"
            (nzPopoverVisibleChange)="onOpen($event, contextRef)"
            (click)="$event.preventDefault(); $event.stopPropagation()">
            <lucide-icon [img]="MoreHorizontal" size="14"/>
          </button>

          <!-- ··· + create ··· -->
          <button class="space-action-btn" type="button"
            #createRef="nzPopover"
            nz-popover
            [nzPopoverContent]="createTpl"
            nzPopoverTrigger="click"
            nzPopoverPlacement="rightTop"
            nzPopoverOverlayClassName="sb-popover"
            (nzPopoverVisibleChange)="onOpen($event, createRef)"
            (click)="$event.preventDefault(); $event.stopPropagation()">
            <lucide-icon [img]="Plus" size="14"/>
          </button>
        </div>
      </a>

      <!-- List child row (once a List has been created for this Space) / Add item sub-row -->
      @if (expanded()) {
        @if (hasList()) {
          <a class="space-child space-child--list" type="button"
            [routerLink]="['/spaces', space().id, 'list']"
            routerLinkActive="space-child--selected">
            <lucide-icon [img]="ListTodo" size="14"/><span>List</span>
          </a>
        } @else {
          <button class="space-child add-item-row" type="button"
            #addItemRef="nzPopover"
            nz-popover
            [nzPopoverContent]="createTpl"
            nzPopoverTrigger="click"
            nzPopoverPlacement="rightTop"
            nzPopoverOverlayClassName="sb-popover"
            (nzPopoverVisibleChange)="onOpen($event, addItemRef)"
            (click)="$event.stopPropagation()">
            <lucide-icon [img]="Plus" size="14"/><span>Add item</span>
          </button>
        }
      }
    </div>

    <ng-template #contextTpl>
      <app-space-context-menu (itemClick)="closeMenus()" />
    </ng-template>

    <ng-template #createTpl>
      <app-create-menu
        (createList)="closeMenus(); createListModal.emit(space().id)"
        (createFolder)="emit('createFolder')"
        (createSprint)="emit('createSprint')"
        (createDoc)="emit('createDoc')"
        (createDashboard)="emit('createDashboard')"
        (createWhiteboard)="emit('createWhiteboard')"
        (createForm)="emit('createForm')"
        (importItem)="emit('import')"
        (useTemplate)="emit('template')" />
    </ng-template>
  `,
  styles: [`
    :host { display: block; }

    .space-row-wrap { position: relative; overflow: visible; }
    .space-row {
      width: 100%; min-height: 2.1rem; display: flex; align-items: center; gap: .5rem;
      padding: 0 .5rem 0 .35rem; border: 0; border-radius: .5rem;
      color: var(--color-text-secondary); background: transparent;
      font: inherit; font-size: .8125rem; font-weight: 500;
      text-align: start; text-decoration: none; cursor: pointer;
    }
    .space-row:hover, .space-row--selected { color: var(--color-text-primary); background: var(--color-surface-3); }
    .space-row--selected { font-weight: 600; }
    .space-chevron {
      width: 1rem; height: 1rem; display: grid; place-items: center;
      border: 0; background: transparent; cursor: pointer;
      color: var(--color-text-muted); flex-shrink: 0; padding: 0;
    }
    .space-chevron:hover { color: var(--color-text-primary); }
    .space-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .space-row-actions { display: none; align-items: center; gap: .1rem; margin-inline-start: auto; flex-shrink: 0; }
    .space-row:hover .space-row-actions,
    .space-row-wrap:hover .space-row .space-row-actions { display: flex; }
    .space-action-btn {
      width: 1.6rem; height: 1.6rem; display: grid; place-items: center;
      border: 0; border-radius: .4rem; background: transparent;
      color: var(--color-text-muted); cursor: pointer; padding: 0;
    }
    .space-action-btn:hover { background: var(--color-border-strong); color: var(--color-text-primary); }
    .space-badge {
      width: 1.35rem; height: 1.35rem; display: grid; place-items: center;
      border-radius: .4rem; color: #fff; background: var(--color-accent);
      font-size: .7rem; font-weight: 700; flex-shrink: 0;
    }
    .space-row__lock { flex: none; color: var(--color-text-muted); }
    .space-tooltip {
      position: absolute; top: -2rem; left: 0; z-index: 1000;
      padding: .3rem .65rem; background: #3a3a3a; color: #eee;
      font-size: .75rem; border-radius: .4rem; white-space: nowrap;
      pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,.35);
    }
    .space-tooltip::after {
      content: ''; position: absolute; top: 100%; left: 1rem;
      border: 5px solid transparent; border-top-color: #3a3a3a;
    }
    .space-child {
      width: calc(100% - 1.3rem); min-height: 2.05rem; margin-inline-start: 1.3rem;
      display: flex; align-items: center; gap: .6rem; padding: 0 .6rem;
      border: 0; border-radius: .5rem; color: var(--color-text-secondary);
      background: transparent; font: inherit; font-size: .78rem; cursor: pointer;
    }
    .space-child:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .add-item-row { color: var(--color-text-muted); }
    .space-child--list { text-decoration: none; cursor: pointer; }
    .space-child--selected { color: var(--color-text-primary); background: var(--color-surface-3); font-weight: 600; }
  `],
})
export class SpaceRowComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly spaceListStore = inject(SpaceListStore);

  hasList(): boolean { return this.spaceListStore.hasList(this.space().id); }

  readonly space    = input.required<SidebarSpace>();
  readonly expanded = input(false);

  readonly expandToggle    = output<number>();
  readonly createListModal    = output<number>();
  readonly createFolderModal  = output<void>();
  readonly createSprintModal  = output<void>();
  readonly createDocModal     = output<void>();
  readonly createDashboard    = output<void>();
  readonly createWhiteboard   = output<void>();
  readonly createFormModal    = output<void>();
  readonly createFromImport   = output<void>();
  readonly createFromTemplate = output<void>();

  readonly ChevronRight   = ChevronRight;
  readonly ChevronDown    = ChevronDown;
  readonly Lock           = Lock;
  readonly MoreHorizontal = MoreHorizontal;
  readonly Plus           = Plus;
  readonly ListTodo       = ListTodo;

  readonly hovered = signal(false);

  private openDirective: NzPopoverDirective | null = null;

  onOpen(visible: boolean, directive: NzPopoverDirective): void {
    if (visible) {
      if (this.openDirective && this.openDirective !== directive) {
        this.openDirective.hide();
      }
      this.openDirective = directive;
    } else {
      if (this.openDirective === directive) {
        this.openDirective = null;
      }
    }
  }

  closeMenus(): void {
    this.openDirective?.hide();
    this.openDirective = null;
    this.cdr.markForCheck();
  }

  emit(action: 'createFolder' | 'createSprint' | 'createDoc' |
               'createDashboard' | 'createWhiteboard' | 'createForm' | 'import' | 'template'): void {
    this.closeMenus();
    const map: Record<string, () => void> = {
      createFolder:     () => this.createFolderModal.emit(),
      createSprint:     () => this.createSprintModal.emit(),
      createDoc:        () => this.createDocModal.emit(),
      createDashboard:  () => this.createDashboard.emit(),
      createWhiteboard: () => this.createWhiteboard.emit(),
      createForm:       () => this.createFormModal.emit(),
      import:           () => this.createFromImport.emit(),
      template:         () => this.createFromTemplate.emit(),
    };
    map[action]?.();
  }
}
