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
      width: 100%; min-height: 2rem; display: flex; align-items: center; gap: .4rem;
      padding: 0 .4rem 0 .3rem; border: 0; border-radius: .35rem;
      color: var(--color-text-secondary); background: transparent;
      font: inherit; font-size: .75rem; font-weight: 520;
      text-align: start; text-decoration: none; cursor: pointer;
    }
    .space-row:hover, .space-row--selected { color: var(--color-text-primary); background: var(--color-surface-3); }
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
      width: 1.4rem; height: 1.4rem; display: grid; place-items: center;
      border: 0; border-radius: .28rem; background: transparent;
      color: var(--color-text-muted); cursor: pointer; padding: 0;
    }
    .space-action-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
    .space-badge {
      width: 1.2rem; height: 1.2rem; display: grid; place-items: center;
      border-radius: .28rem; color: #fff; background: var(--color-accent);
      font-size: .62rem; flex-shrink: 0;
    }
    .space-row__lock { flex: none; color: var(--color-text-muted); }
    .space-tooltip {
      position: absolute; top: -2rem; left: 0; z-index: 1000;
      padding: .28rem .6rem; background: #333; color: #fff;
      font-size: .68rem; border-radius: .3rem; white-space: nowrap;
      pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,.35);
    }
    .space-tooltip::after {
      content: ''; position: absolute; top: 100%; left: 1rem;
      border: 5px solid transparent; border-top-color: #333;
    }
    .space-child {
      width: calc(100% - 1.2rem); min-height: 1.65rem; margin-inline-start: 1.2rem;
      display: flex; align-items: center; gap: .55rem; padding: 0 .55rem;
      border: 0; border-radius: .35rem; color: var(--color-text-muted);
      background: transparent; font: inherit; font-size: .68rem; cursor: pointer;
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
