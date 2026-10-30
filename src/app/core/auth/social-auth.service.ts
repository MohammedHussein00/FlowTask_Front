/**
 * Flowspace Command Refresh: shared Google/GitHub OAuth kick-off logic.
 *
 * This used to live duplicated (and, on the register page, not actually
 * wired up at all — "Continue with Google/GitHub" there always failed
 * immediately). Centralizing it here means both pages get the same,
 * actually-working behavior, and the "Google Sign-In failed to load" message
 * now only appears when it is genuinely true — see `start()` below.
 *
 * IMPORTANT — why the Google button currently errors out:
 * `environment.oauth.googleClientId` (and `githubClientId`) ship empty in
 * both `environment.ts` and `environment.prod.ts`. With no client ID, the
 * Google Identity Services client is never created, so clicking the button
 * can only ever fail. To enable Google sign-in, put a real OAuth client ID
 * from https://console.cloud.google.com/apis/credentials into
 * `environment.oauth.googleClientId` (and the GitHub OAuth App's client ID
 * into `githubClientId`). No code change is needed beyond that.
 */
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type OAuthProvider = 'google' | 'github';

/** Translation keys (resolved via the page's own componentT scope). */
export type OAuthErrorKey =
  | 'googleNotConfigured'
  | 'googleLoadError'
  | 'oauthNotConfigured'
  | 'popupBlocked'
  | 'oauthCancelled'
  | 'oauthTimeout'
  | 'oauthFailed';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class SocialAuthService {
  /** Whether a Google/GitHub client id has actually been configured. */
  readonly googleConfigured = !!environment.oauth.googleClientId;
  readonly githubConfigured = !!environment.oauth.githubClientId;

  /** True once the Google Identity Services script + client are ready. */
  readonly googleReady = signal(false);
  /** True if the script failed to load or the client could not initialize. */
  readonly googleFailed = signal(false);

  private googleClient: any = null;
  private githubState = '';

  constructor() {
    if (this.googleConfigured && typeof document !== 'undefined') this.loadGoogleScript();
  }

  /** Kicks off the OAuth flow for the given provider; emits the auth code once, then completes. */
  start(provider: OAuthProvider): Observable<string> {
    return provider === 'google' ? this.startGoogle() : this.startGithub();
  }

  private loadGoogleScript(): void {
    const existing = document.getElementById('google-oauth-script');
    if (existing) { this.initializeGoogleClient(); return; }
    const script = document.createElement('script');
    script.id = 'google-oauth-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initializeGoogleClient();
    script.onerror = () => this.googleFailed.set(true);
    document.head.appendChild(script);
  }

  private initializeGoogleClient(): void {
    if (typeof google === 'undefined' || !google?.accounts?.oauth2) { this.googleFailed.set(true); return; }
    try {
      this.googleClient = google.accounts.oauth2.initCodeClient({
        client_id: environment.oauth.googleClientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: () => { /* overridden per-call in startGoogle() */ },
      });
      this.googleReady.set(true);
    } catch {
      this.googleFailed.set(true);
    }
  }

  private startGoogle(): Observable<string> {
    return new Observable<string>(subscriber => {
      if (!this.googleConfigured) { subscriber.error('googleNotConfigured' as OAuthErrorKey); return; }
      if (!this.googleClient) { subscriber.error('googleLoadError' as OAuthErrorKey); return; }
      this.googleClient.callback = (response: any) => {
        if (response?.code) { subscriber.next(response.code); subscriber.complete(); }
        else subscriber.error('oauthCancelled' as OAuthErrorKey);
      };
      this.googleClient.error_callback = () => subscriber.error('oauthCancelled' as OAuthErrorKey);
      this.googleClient.requestCode();
    });
  }

  private startGithub(): Observable<string> {
    return new Observable<string>(subscriber => {
      if (!this.githubConfigured) { subscriber.error('oauthNotConfigured' as OAuthErrorKey); return; }

      this.githubState = crypto.randomUUID();
      const redirectUri = `${window.location.origin}/auth/login`;
      const params = new URLSearchParams({
        client_id: environment.oauth.githubClientId,
        redirect_uri: redirectUri,
        scope: 'read:user user:email',
        state: this.githubState,
      });
      const popup = window.open(`https://github.com/login/oauth/authorize?${params}`, 'flowtask-github', 'width=600,height=700,toolbar=no,menubar=no');
      if (!popup) { subscriber.error('popupBlocked' as OAuthErrorKey); return; }

      let settled = false;
      const cleanup = () => {
        window.clearInterval(pollTimer);
        window.clearTimeout(timeoutTimer);
        if (!popup.closed) popup.close();
      };
      const pollTimer = window.setInterval(() => {
        if (popup.closed) {
          if (!settled) { settled = true; cleanup(); subscriber.error('oauthCancelled' as OAuthErrorKey); }
          return;
        }
        try {
          const url = new URL(popup.location.href);
          if (!url.href.startsWith(redirectUri)) return;
          const code = url.searchParams.get('code');
          const returnedState = url.searchParams.get('state');
          settled = true;
          cleanup();
          if (!code || returnedState !== this.githubState) { subscriber.error('oauthFailed' as OAuthErrorKey); return; }
          subscriber.next(code);
          subscriber.complete();
        } catch {
          /* Still on the provider origin — cross-origin read throws until redirected back. */
        }
      }, 400);
      const timeoutTimer = window.setTimeout(() => {
        if (!settled) { settled = true; cleanup(); subscriber.error('oauthTimeout' as OAuthErrorKey); }
      }, 90000);

      return () => cleanup();
    });
  }
}
