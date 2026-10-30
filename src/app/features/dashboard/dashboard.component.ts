import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule, LayoutGrid } from 'lucide-angular';
import { ComponentTranslatePipe } from '../../core/i18n/component-translate.pipe';
import { ComponentI18nService } from '../../core/i18n/component-i18n.service';
import { SpaceOverviewComponent } from '../space/space-overview/space-overview.component';

/**
 * DashboardComponent — the "Home" landing page.
 * Shows the workspace overview (no space-specific tab bar).
 * The space tab bar lives in SpaceShellComponent, shown when
 * the user navigates to /spaces/:spaceId.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [LucideAngularModule, ComponentTranslatePipe, SpaceOverviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-space-overview />`,
  styles: [`:host { display: block; height: 100%; }`],
})
export class DashboardComponent {
  private readonly i18n = inject(ComponentI18nService);
}
