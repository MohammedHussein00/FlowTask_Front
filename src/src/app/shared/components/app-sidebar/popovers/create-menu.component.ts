import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import {
  LucideAngularModule,
  List, Folder, Zap, FileText, LayoutDashboard, PenLine,
  ClipboardList, Bookmark, ChevronRight,
} from 'lucide-angular';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { ComponentTranslatePipe } from '../../../../core/i18n/component-translate.pipe';
import { ImportsMenuComponent } from './imports-menu.component';

@Component({
  selector: 'app-create-menu',
  standalone: true,
  imports: [LucideAngularModule, NzPopoverModule, ComponentTranslatePipe, ImportsMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="sb-menu" role="menu">
      <li class="sb-group-label">{{ 'createMenuLabel' | componentT:'sidebar' }}</li>
      <li class="sb-item sb-item--stack" (click)="createList.emit()">
        <lucide-icon [img]="List" size="14"/>
        <span class="sb-stack">
          <span class="sb-stack__title">{{ 'createList' | componentT:'sidebar' }}</span>
          <span class="sb-stack__desc">{{ 'createListDesc' | componentT:'sidebar' }}</span>
        </span>
      </li>
      <li class="sb-item sb-item--stack" (click)="createFolder.emit()">
        <lucide-icon [img]="Folder" size="14"/>
        <span class="sb-stack">
          <span class="sb-stack__title">{{ 'createFolder' | componentT:'sidebar' }}</span>
          <span class="sb-stack__desc">{{ 'createFolderDesc' | componentT:'sidebar' }}</span>
        </span>
      </li>
      <li class="sb-item sb-item--stack" (click)="createSprint.emit()">
        <lucide-icon [img]="Zap" size="14"/>
        <span class="sb-stack">
          <span class="sb-stack__title">{{ 'createSprint' | componentT:'sidebar' }}</span>
          <span class="sb-stack__desc">{{ 'createSprintDesc' | componentT:'sidebar' }}</span>
        </span>
      </li>
      <li class="sb-divider"></li>
      <li class="sb-item" (click)="createDoc.emit()"><lucide-icon [img]="FileText" size="14"/>{{ 'createDoc' | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="createDashboard.emit()"><lucide-icon [img]="LayoutDashboard" size="14"/>{{ 'createDashboard' | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="createWhiteboard.emit()"><lucide-icon [img]="PenLine" size="14"/>{{ 'createWhiteboard' | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="createForm.emit()"><lucide-icon [img]="ClipboardList" size="14"/>{{ 'createForm' | componentT:'sidebar' }}</li>
      <li class="sb-divider"></li>
      <li class="sb-item sb-item--sub"
          nz-popover
          [nzPopoverContent]="importsTpl"
          nzPopoverTrigger="hover"
          nzPopoverPlacement="rightBottom"
          nzPopoverOverlayClassName="sb-popover">
        <lucide-icon [img]="FileText" size="14"/>
        <span>{{ 'imports' | componentT:'sidebar' }}</span>
        <lucide-icon [img]="ChevronRight" size="12" class="sb-sub-arrow"/>
      </li>
      <li class="sb-item" (click)="useTemplate.emit()"><lucide-icon [img]="Bookmark" size="14"/>{{ 'useTemplate' | componentT:'sidebar' }}</li>
    </ul>
    <ng-template #importsTpl>
      <app-imports-menu (itemClick)="importItem.emit()" />
    </ng-template>
  `,
  styles: [`
    .sb-menu { list-style: none; margin: 0; padding: .35rem 0; min-width: 14rem; color: var(--color-text-secondary); font-size: .75rem; font-family: inherit; }
    .sb-group-label { padding: .3rem .75rem .1rem; color: var(--color-text-muted); font-size: .63rem; font-weight: 700; letter-spacing: .07em; pointer-events: none; }
    .sb-item { display: flex; align-items: center; gap: .55rem; padding: .4rem .75rem; cursor: pointer; white-space: nowrap; color: var(--color-text-secondary); transition: background 80ms, color 80ms; position: relative; }
    .sb-item:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .sb-item--stack { align-items: flex-start; padding-block: .35rem; }
    .sb-stack { display: flex; flex-direction: column; gap: .06rem; }
    .sb-stack__title { font-size: .76rem; font-weight: 600; line-height: 1.3; }
    .sb-stack__desc  { font-size: .65rem; color: var(--color-text-muted); line-height: 1.3; }
    .sb-divider { height: 1px; background: var(--color-border); margin: .25rem 0; }
    .sb-item--sub { padding-inline-end: .5rem; }
    .sb-sub-arrow { margin-left: auto; flex-shrink: 0; }
  `],
})
export class CreateMenuComponent {
  readonly List = List; readonly Folder = Folder; readonly Zap = Zap;
  readonly FileText = FileText; readonly LayoutDashboard = LayoutDashboard;
  readonly PenLine = PenLine; readonly ClipboardList = ClipboardList;
  readonly Bookmark = Bookmark; readonly ChevronRight = ChevronRight;

  readonly createList       = output<void>();
  readonly createFolder     = output<void>();
  readonly createSprint     = output<void>();
  readonly createDoc        = output<void>();
  readonly createDashboard  = output<void>();
  readonly createWhiteboard = output<void>();
  readonly createForm       = output<void>();
  readonly importItem       = output<void>();
  readonly useTemplate      = output<void>();
}
