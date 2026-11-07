// src/app/features/admin/notifications/services/triggers-list.store.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, of, switchMap, tap } from 'rxjs';
import { DEFAULT_TRIGGER_QUERY, NotificationTrigger, TriggerQuery } from '../models/notification-admin.models';
import { toApiProblem } from '../utils/api-problem';
import { NotificationAdminApiService } from './notification-admin-api.service';

/** Component-scoped list state. Provide it in the component's `providers` array. */
@Injectable()
export class TriggersListStore {
  private readonly api = inject(NotificationAdminApiService);
  private readonly reload$ = new Subject<void>();

  readonly query = signal<TriggerQuery>({ ...DEFAULT_TRIGGER_QUERY });
  readonly items = signal<NotificationTrigger[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.query().pageSize)));
  readonly hasFilters = computed(() => {
    const q = this.query();
    return !!q.search.trim() || q.isActive !== null || !!q.triggerType || !!q.operation;
  });

  constructor() {
    this.reload$
      .pipe(
        tap(() => { this.loading.set(true); this.error.set(null); }),
        switchMap(() =>
          this.api.list(this.query()).pipe(
            catchError(err => {
              this.error.set(toApiProblem(err).message || 'load_failed');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(res => {
        if (res) {
          this.items.set(res.items);
          this.total.set(res.total);
          // the page may no longer exist (e.g. last item on it was deleted)
          if (res.items.length === 0 && res.total > 0 && this.query().page > 1) this.setPage(this.pageCount());
        }
        this.loading.set(false);
      });

    this.refresh();
  }

  refresh(): void { this.reload$.next(); }

  /** Changing any filter resets to page 1. */
  setFilters(patch: Partial<Omit<TriggerQuery, 'page'>>): void {
    this.query.update(q => ({ ...q, ...patch, page: 1 }));
    this.refresh();
  }

  setPage(page: number): void {
    this.query.update(q => ({ ...q, page: Math.min(Math.max(1, page), this.pageCount()) }));
    this.refresh();
  }

  resetFilters(): void {
    this.query.update(q => ({ ...DEFAULT_TRIGGER_QUERY, pageSize: q.pageSize }));
    this.refresh();
  }

  /** Local optimistic update used by the status switch. */
  patchItem(id: number, patch: Partial<NotificationTrigger>): void {
    this.items.update(list => list.map(t => (t.id === id ? { ...t, ...patch } : t)));
  }
}
