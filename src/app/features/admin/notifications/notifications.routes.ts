import { Routes } from '@angular/router';
import { unsavedChangesGuard } from './utils/unsaved-changes.guard';

export const ADMIN_NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-notifications-shell/admin-notifications-shell.component').then(m => m.AdminNotificationsShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        title: 'Notification center',
        loadComponent: () => import('./overview/notifications-overview.component').then(m => m.NotificationsOverviewComponent),
      },
      {
        path: 'triggers',
        title: 'Notification triggers',
        loadComponent: () => import('./triggers/trigger-list/trigger-list.component').then(m => m.TriggerListComponent),
      },
      {
        path: 'triggers/new',
        title: 'New trigger',
        // canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./triggers/trigger-form/trigger-form.component').then(m => m.TriggerFormComponent),
      },
      {
        path: 'triggers/:id/edit',
        title: 'Edit trigger',
        // canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./triggers/trigger-form/trigger-form.component').then(m => m.TriggerFormComponent),
      },
      {
        path: 'guide',
        title: 'Notification guide',
        loadComponent: () => import('./guide/notifications-guide.component').then(m => m.NotificationsGuideComponent),
      },
    ],
  },
];
