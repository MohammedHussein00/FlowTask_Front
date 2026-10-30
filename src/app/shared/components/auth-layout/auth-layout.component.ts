/**
 * ClickUp reference fidelity: sparse centered authentication card under a subtle, high-key color haze.
 *
 * Flowspace Command Refresh: this shell previously hardcoded light-theme
 * colors (`color: #252830; background: #fff; ...`) directly in its styles,
 * completely ignoring `html[data-theme]`. That is why the login/signup pages
 * stayed stuck in light mode even when the rest of the app (and the person's
 * saved preference) was dark: every other screen reads `var(--color-*)`,
 * this one didn't. It now uses the same theme variables as everywhere else,
 * so switching themes actually changes how these pages look, and it also
 * exposes the (previously missing) language switcher.
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ComponentTranslatePipe } from '../../../core/i18n/component-translate.pipe';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({ selector: 'app-auth-layout', standalone: true, imports: [ComponentTranslatePipe, LanguageSwitcherComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: `
  <div class="auth-page">
    <div class="auth-haze" aria-hidden="true"></div>
    <div class="auth-lang"><app-language-switcher /></div>
    <section class="auth-card">
      <div class="auth-mark" aria-label="Flowspace"><i></i><i></i><i></i></div>
      <h1>{{ heading() }}</h1>
      <p class="auth-card__subtitle"><ng-content select="[auth-subtitle]" /></p>
      <ng-content />
    </section>
    <footer>{{ 'needHelp' | componentT:'shared' }}</footer>
  </div>
`, styles: [`
  :host { display: block; min-height: 100vh; }
  .auth-page { position: relative; min-height: 100vh; display: flex; flex-direction: column; align-items: center; overflow: hidden; padding: 1rem; color: var(--color-text-primary); background: var(--color-canvas); transition: background .2s ease, color .2s ease; }
  .auth-haze { position: absolute; inset: 0 0 auto; height: 13rem; background: radial-gradient(ellipse at 18% -20%, color-mix(in srgb, var(--color-accent) 30%, transparent) 0, transparent 42%), radial-gradient(ellipse at 49% -25%, color-mix(in srgb, var(--color-accent) 20%, transparent) 0, transparent 45%), radial-gradient(ellipse at 84% -20%, color-mix(in srgb, #3fa9ff 24%, transparent) 0, transparent 46%); opacity: .9; pointer-events: none; transition: opacity .2s ease; }
  :host-context([data-theme="dark"]) .auth-haze { opacity: .32; }
  .auth-lang { position: relative; z-index: 2; align-self: flex-end; margin-inline-end: .2rem; }
  .auth-card { position: relative; z-index: 1; width: min(100%, 24.4rem); margin-top: clamp(4.2rem, 13vh, 7.6rem); text-align: center; }
  .auth-mark { width: 2.55rem; height: 2.55rem; display: grid; align-content: center; justify-items: center; gap: .16rem; margin: 0 auto .65rem; padding: .36rem; overflow: hidden; border-radius: .62rem; }
  .auth-mark i { display: block; width: 1.36rem; height: .31rem; border-radius: .31rem; transform: skewY(-31deg); }
  .auth-mark i:nth-child(1) { background: #ff785f; }
  .auth-mark i:nth-child(2) { background: #7857f7; }
  .auth-mark i:nth-child(3) { background: #279bf3; }
  .auth-card h1 { margin: 0; font-size: 1.08rem; letter-spacing: -.035em; color: var(--color-text-primary); }
  .auth-card__subtitle { margin: .3rem 0 1.1rem; color: var(--color-text-secondary); font-size: .74rem; }
  .auth-card__subtitle a { color: var(--color-accent-bright); text-decoration: none; }
  .auth-card__subtitle a:hover { text-decoration: underline; }
  .auth-page footer { position: relative; z-index: 1; margin-top: auto; padding-top: 1rem; color: var(--color-text-muted); font-size: .65rem; }
  @media (max-width: 30rem) { .auth-page { padding-inline: .75rem; } .auth-card { margin-top: 4.4rem; } }
`] })
export class AuthLayoutComponent { readonly heading = input.required<string>(); }
