import { Routes } from '@angular/router';

export const WORKSPACE_ROUTES: Routes = [
  {
    path: 'create',
    loadComponent: () =>
      import('./create-workspace/create-workspace.component').then(
        m => m.CreateWorkspaceComponent,
      ),
  },
  {
    path: ':workspaceId',
    loadComponent: () =>
      import('./workspace-detail/workspace-detail.component').then(
        m => m.WorkspaceDetailComponent,
      ),
  },
  {
    path: ':workspaceId/settings',
    loadComponent: () =>
      import('./workspace-edit/workspace-edit.component').then(
        m => m.WorkspaceEditComponent,
      ),
  },
  { path: '', redirectTo: 'create', pathMatch: 'full' },
];
