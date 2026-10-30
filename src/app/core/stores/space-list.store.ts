/**
 * SpaceListStore
 * ──────────────
 * Tracks, per Space, whether a "List" has been created for it yet.
 * There is a single default List per Space in this app (routed at
 * `/spaces/:id/list`), so all we need to persist is *whether* it
 * exists — enough to drive the sidebar's "List" child row and to
 * gate the empty-space illustration vs. the real list/group view.
 */
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SpaceListStore {
  private readonly _spaceIdsWithList = signal<ReadonlySet<number>>(new Set());

  readonly spaceIdsWithList = this._spaceIdsWithList.asReadonly();

  hasList(spaceId: number): boolean {
    return this._spaceIdsWithList().has(spaceId);
  }

  createList(spaceId: number): void {
    if (this.hasList(spaceId)) return;
    this._spaceIdsWithList.update(set => new Set(set).add(spaceId));
  }
}
