/**
 * workspaceInitGuard
 * ──────────────────
 * Runs once after authentication (on the shell route).
 * Loads all workspaces into the WorkspaceStore so the sidebar
 * switcher and workspace detail pages have data immediately.
 *
 * If the API call fails (e.g. network issue) we allow navigation
 * anyway — the UI will show the retry state inside the component.
 */
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { WorkspaceService } from '../services/workspace.service';
import { WorkspaceStore } from '../stores/workspace.store';

export const workspaceInitGuard: CanActivateFn = () => {
  const svc   = inject(WorkspaceService);
  const store = inject(WorkspaceStore);

  // If we already have workspaces in the store, skip the fetch
  if (store.hasWorkspaces()) return true;

  return svc.loadMyWorkspaces().pipe(
    map(() => true),
    catchError(() => of(true)), // allow nav even on error
  );
};
