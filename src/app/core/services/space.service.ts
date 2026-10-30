/**
 * SpaceService
 * ────────────
 * Orchestrates Space CRUD, scoped to whichever workspace is currently active:
 *
 *   loadSpacesByWorkspace(id) – load every Space the user can see in a workspace
 *   createSpace()             – call CreateSpace mutation → upsert store
 *   updateSpace()             – call UpdateSpace mutation → upsert store
 *
 * A reactive `effect` watches `WorkspaceStore.activeId` and automatically
 * reloads Spaces whenever the user switches workspaces (including on the
 * very first load, right after `workspaceInitGuard` populates workspaces) —
 * no component needs to remember to call this manually.
 */
import { Injectable, effect, inject } from '@angular/core';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { GraphqlClientService } from '../graphql/graphql-client.service';
import { SpaceStore, SpaceSnapshot } from '../stores/space.store';
import { WorkspaceStore } from '../stores/workspace.store';
import {
  GET_SPACES_BY_WORKSPACE_QUERY,
  CREATE_SPACE_MUTATION,
  UPDATE_SPACE_MUTATION,
} from '../graphql/space.documents';

interface GqlSpace {
  id: number;
  workspaceId: number;
  name: string;
  isPrivate: boolean;
  color: string;
  avatarUrl: string | null;
  memberCount: number;
  createdAt: string;
}

interface GetSpacesByWorkspaceData { getSpacesByWorkspace: GqlSpace[]; }
interface CreateSpaceData          { createSpace: GqlSpace; }
interface UpdateSpaceData          { updateSpace: GqlSpace; }

export interface CreateSpaceInput {
  workspaceId: number;
  name: string;
  isPrivate?: boolean;
  color?: string;
  avatarUrl?: string | null;
}

export interface UpdateSpaceInput {
  id: number;
  name: string;
  isPrivate?: boolean;
  color?: string;
  avatarUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SpaceService {
  private readonly gql             = inject(GraphqlClientService);
  private readonly store           = inject(SpaceStore);
  private readonly workspaceStore  = inject(WorkspaceStore);

  constructor() {
    // Keep Spaces in sync with whichever workspace is active — fires once
    // workspaceInitGuard populates the first workspace, and again on every
    // manual switch from the workspace switcher.
    effect(() => {
      const workspaceId = this.workspaceStore.activeId();
      if (workspaceId === null) {
        this.store.clear();
        return;
      }
      if (this.store.loadedForWsId() === workspaceId) return;
      this.loadSpacesByWorkspace(workspaceId).subscribe({ error: () => {} });
    });
  }

  private toSnapshot(s: GqlSpace): SpaceSnapshot {
    return {
      id: s.id, workspaceId: s.workspaceId, name: s.name, isPrivate: s.isPrivate,
      color: s.color, avatarUrl: s.avatarUrl, memberCount: s.memberCount, createdAt: s.createdAt,
    };
  }

  loadSpacesByWorkspace(workspaceId: number): Observable<SpaceSnapshot[]> {
    this.store.setLoading(true);
    this.store.setError(null);
    return this.gql.query<GetSpacesByWorkspaceData, { workspaceId: number }>(
      GET_SPACES_BY_WORKSPACE_QUERY, { workspaceId }, 'network-only',
    ).pipe(
      map(data => data.getSpacesByWorkspace.map(s => this.toSnapshot(s))),
      tap(list => { this.store.setSpaces(workspaceId, list); this.store.setLoading(false); }),
      catchError(err => {
        this.store.setLoading(false);
        this.store.setError(err?.message ?? 'Failed to load spaces.');
        return throwError(() => err);
      }),
    );
  }

  createSpace(input: CreateSpaceInput): Observable<SpaceSnapshot> {
    return this.gql.mutate<CreateSpaceData, { input: CreateSpaceInput }>(
      CREATE_SPACE_MUTATION, { input },
    ).pipe(
      map(data => this.toSnapshot(data.createSpace)),
      tap(space => this.store.upsertSpace(space)),
    );
  }

  updateSpace(input: UpdateSpaceInput): Observable<SpaceSnapshot> {
    return this.gql.mutate<UpdateSpaceData, { input: UpdateSpaceInput }>(
      UPDATE_SPACE_MUTATION, { input },
    ).pipe(
      map(data => this.toSnapshot(data.updateSpace)),
      tap(space => this.store.upsertSpace(space)),
    );
  }
}