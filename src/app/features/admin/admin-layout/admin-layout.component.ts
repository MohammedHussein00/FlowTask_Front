import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ArrowLeft, BellRing, LucideAngularModule, ShieldCheck } from 'lucide-angular';

interface AdminNavItem {
  readonly label: string;
  readonly route: string;
  readonly icon: typeof BellRing;
}

/**
 * Layout frame for every /admin/* page: a contextual admin sidebar beside the routed content.
 * It renders inside the main app shell (top bar + global rail), so admin screens keep the same chrome as the rest of the app.
 * To add another admin area, append an entry to `navItems` and a child route in admin.routes.ts.
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  readonly ShieldCheck = ShieldCheck;
  readonly ArrowLeft = ArrowLeft;

  readonly navItems: readonly AdminNavItem[] = [
    { label: 'Notifications', route: '/admin/notifications', icon: BellRing },
  ];
}
