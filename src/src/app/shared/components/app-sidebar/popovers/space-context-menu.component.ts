import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import {
  LucideAngularModule,
  Star, Pencil, Link, Plus, Palette, Zap, Settings,
  List, Hash, MoreHorizontal, FileText, Bookmark,
  EyeOff, Copy, Archive, Trash2,
} from 'lucide-angular';
import { ComponentTranslatePipe } from '../../../../core/i18n/component-translate.pipe';

@Component({
  selector: 'app-space-context-menu',
  standalone: true,
  imports: [LucideAngularModule, ComponentTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="sb-menu" role="menu">
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="Star"           size="14"/>{{ 'favorite'          | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="Pencil"         size="14"/>{{ 'rename'            | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="Link"           size="14"/>{{ 'copyLink'          | componentT:'sidebar' }}</li>
      <li class="sb-divider"></li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="Plus"           size="14"/>{{ 'createNew'         | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="Palette"        size="14"/>{{ 'colorIcon'         | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="Zap"            size="14"/>{{ 'automations'       | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="Settings"       size="14"/>{{ 'customFields'      | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="List"           size="14"/>{{ 'taskStatuses'      | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="Hash"           size="14"/>{{ 'tags'              | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="MoreHorizontal" size="14"/>{{ 'moreOptions'       | componentT:'sidebar' }}</li>
      <li class="sb-divider"></li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="FileText"       size="14"/>{{ 'imports'           | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="Bookmark"       size="14"/>{{ 'templates'         | componentT:'sidebar' }}</li>
      <li class="sb-divider"></li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="EyeOff"         size="14"/>{{ 'hideSpace'         | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="Copy"           size="14"/>{{ 'duplicate'         | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="Archive"        size="14"/>{{ 'archive'           | componentT:'sidebar' }}</li>
      <li class="sb-item sb-danger" (click)="itemClick.emit()"><lucide-icon [img]="Trash2" size="14"/>{{ 'delete'          | componentT:'sidebar' }}</li>
      <li class="sb-divider"></li>
      <li class="sb-item sb-sharing" (click)="itemClick.emit()">{{ 'sharingPermissions' | componentT:'sidebar' }}</li>
    </ul>
  `,
  styles: [`
    .sb-menu { list-style: none; margin: 0; padding: .35rem 0; min-width: 14rem; color: var(--color-text-secondary); font-size: .75rem; font-family: inherit; }
    .sb-item { display: flex; align-items: center; gap: .55rem; padding: .4rem .75rem; cursor: pointer; white-space: nowrap; color: var(--color-text-secondary); transition: background 80ms, color 80ms; }
    .sb-item:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .sb-divider { height: 1px; background: var(--color-border); margin: .25rem 0; }
    .sb-danger { color: #e05c5c !important; }
    .sb-danger:hover { color: #e05c5c !important; background: rgba(224,92,92,.08) !important; }
    .sb-sharing { justify-content: center; font-weight: 600; }
  `],
})
export class SpaceContextMenuComponent {
  readonly Star = Star; readonly Pencil = Pencil; readonly Link = Link;
  readonly Plus = Plus; readonly Palette = Palette; readonly Zap = Zap;
  readonly Settings = Settings; readonly List = List; readonly Hash = Hash;
  readonly MoreHorizontal = MoreHorizontal; readonly FileText = FileText;
  readonly Bookmark = Bookmark; readonly EyeOff = EyeOff; readonly Copy = Copy;
  readonly Archive = Archive; readonly Trash2 = Trash2;
  readonly itemClick = output<void>();
}
