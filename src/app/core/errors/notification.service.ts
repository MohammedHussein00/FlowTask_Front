import { Injectable, signal } from '@angular/core';

export type NotificationKind = 'success' | 'info' | 'warning' | 'error';

export interface NotificationItem {
  id: number;
  kind: NotificationKind;
  title: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly items = signal<readonly NotificationItem[]>([]);
  private nextId = 0;

  show(kind: NotificationKind, title: string, message?: string, durationMs = 4200): void {
    const item = { id: ++this.nextId, kind, title, message };
    this.items.update(items => [...items, item]);
    if (durationMs > 0) window.setTimeout(() => this.dismiss(item.id), durationMs);
  }

  success(title: string, message?: string): void { this.show('success', title, message); }
  info(title: string, message?: string): void { this.show('info', title, message); }
  warning(title: string, message?: string): void { this.show('warning', title, message); }
  error(title: string, message?: string): void { this.show('error', title, message, 6500); }

  dismiss(id: number): void {
    this.items.update(items => items.filter(item => item.id !== id));
  }
}
