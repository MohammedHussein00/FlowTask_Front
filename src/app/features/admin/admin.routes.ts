// src/app/features/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { adminGuard } from '../../core/auth/admin.guard';
import { unsavedChangesGuard } from './notifications/utils/unsaved-changes.guard';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'notifications' },
  {
    path: 'notifications',
    canActivate: [adminGuard],
    loadComponent: () => import('./notifications/admin-notifications-shell.component').then(m => m.AdminNotificationsShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        title: 'Notification center',
        loadComponent: () => import('./notifications/overview/notifications-overview.component').then(m => m.NotificationsOverviewComponent),
      },
      {
        path: 'triggers',
        title: 'Notification triggers',
        loadComponent: () => import('./notifications/triggers/trigger-list/trigger-list.component').then(m => m.TriggerListComponent),
      },
      {
        path: 'triggers/new',
        title: 'New trigger',
        // canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./notifications/triggers/trigger-form/trigger-form.component').then(m => m.TriggerFormComponent),
      },
      {
        path: 'triggers/:id/edit',
        title: 'Edit trigger',
        // canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./notifications/triggers/trigger-form/trigger-form.component').then(m => m.TriggerFormComponent),
      },
      {
        path: 'guide',
        title: 'Notification guide',
        loadComponent: () => import('./notifications/guide/notifications-guide.component').then(m => m.NotificationsGuideComponent),
      },
    ],
  },
];
