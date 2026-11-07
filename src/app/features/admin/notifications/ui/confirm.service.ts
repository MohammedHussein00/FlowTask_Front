// src/app/features/admin/notifications/ui/confirm.service.ts
import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'danger' | 'primary';
}

/** Promise-based confirm dialog. Rendered by <an-confirm-host /> (placed once in the admin shell). */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly pending = signal<{ options: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      // a second dialog while one is open cancels the first
      this.pending()?.resolve(false);
      this.pending.set({ options, resolve });
    });
  }

  answer(ok: boolean): void {
    const p = this.pending();
    if (!p) return;
    this.pending.set(null);
    p.resolve(ok);
  }
}
