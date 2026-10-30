import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { LucideAngularModule, Sheet, FileUp } from 'lucide-angular';
import { ComponentTranslatePipe } from '../../../../core/i18n/component-translate.pipe';

@Component({
  selector: 'app-imports-menu',
  standalone: true,
  imports: [LucideAngularModule, ComponentTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="sb-menu" role="menu">
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="Sheet"  size="14"/>{{ 'importSpreadsheet' | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><lucide-icon [img]="FileUp" size="14"/>{{ 'importDocument'    | componentT:'sidebar' }}</li>
      <li class="sb-divider"></li>
      <li class="sb-item" (click)="itemClick.emit()"><span class="sb-logo sb-logo--asana"></span>{{ 'importAsana'      | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><span class="sb-logo sb-logo--basecamp"></span>{{ 'importBasecamp'   | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><span class="sb-logo sb-logo--confluence"></span>{{ 'importConfluence' | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><span class="sb-logo sb-logo--jira"></span>{{ 'importJira'       | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><span class="sb-logo sb-logo--monday"></span>{{ 'importMonday'     | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><span class="sb-logo sb-logo--notion"></span>{{ 'importNotion'     | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><span class="sb-logo sb-logo--slack"></span>{{ 'importSlack'      | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><span class="sb-logo sb-logo--todoist"></span>{{ 'importTodoist'    | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><span class="sb-logo sb-logo--trello"></span>{{ 'importTrello'     | componentT:'sidebar' }}</li>
      <li class="sb-item" (click)="itemClick.emit()"><span class="sb-logo sb-logo--wrike"></span>{{ 'importWrike'      | componentT:'sidebar' }}</li>
    </ul>
  `,
  styles: [`
    .sb-menu { list-style: none; margin: 0; padding: .35rem 0; min-width: 14rem; color: var(--color-text-secondary); font-size: .75rem; font-family: inherit; }
    .sb-item { display: flex; align-items: center; gap: .55rem; padding: .4rem .75rem; cursor: pointer; white-space: nowrap; color: var(--color-text-secondary); transition: background 80ms, color 80ms; }
    .sb-item:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .sb-divider { height: 1px; background: var(--color-border); margin: .25rem 0; }
    .sb-logo { width: 1rem; height: 1rem; display: inline-flex; align-items: center; justify-content: center; border-radius: .2rem; font-size: .6rem; font-weight: 700; flex-shrink: 0; }
    .sb-logo--asana { background: #f06a6a; }
    .sb-logo--basecamp { background: #5eb85e; }
    .sb-logo--confluence { background: #0052cc; }
    .sb-logo--jira { background: #0052cc; }
    .sb-logo--monday { background: #f65b4e; }
    .sb-logo--notion { background: #fff; border: 1px solid #555; }
    .sb-logo--slack { background: #4a154b; }
    .sb-logo--todoist { background: #db4035; }
    .sb-logo--trello { background: #0052cc; }
    .sb-logo--wrike { background: #1db954; }
  `],
})
export class ImportsMenuComponent {
  readonly Sheet = Sheet;
  readonly FileUp = FileUp;
  readonly itemClick = output<void>();
}
