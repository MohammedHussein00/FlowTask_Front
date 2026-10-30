/**
 * WorkspaceStore
 * ─────────────
 * Single source of truth for:
 *   • the list of workspaces the current user belongs to
 *   • the currently-active workspace
 *   • loading / error state
 *
 * Consumed by:
 *   – Shell sidebar (workspace switcher + "Create workspace")
 *   – WorkspaceService (CRUD operations)
 *   – Any component that needs `activeWorkspace`
 *
 * The active workspace choice is persisted to localStorage (see STORAGE_KEY)
 * so that reloading the app — e.g. landing on /dashboard — restores the
 * workspace the user had selected last time, instead of always defaulting
 * back to the first one in the list.
 */
import { Inject, Injectable, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AppStorage } from '../storage/app-storage';

export interface WorkspaceSnapshot {
  id: number;
  name: string;
  avatarUrl: string | null;
  ownerId: number;
  ownerName: string;
  memberCount: number;
  createdAt: string;
}

const STORAGE_KEY = 'lastWorkspaceId';

@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private readonly browser: boolean;

  // ── private writable state ────────────────────────────────
  private readonly _workspaces   = signal<WorkspaceSnapshot[]>([]);
  private readonly _activeId     = signal<number | null>(null);
  private readonly _loading      = signal(false);
  private readonly _error        = signal<string | null>(null);

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.browser = isPlatformBrowser(platformId);
  }

  // ── public read-only projections ──────────────────────────
  readonly workspaces   = this._workspaces.asReadonly();
  readonly activeId     = this._activeId.asReadonly();
  readonly loading      = this._loading.asReadonly();
  readonly error        = this._error.asReadonly();

  readonly activeWorkspace = computed(() =>
    this._workspaces().find(w => w.id === this._activeId()) ?? null
  );

  readonly hasWorkspaces = computed(() => this._workspaces().length > 0);

  // ── mutations (called by WorkspaceService) ─────────────────

  setLoading(value: boolean): void { this._loading.set(value); }
  setError(msg: string | null): void { this._error.set(msg); }

  setWorkspaces(list: WorkspaceSnapshot[]): void {
    this._workspaces.set(list);

    if (this._activeId() !== null && list.some(w => w.id === this._activeId())) {
      return; // already-active workspace is still valid — keep it
    }

    // Prefer restoring the workspace the user had open last session.
    const lastId = this.readPersistedId();
    if (lastId !== null && list.some(w => w.id === lastId)) {
      this._activeId.set(lastId);
      return;
    }

    // Fall back to the first workspace (e.g. very first login, or the
    // previously-active workspace was deleted / the user lost access to it).
    if (list.length > 0) {
      this._activeId.set(list[0].id);
      this.persistId(list[0].id);
    }
  }

  upsertWorkspace(ws: WorkspaceSnapshot): void {
    this._workspaces.update(list => {
      const idx = list.findIndex(w => w.id === ws.id);
      return idx >= 0
        ? list.map((w, i) => (i === idx ? ws : w))
        : [...list, ws];
    });
  }

  switchTo(id: number): void {
    if (this._workspaces().some(w => w.id === id)) {
      this._activeId.set(id);
      this.persistId(id);
    }
  }

  /** Called on logout — reset everything (the persisted choice is kept, so the same workspace is restored on next login). */
  clear(): void {
    this._workspaces.set([]);
    this._activeId.set(null);
    this._loading.set(false);
    this._error.set(null);
  }

  private readPersistedId(): number | null {
    if (!this.browser) return null;
    const raw = AppStorage.getString(STORAGE_KEY);
    const id = raw !== null ? Number(raw) : NaN;
    return Number.isFinite(id) ? id : null;
  }

  private persistId(id: number): void {
    if (!this.browser) return;
    AppStorage.setString(STORAGE_KEY, String(id));
  }
}
