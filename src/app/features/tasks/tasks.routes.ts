import { Routes } from '@angular/router';

export const TASKS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('../dashboard/dashboard.component').then(m => m.DashboardComponent) },
];
