import { Routes } from '@angular/router';
import { SpaceShellComponent } from './space-shell/space-shell.component';
import { SpaceOverviewComponent } from './space-overview/space-overview.component';
import { SpaceListViewComponent } from './space-list-view/space-list-view.component';

export const SPACE_ROUTES: Routes = [
  {
    path: '',
    component: SpaceShellComponent,
    children: [
      { path: '',        redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: SpaceOverviewComponent },
      { path: 'list',    component: SpaceListViewComponent },
    ],
  },
];
