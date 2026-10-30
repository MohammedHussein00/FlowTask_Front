/**
 * Flowspace Command Refresh: a single, documented place for client-side storage.
 *
 * Before this, `localStorage` was called directly (and inconsistently
 * try/caught) from ThemeService, LocaleService and AuthSessionStore. That
 * works, but it is easy to get subtly wrong — Safari private browsing and
 * "block all cookies" settings can make `localStorage` throw on *read*, not
 * just on write, and a bare `JSON.parse` on corrupt/old data can crash a
 * constructor before the app even renders.
 *
 * What large, international products actually do for this kind of data:
 *  - Non-sensitive UI preferences (theme, locale, layout density): exactly
 *    what this file is for — namespaced, versioned `localStorage` so a future
 *    shape change doesn't crash on old data, with silent, safe fallback.
 *  - The access token / session: short-lived, kept in memory, and backed by
 *    a **refresh token in an httpOnly, Secure, SameSite=Strict cookie** that
 *    client-side JavaScript can never read — the browser just sends it
 *    automatically, and a background "silent refresh" call restores a new
 *    access token on reload. That fully removes the access/refresh token
 *    from anything an XSS payload could steal via `localStorage`.
 *    Implementing that requires the API to issue such a cookie and expose a
 *    `/auth/refresh` endpoint; the current GraphQL schema (login/register/
 *    oAuthLogin only) doesn't have one yet, so `AuthSessionStore` still
 *    persists the access token client-side as a pragmatic middle ground —
 *    it now goes through this same safe wrapper and only lives alongside a
 *    short expiry it already checks on every read.
 *
 * Keys are namespaced + versioned (`fs.v1.*`) so a future breaking change to
 * what's stored under a key can bump the version instead of silently
 * misreading old data.
 */

const NAMESPACE = 'fs.v1';

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

/** Prefer localStorage (survives tab close); fall back to sessionStorage; fall back to an in-memory Map if both are blocked. */
function backingStore(): Storage | null {
  if (!hasWindow()) return null;
  try {
    const probeKey = `${NAMESPACE}.__probe__`;
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
}

const memoryFallback = new Map<string, string>();

export const AppStorage = {
  key(name: string): string {
    return `${NAMESPACE}.${name}`;
  },

  getString(name: string): string | null {
    const store = backingStore();
    try {
      return store ? store.getItem(this.key(name)) : memoryFallback.get(this.key(name)) ?? null;
    } catch {
      return null;
    }
  },

  setString(name: string, value: string): void {
    const store = backingStore();
    try {
      if (store) store.setItem(this.key(name), value);
      else memoryFallback.set(this.key(name), value);
    } catch {
      /* Quota exceeded or storage disabled — preference just won't persist. */
    }
  },

  getJSON<T>(name: string): T | null {
    const raw = this.getString(name);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Corrupt or outdated shape under this key — drop it rather than crash callers.
      this.remove(name);
      return null;
    }
  },

  setJSON<T>(name: string, value: T): void {
    try {
      this.setString(name, JSON.stringify(value));
    } catch {
      /* Non-serializable value — ignore rather than throw during render. */
    }
  },

  remove(name: string): void {
    const store = backingStore();
    try {
      if (store) store.removeItem(this.key(name));
      else memoryFallback.delete(this.key(name));
    } catch {
      /* ignore */
    }
  },
};
