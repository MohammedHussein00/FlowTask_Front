/**
 * WorkspaceService
 * ────────────────
 * Orchestrates workspace CRUD:
 *   loadMyWorkspaces()   – load all user workspaces on app start / refresh
 *   loadWorkspace(id)    – load a single workspace by id
 *   createWorkspace()    – call CreateWorkspace mutation → upsert store
 *   updateWorkspace()    – call UpdateWorkspace mutation → upsert store
 *   switchWorkspace(id)  – change the active workspace in the store
 */
import { Injectable, inject } from '@angular/core';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { GraphqlClientService } from '../graphql/graphql-client.service';
import { WorkspaceStore, WorkspaceSnapshot } from '../stores/workspace.store';
import {
  GET_MY_WORKSPACES_QUERY,
  GET_WORKSPACE_QUERY,
  CREATE_WORKSPACE_MUTATION,
  UPDATE_WORKSPACE_MUTATION,
} from '../graphql/workspace.documents';

interface GqlWorkspace {
  id: number;
  name: string;
  avatarUrl: string | null;
  ownerId: number;
  ownerName: string;
  memberCount: number;
  createdAt: string;
}

interface GetMyWorkspacesData  { myWorkspaces:    GqlWorkspace[]; }
interface GetWorkspaceData     { workspace:       GqlWorkspace;   }
interface CreateWorkspaceData  { createWorkspace: GqlWorkspace;   }
interface UpdateWorkspaceData  { updateWorkspace: GqlWorkspace;   }

export interface CreateWorkspaceInput {
  name: string;
  avatarUrl?: string | null;
}

export interface UpdateWorkspaceInput {
  id: number;
  name: string;
  avatarUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly gql   = inject(GraphqlClientService);
  private readonly store = inject(WorkspaceStore);

  private toSnapshot(w: GqlWorkspace): WorkspaceSnapshot {
    return {
      id: w.id, name: w.name, avatarUrl: w.avatarUrl,
      ownerId: w.ownerId, ownerName: w.ownerName,
      memberCount: w.memberCount, createdAt: w.createdAt,
    };
  }

  loadMyWorkspaces(): Observable<WorkspaceSnapshot[]> {
    this.store.setLoading(true);
    this.store.setError(null);
    return this.gql.query<GetMyWorkspacesData>(GET_MY_WORKSPACES_QUERY).pipe(
      map(data => data.myWorkspaces.map(w => this.toSnapshot(w))),
      tap(list => { this.store.setWorkspaces(list); this.store.setLoading(false); }),
      catchError(err => {
        this.store.setLoading(false);
        this.store.setError(err?.message ?? 'Failed to load workspaces.');
        return throwError(() => err);
      }),
    );
  }

  loadWorkspace(id: number): Observable<WorkspaceSnapshot> {
    return this.gql.query<GetWorkspaceData, { id: number }>(GET_WORKSPACE_QUERY, { id }).pipe(
      map(data => this.toSnapshot(data.workspace)),
      tap(ws => this.store.upsertWorkspace(ws)),
    );
  }

  createWorkspace(input: CreateWorkspaceInput): Observable<WorkspaceSnapshot> {
    return this.gql.mutate<CreateWorkspaceData, { input: CreateWorkspaceInput }>(
      CREATE_WORKSPACE_MUTATION, { input },
    ).pipe(
      map(data => this.toSnapshot(data.createWorkspace)),
      tap(ws => { this.store.upsertWorkspace(ws); this.store.switchTo(ws.id); }),
    );
  }

  updateWorkspace(input: UpdateWorkspaceInput): Observable<WorkspaceSnapshot> {
    return this.gql.mutate<UpdateWorkspaceData, { input: UpdateWorkspaceInput }>(
      UPDATE_WORKSPACE_MUTATION, { input },
    ).pipe(
      map(data => this.toSnapshot(data.updateWorkspace)),
      tap(ws => this.store.upsertWorkspace(ws)),
    );
  }

  switchWorkspace(id: number): void {
    this.store.switchTo(id);
  }
}
