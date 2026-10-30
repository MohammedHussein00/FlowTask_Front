/**
 * SpaceStore
 * ──────────
 * Single source of truth for:
 *   • the Spaces belonging to whichever workspace is currently active
 *   • which workspace that list was last loaded for (so stale data from a
 *     previous workspace is never shown while the new list is in flight)
 *   • loading / error state
 *
 * Consumed by:
 *   – Shell sidebar (SPACES section + "New Space")
 *   – SpaceService (CRUD operations)
 *   – Any component that needs the current workspace's Spaces
 */
import { Injectable, computed, signal } from '@angular/core';

export interface SpaceSnapshot {
  id: number;
  workspaceId: number;
  name: string;
  isPrivate: boolean;
  color: string;
  avatarUrl: string | null;
  memberCount: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SpaceStore {
  // ── private writable state ────────────────────────────────
  private readonly _spaces          = signal<SpaceSnapshot[]>([]);
  private readonly _loadedForWsId   = signal<number | null>(null);
  private readonly _loading         = signal(false);
  private readonly _error           = signal<string | null>(null);

  // ── public read-only projections ──────────────────────────
  readonly spaces        = this._spaces.asReadonly();
  readonly loadedForWsId = this._loadedForWsId.asReadonly();
  readonly loading       = this._loading.asReadonly();
  readonly error         = this._error.asReadonly();

  readonly hasSpaces = computed(() => this._spaces().length > 0);

  // ── mutations (called by SpaceService) ─────────────────────

  setLoading(value: boolean): void { this._loading.set(value); }
  setError(msg: string | null): void { this._error.set(msg); }

  setSpaces(workspaceId: number, list: SpaceSnapshot[]): void {
    this._loadedForWsId.set(workspaceId);
    this._spaces.set(list);
  }

  upsertSpace(space: SpaceSnapshot): void {
    this._spaces.update(list => {
      const idx = list.findIndex(s => s.id === space.id);
      return idx >= 0
        ? list.map((s, i) => (i === idx ? space : s))
        : [...list, space];
    });
  }

  /** Called when the active workspace changes — avoids flashing the previous workspace's Spaces. */
  clear(): void {
    this._spaces.set([]);
    this._loadedForWsId.set(null);
    this._loading.set(false);
    this._error.set(null);
  }
}
