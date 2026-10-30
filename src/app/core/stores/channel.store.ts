/**
 * ChannelStore
 * ────────────
 * Single source of truth for the Channels the user has created, scoped to
 * whichever workspace they belong to. "Welcome" and "General" are permanent,
 * built-in channels rendered directly by the sidebar — this store only holds
 * user-created Channels (added through the "Add Channel" flow).
 *
 * Consumed by:
 *   – Shell sidebar (CHANNELS section)
 *   – ChannelService (create)
 *   – ChannelViewComponent (looking up the active channel by id)
 */
import { Injectable, computed, signal } from '@angular/core';

export interface ChannelSnapshot {
  id: string;
  workspaceId: number;
  name: string;
  isPrivate: boolean;
  color: string;
  topic: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChannelStore {
  // ── private writable state ────────────────────────────────
  private readonly _channels = signal<ChannelSnapshot[]>([]);
  private readonly _creating = signal(false);
  private readonly _error    = signal<string | null>(null);

  // ── public read-only projections ──────────────────────────
  readonly channels = this._channels.asReadonly();
  readonly creating = this._creating.asReadonly();
  readonly error    = this._error.asReadonly();

  readonly hasChannels = computed(() => this._channels().length > 0);

  // ── mutations (called by ChannelService) ───────────────────

  setCreating(value: boolean): void { this._creating.set(value); }
  setError(msg: string | null): void { this._error.set(msg); }

  upsertChannel(channel: ChannelSnapshot): void {
    this._channels.update(list => {
      const idx = list.findIndex(c => c.id === channel.id);
      return idx >= 0
        ? list.map((c, i) => (i === idx ? channel : c))
        : [...list, channel];
    });
  }

  channelsForWorkspace(workspaceId: number | null): ChannelSnapshot[] {
    if (workspaceId == null) return [];
    return this._channels().filter(c => c.workspaceId === workspaceId);
  }

  findById(id: string): ChannelSnapshot | undefined {
    return this._channels().find(c => c.id === id);
  }

  /** Called on logout / workspace reset. */
  clear(): void {
    this._channels.set([]);
    this._creating.set(false);
    this._error.set(null);
  }
}
