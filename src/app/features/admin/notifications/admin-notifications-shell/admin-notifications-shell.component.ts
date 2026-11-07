// src/app/features/admin/notifications/admin-notifications-shell/admin-notifications-shell.component.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BookOpen, BellRing, LayoutDashboard, ListChecks, LucideAngularModule, Plus } from 'lucide-angular';
import { AnConfirmHostComponent } from '../ui/an-confirm-host/an-confirm-host.component';
import { AnTPipe } from '../utils/an-i18n';

/** Frame for every notification-admin page: header, section tabs, and the shared confirm dialog. */
@Component({
  selector: 'app-admin-notifications-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, AnTPipe, AnConfirmHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-notifications-shell.component.html',
  styleUrl: './admin-notifications-shell.component.scss',
})
export class AdminNotificationsShellComponent {
  readonly BellRing = BellRing;
  readonly BookOpen = BookOpen;
  readonly LayoutDashboard = LayoutDashboard;
  readonly ListChecks = ListChecks;
  readonly Plus = Plus;
}
