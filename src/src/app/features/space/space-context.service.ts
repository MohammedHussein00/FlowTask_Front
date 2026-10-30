import { Injectable, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SpaceStore } from '../../core/stores/space.store';

@Injectable({ providedIn: 'root' })
export class SpaceContextService {
  private readonly spaceStore = inject(SpaceStore);
  private readonly router     = inject(Router);
  private readonly route      = inject(ActivatedRoute);

  /** ID of the space currently shown in the tab bar. */
  private readonly _activeSpaceId = signal<number | null>(null);

  readonly activeSpaceId = this._activeSpaceId.asReadonly();

  readonly activeSpace = computed(() => {
    const id = this._activeSpaceId();
    return id ? (this.spaceStore.spaces().find(s => s.id === id) ?? null) : null;
  });

  readonly spaceName = computed(() => this.activeSpace()?.name ?? 'Space');
  readonly spaceColor = computed(() => this.activeSpace()?.color ?? 'var(--color-accent)');

  constructor() {
    // Track route changes to extract :spaceId
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
    ).subscribe(() => {
      const id = this.extractSpaceId(this.router.routerState.snapshot.root);
      this._activeSpaceId.set(id);
    });
  }

  setActiveSpaceId(id: number) {
    this._activeSpaceId.set(id);
  }

  private extractSpaceId(snapshot: any): number | null {
    if (snapshot.params?.['spaceId']) return +snapshot.params['spaceId'];
    for (const child of snapshot.children ?? []) {
      const found = this.extractSpaceId(child);
      if (found !== null) return found;
    }
    return null;
  }
}
