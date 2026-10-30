/**
 * ChannelModalService
 * ───────────────────
 * The "Add Channel" modal is opened from more than one place in the UI — the
 * sidebar's CHANNELS section and the space tab bar's "Add Channel" pill — and
 * those two triggers live in different branches of the component tree (the
 * space tab bar is rendered inside `<router-outlet>`, so it can't emit an
 * `@Output` up to the shell the way the sidebar does). A tiny shared signal is
 * the simplest way to let any component open the same modal, which the shell
 * renders once, near the root, alongside its other overlays.
 */
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChannelModalService {
  private readonly _open = signal(false);
  readonly open = this._open.asReadonly();

  show(): void { this._open.set(true); }
  hide(): void { this._open.set(false); }
}
