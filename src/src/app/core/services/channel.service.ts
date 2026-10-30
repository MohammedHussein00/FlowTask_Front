/**
 * ChannelService
 * ──────────────
 * Orchestrates Channel creation for the currently active workspace.
 *
 * There is no backend endpoint for Channels yet, so `createChannel()`
 * simulates the round-trip (a short, randomised delay) which is exactly what
 * powers the "Adding channel…" loader in `AddChannelModalComponent` — from the
 * caller's point of view this behaves like any other async CRUD call in the
 * app (see `SpaceService.createSpace`) and can be swapped for a real GraphQL
 * mutation later without touching any consumer.
 */
import { Injectable, inject } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';
import { ChannelStore, ChannelSnapshot } from '../stores/channel.store';
import { WorkspaceStore } from '../stores/workspace.store';

const CHANNEL_COLORS = ['#5B9BD5', '#E8834E', '#DE5D83', '#8E5FE0', '#3FA772', '#D6B32C', '#4EA6A6', '#16a883'];

/** Slugs that are already taken by the sidebar's built-in, permanent channels. */
const RESERVED_SLUGS = new Set(['welcome', 'general']);

export interface CreateChannelInput {
  name: string;
  isPrivate?: boolean;
  topic?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ChannelService {
  private readonly store          = inject(ChannelStore);
  private readonly workspaceStore = inject(WorkspaceStore);

  createChannel(input: CreateChannelInput): Observable<ChannelSnapshot> {
    const workspaceId = this.workspaceStore.activeId();
    const name = input.name.trim();

    this.store.setCreating(true);
    this.store.setError(null);

    const channel: ChannelSnapshot = {
      id: this.uniqueSlug(name),
      workspaceId: workspaceId ?? 0,
      name,
      isPrivate: !!input.isPrivate,
      color: this.colorFor(name),
      topic: input.topic?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    // Simulated network round-trip — gives the "Adding channel…" loader
    // something real to show instead of resolving instantly.
    const simulatedLatencyMs = 650 + Math.round(Math.random() * 350);

    return of(channel).pipe(
      delay(simulatedLatencyMs),
      tap(created => {
        this.store.upsertChannel(created);
        this.store.setCreating(false);
      }),
    );
  }

  private colorFor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return CHANNEL_COLORS[hash % CHANNEL_COLORS.length];
  }

  private slugify(name: string): string {
    const base = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return base || 'channel';
  }

  private uniqueSlug(name: string): string {
    const base = this.slugify(name);
    const taken = new Set([...RESERVED_SLUGS, ...this.store.channels().map(c => c.id)]);
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
  }
}
