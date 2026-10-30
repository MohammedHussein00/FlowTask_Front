/**
 * Flowspace Command Refresh: session persistence via the shared AppStorage wrapper.
 *
 * See app/core/storage/app-storage.ts for the full rationale. Short version:
 * the access token and non-sensitive user/expiry info are still persisted
 * client-side (there's no refresh-token/httpOnly-cookie endpoint on the API
 * yet), but both now go through the same resilient, namespaced storage used
 * by every other preference in the app, and the token/session stay under
 * two separate keys so a corrupt or expired entry in one can't take the
 * other down with it.
 */
import { Injectable, computed, signal } from '@angular/core';
import { AppStorage } from '../storage/app-storage';

export interface AuthUser {
  userId: number;
  email: string;
  fullName: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: string;
}

interface PersistedSession {
  user: AuthUser;
  expiresAt: string;
}

const STORAGE_KEY = 'session';
const TOKEN_KEY   = 'token';

@Injectable({ providedIn: 'root' })
export class AuthSessionStore {
  // Access token restored from storage on boot, then kept in memory.
  private accessTokenValue: string | null = null;

  // user + expiresAt persisted so the guard knows a session exists on boot.
  // readStorage() also restores the access token into accessTokenValue.
  private readonly _session = signal<PersistedSession | null>(this.readStorage());

  readonly current        = computed(() => this._session());
  readonly isAuthenticated = computed(() => this._session() !== null);

  setSession(session: AuthSession): void {
    this.accessTokenValue = session.accessToken;
    const persisted: PersistedSession = { user: session.user, expiresAt: session.expiresAt };
    this._session.set(persisted);
    AppStorage.setJSON(STORAGE_KEY, persisted);
    AppStorage.setString(TOKEN_KEY, session.accessToken);
  }

  clear(): void {
    this.accessTokenValue = null;
    this._session.set(null);
    AppStorage.remove(STORAGE_KEY);
    AppStorage.remove(TOKEN_KEY);
  }

  get accessToken(): string | null {
    return this.accessTokenValue;
  }

  private readStorage(): PersistedSession | null {
    const p = AppStorage.getJSON<PersistedSession>(STORAGE_KEY);
    if (!p?.user?.userId || !p.expiresAt) return null;

    if (new Date(p.expiresAt) <= new Date()) {
      AppStorage.remove(STORAGE_KEY);
      AppStorage.remove(TOKEN_KEY);
      return null;
    }

    // Restore access token into memory so Apollo can attach it immediately.
    this.accessTokenValue = AppStorage.getString(TOKEN_KEY);
    return p;
  }
}
