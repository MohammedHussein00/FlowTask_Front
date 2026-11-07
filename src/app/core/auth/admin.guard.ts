// src/app/core/auth/admin.guard.ts
import { Injectable, computed, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { NotificationService } from './../errors/notification.service';
import { AuthSessionStore } from './auth-session.store';

/**
 * Role names that may open the admin area. Keep in sync with the backend
 * `[Authorize(Roles = "...")]` on NotificationTriggersController (use your PetroRoles value).
 * The server is the real gate — this guard only keeps non-admins from seeing pages that would 403.
 */
export const ADMIN_ROLES: readonly string[] = ['Admin'];

const ROLE_CLAIMS = ['role', 'roles', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!b64) return null;
    const bytes = Uint8Array.from(atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=')), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function rolesFromToken(token: string | null): string[] {
  const payload = token ? decodePayload(token) : null;
  if (!payload) return [];
  return ROLE_CLAIMS.flatMap(k => {
    const v = payload[k];
    return Array.isArray(v) ? v.map(String) : v ? [String(v)] : [];
  });
}

export function hasAdminRole(token: string | null): boolean {
  const wanted = ADMIN_ROLES.map(r => r.toLowerCase());
  return rolesFromToken(token).some(r => wanted.includes(r.toLowerCase()));
}

/** Reactive "is the signed-in user an admin" flag for menus. */
@Injectable({ providedIn: 'root' })
export class AdminAccessService {
  private readonly session = inject(AuthSessionStore);
  // `current` changes whenever the token does (login / logout), so reading it keeps this in sync.
  readonly isAdmin = computed(() => !!this.session.current() && hasAdminRole(this.session.accessToken));
}

export const adminGuard: CanActivateFn = () => {
  if (inject(AdminAccessService).isAdmin()) return true;
  inject(NotificationService).error('Access denied', 'You need administrator rights to open this page.');
  return inject(Router).createUrlTree(['/dashboard']);
};
