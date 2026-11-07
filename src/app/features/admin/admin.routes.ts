import { Routes } from '@angular/router';
import { adminGuard } from '../../core/auth/admin.guard';

/** Mounted at `/admin` (see app.routes.ts). Every admin page renders inside AdminLayoutComponent. */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    // canActivate: [adminGuard],
    loadComponent: () => import('./admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'notifications' },
      {
        path: 'notifications',
        loadChildren: () => import('./notifications/notifications.routes').then(m => m.ADMIN_NOTIFICATIONS_ROUTES),
      },
    ],
  },
];
