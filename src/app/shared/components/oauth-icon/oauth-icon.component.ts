/**
 * Flowspace Command Refresh: real brand marks for OAuth buttons.
 *
 * Previously both "Continue with Google" and "Continue with GitHub" rendered
 * the exact same flat-colored square (a letter "G" and a "●" dot styled
 * identically), so the two buttons looked like duplicates. This renders the
 * actual Google "G" mark and the GitHub mark as inline SVG so the two
 * providers are visually distinct, matching the convention every OAuth
 * button uses (colored/branded mark + provider name).
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type OAuthIconProvider = 'google' | 'github';

@Component({
  selector: 'app-oauth-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.oauth-icon--google]': "provider() === 'google'",
    '[class.oauth-icon--github]': "provider() === 'github'",
  },
  template: `
    @switch (provider()) {
      @case ('google') {
        <svg class="oauth-icon__svg" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c11.045 0 20-8.955 20-20 0-1.341-.138-2.65-.389-3.917z"/>
          <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.344 4.337-17.694 10.691z"/>
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C39.205 36.971 44 30.667 44 24c0-1.341-.138-2.65-.389-3.917z"/>
        </svg>
      }
      @case ('github') {
        <svg class="oauth-icon__svg" viewBox="0 0 24 24" aria-hidden="true" fill="#ffffff">
          <path d="M12 .5C5.73.5.98 5.47.98 11.98c0 5.21 3.29 9.62 7.86 11.18.57.11.78-.25.78-.56 0-.27-.01-1.17-.02-2.13-3.2.73-3.88-1.42-3.88-1.42-.52-1.36-1.28-1.72-1.28-1.72-1.04-.74.08-.72.08-.72 1.15.08 1.76 1.21 1.76 1.21 1.03 1.8 2.69 1.28 3.35.98.1-.76.4-1.28.73-1.58-2.55-.3-5.24-1.31-5.24-5.84 0-1.29.44-2.34 1.17-3.17-.12-.3-.51-1.51.11-3.14 0 0 .96-.31 3.15 1.22a10.6 10.6 0 0 1 5.74 0c2.19-1.53 3.15-1.22 3.15-1.22.62 1.63.23 2.84.11 3.14.73.83 1.17 1.88 1.17 3.17 0 4.54-2.69 5.54-5.25 5.83.41.36.78 1.08.78 2.18 0 1.57-.01 2.84-.01 3.23 0 .31.21.68.79.56 4.56-1.56 7.85-5.97 7.85-11.18C23.02 5.47 18.27.5 12 .5z"/>
        </svg>
      }
    }
  `,
  styles: [`
    :host { display: grid; place-items: center; width: 1.25rem; height: 1.25rem; border-radius: .3rem; overflow: hidden; flex-shrink: 0; }
    :host.oauth-icon--google { background: #ffffff; box-shadow: inset 0 0 0 1px rgb(0 0 0 / .1); }
    :host.oauth-icon--github { background: #24292f; }
    .oauth-icon__svg { width: 68%; height: 68%; display: block; }
  `],
})
export class OauthIconComponent {
  readonly provider = input.required<OAuthIconProvider>();
}
