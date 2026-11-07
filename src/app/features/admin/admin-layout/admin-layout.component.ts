import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  ArrowLeft, BellRing, ChevronDown, LogOut, LucideAngularModule, PanelLeftClose, PanelLeftOpen, Settings2, ShieldCheck,
} from 'lucide-angular';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthSessionStore } from '../../../core/auth/auth-session.store';

interface AdminNavItem {
  readonly label: string;
  readonly route: string;
  readonly icon: typeof BellRing;
}

/**
 * Layout frame for every /admin/* page: header (sidebar toggle + account popover) plus a collapsible admin sidebar.
 * Standalone layout: it is NOT nested in the main app shell (no global top bar / rail) — it brings its own header and sidebar.
 * To add another admin area, append an entry to `navItems` and a child route in admin.routes.ts.
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule,
    NzAvatarModule, NzBadgeModule, NzButtonModule, NzPopoverModule, NzTooltipModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly sessionStore = inject(AuthSessionStore);

  readonly sidebarCollapsed = signal(false);
  readonly profileOpen = signal(false);

  readonly navItems: readonly AdminNavItem[] = [
    { label: 'Notifications', route: '/admin/notifications', icon: BellRing },
  ];

  readonly userName = computed(() => this.sessionStore.current()?.user?.fullName ?? 'Account');
  readonly userInitials = computed(() => {
    const name = this.sessionStore.current()?.user?.fullName ?? '';
    return name.split(' ').map((p: string) => p[0] ?? '').join('').slice(0, 2).toUpperCase() || 'AD';
  });

  toggleSidebar(): void { this.sidebarCollapsed.update(v => !v); }
  goTo(url: string): void { this.profileOpen.set(false); void this.router.navigateByUrl(url); }
  onLogout(): void { this.profileOpen.set(false); this.auth.logout(); void this.router.navigateByUrl('/auth/login'); }

  readonly ShieldCheck = ShieldCheck;
  readonly ArrowLeft = ArrowLeft;
  readonly ChevronDown = ChevronDown;
  readonly LogOut = LogOut;
  readonly PanelLeftClose = PanelLeftClose;
  readonly PanelLeftOpen = PanelLeftOpen;
  readonly Settings2 = Settings2;
}
