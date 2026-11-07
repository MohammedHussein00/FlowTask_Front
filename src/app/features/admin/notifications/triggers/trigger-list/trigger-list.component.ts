// src/app/features/admin/notifications/triggers/trigger-list/trigger-list.component.ts
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  BellRing, CalendarClock, ChevronLeft, ChevronRight, Copy, Database, FilterX, ListChecks, LucideAngularModule, Mail,
  MessageSquare, Pencil, Plus, RefreshCw, Search, Smartphone, Trash2, TriangleAlert,
} from 'lucide-angular';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { NotificationService } from '../../../../../core/errors/notification.service';
import { LocaleService } from '../../../../../core/i18n/locale.service';
import { NotificationTrigger, TriggerOperation, TriggerType } from '../../models/notification-admin.models';
import { NotificationAdminApiService } from '../../services/notification-admin-api.service';
import { TriggersListStore } from '../../services/triggers-list.store';
import { AnBadgeComponent } from '../../ui/an-badge/an-badge.component';
import { AnEmptyStateComponent } from '../../ui/an-empty-state/an-empty-state.component';
import { AnSegmentedComponent, SegmentOption } from '../../ui/an-segmented/an-segmented.component';
import { AnSwitchComponent } from '../../ui/an-switch/an-switch.component';
import { ConfirmService } from '../../ui/confirm.service';
import { AnI18n, AnTPipe } from '../../utils/an-i18n';
import { toApiProblem } from '../../utils/api-problem';
import { relativeTime } from '../../utils/format';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-trigger-list',
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule, RouterLink, LucideAngularModule, AnTPipe, AnBadgeComponent, AnEmptyStateComponent,
    AnSegmentedComponent, AnSwitchComponent,
  ],
  providers: [TriggersListStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trigger-list.component.html',
  styleUrl: './trigger-list.component.scss',
})
export class TriggerListComponent {
  readonly store = inject(TriggersListStore);
  private readonly api = inject(NotificationAdminApiService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(NotificationService);
  private readonly i18n = inject(AnI18n);
  private readonly locale = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  readonly busyIds = signal<ReadonlySet<number>>(new Set());
  readonly pageSizes = [10, 20, 50];

  readonly statusOptions = computed<SegmentOption<StatusFilter>[]>(() => [
    { value: 'all', label: this.i18n.t('list.statusAll') },
    { value: 'active', label: this.i18n.t('list.statusActive') },
    { value: 'inactive', label: this.i18n.t('list.statusPaused') },
  ]);

  readonly status = computed<StatusFilter>(() => {
    const v = this.store.query().isActive;
    return v === null ? 'all' : v ? 'active' : 'inactive';
  });

  readonly range = computed(() => {
    const q = this.store.query();
    const total = this.store.total();
    return { from: total === 0 ? 0 : (q.page - 1) * q.pageSize + 1, to: Math.min(q.page * q.pageSize, total), total };
  });

  // icons
  readonly Search = Search; readonly RefreshCw = RefreshCw; readonly FilterX = FilterX; readonly Plus = Plus;
  readonly Pencil = Pencil; readonly Copy = Copy; readonly Trash2 = Trash2; readonly Database = Database;
  readonly CalendarClock = CalendarClock; readonly BellRing = BellRing; readonly Smartphone = Smartphone;
  readonly Mail = Mail; readonly MessageSquare = MessageSquare; readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight; readonly ListChecks = ListChecks; readonly TriangleAlert = TriangleAlert;

  constructor() {
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(search => this.store.setFilters({ search }));
  }

  onStatus(v: StatusFilter): void {
    this.store.setFilters({ isActive: v === 'all' ? null : v === 'active' });
  }
  onType(e: Event): void { this.store.setFilters({ triggerType: (e.target as HTMLSelectElement).value as '' | TriggerType }); }
  onOperation(e: Event): void { this.store.setFilters({ operation: (e.target as HTMLSelectElement).value as '' | TriggerOperation }); }
  onPageSize(e: Event): void {
    this.store.query.update(q => ({ ...q, pageSize: Number((e.target as HTMLSelectElement).value), page: 1 }));
    this.store.refresh();
  }

  clearFilters(): void {
    this.search.setValue('', { emitEvent: false });
    this.store.resetFilters();
  }

  isBusy(id: number): boolean { return this.busyIds().has(id); }
  private setBusy(id: number, on: boolean): void {
    this.busyIds.update(s => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });
  }

  // ── row helpers ──
  scheduleLabel(t: NotificationTrigger): string {
    switch (t.recurrenceType) {
      case 'Once': return this.i18n.t('rec.once');
      case 'Daily': return this.i18n.t('rec.dailyAt', { time: (t.scheduledTime ?? '').slice(0, 5) });
      case 'Weekly': return this.i18n.t('rec.weeklyAt', { time: (t.scheduledTime ?? '').slice(0, 5) });
      case 'Monthly': return this.i18n.t('rec.monthlyAt', { time: (t.scheduledTime ?? '').slice(0, 5) });
      case 'Cron': return t.cronExpression ?? 'cron';
      default: return '—';
    }
  }

  audience(t: NotificationTrigger): { kind: 'users' | 'roles' | 'everyone'; text: string } {
    if (t.targetUsersQuery?.trim()) return { kind: 'users', text: t.targetUsersQuery.trim() };
    if (t.allowedRoles?.trim()) return { kind: 'roles', text: t.allowedRoles.split(',').map(r => r.trim()).join(', ') };
    return { kind: 'everyone', text: this.i18n.t('audience.everyone') };
  }

  rel(value: string | null): string { return relativeTime(value, this.locale.current); }

  // ── actions ──
  edit(t: NotificationTrigger): void { void this.router.navigate(['/admin/notifications/triggers', t.id, 'edit']); }
  duplicate(t: NotificationTrigger): void {
    void this.router.navigate(['/admin/notifications/triggers/new'], { queryParams: { from: t.id } });
  }

  toggle(t: NotificationTrigger, wanted: boolean): void {
    if (this.isBusy(t.id) || wanted === t.isActive) return;
    this.setBusy(t.id, true);
    this.store.patchItem(t.id, { isActive: wanted });                       // optimistic
    this.api.toggle(t.id).subscribe({
      next: res => {
        this.store.patchItem(t.id, { isActive: res.isActive });
        this.toast.success(this.i18n.t(res.isActive ? 'toast.activated' : 'toast.paused', { name: t.name }));
        this.setBusy(t.id, false);
      },
      error: err => {
        this.store.patchItem(t.id, { isActive: !wanted });                  // roll back
        this.toast.error(this.i18n.t('toast.toggleFailed'), toApiProblem(err).message || undefined);
        this.setBusy(t.id, false);
      },
    });
  }

  async remove(t: NotificationTrigger): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('delete.title'),
      message: this.i18n.t('delete.message', { name: t.name }),
      confirmLabel: this.i18n.t('delete.confirm'),
      cancelLabel: this.i18n.t('common.cancel'),
      tone: 'danger',
    });
    if (!ok) return;

    this.setBusy(t.id, true);
    this.api.remove(t.id).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('toast.deleted', { name: t.name }));
        this.setBusy(t.id, false);
        this.store.refresh();
      },
      error: err => {
        this.toast.error(this.i18n.t('toast.deleteFailed'), toApiProblem(err).message || undefined);
        this.setBusy(t.id, false);
      },
    });
  }

  trackId(_: number, t: NotificationTrigger): number { return t.id; }
}
