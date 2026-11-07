import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ArrowLeft, BellRing, LucideAngularModule, ShieldCheck } from 'lucide-angular';

interface AdminNavItem {
  readonly label: string;
  readonly route: string;
  readonly icon: typeof BellRing;
}

/**
 * Layout frame for every /admin/* page: own header plus an admin sidebar beside the routed content.
 * Standalone layout: it is NOT nested in the main app shell (no global top bar / rail) — it brings its own header and sidebar.
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
