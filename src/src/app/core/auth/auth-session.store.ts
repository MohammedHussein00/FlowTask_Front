import { Injectable, computed, signal } from '@angular/core';

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

const STORAGE_KEY = 'flowtask.session';
const TOKEN_KEY   = 'flowtask.token';

@Injectable({ providedIn: 'root' })
export class AuthSessionStore {
  // Access token restored from localStorage on boot, then kept in memory.
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
      localStorage.setItem(TOKEN_KEY, session.accessToken);
    } catch { /* quota / private browsing */ }
  }

  clear(): void {
    this.accessTokenValue = null;
    this._session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch { /* ignore */ }
  }

  get accessToken(): string | null {
    return this.accessTokenValue;
  }

  private readStorage(): PersistedSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const p = JSON.parse(raw) as PersistedSession;
      if (!p?.user?.userId || !p.expiresAt) return null;

      if (new Date(p.expiresAt) <= new Date()) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }

      // Restore access token into memory so Apollo can attach it immediately.
      this.accessTokenValue = localStorage.getItem(TOKEN_KEY);
      return p;
    } catch { return null; }
  }
}