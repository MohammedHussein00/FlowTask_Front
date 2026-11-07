// src/app/features/admin/notifications/overview/notifications-overview.component.ts
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Activity, BellRing, BookOpen, CalendarClock, CirclePause, Database, ListChecks, LucideAngularModule, Plus,
  RefreshCw, TriangleAlert, Zap, type LucideIconData,
} from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { LocaleService } from '../../../../core/i18n/locale.service';
import { NotificationTrigger, TriggerStatistics } from '../models/notification-admin.models';
import { NotificationAdminApiService } from '../services/notification-admin-api.service';
import { AnBadgeComponent } from '../ui/an-badge/an-badge.component';
import { AnEmptyStateComponent } from '../ui/an-empty-state/an-empty-state.component';
import { AnI18n, AnTPipe } from '../utils/an-i18n';
import { toApiProblem } from '../utils/api-problem';
import { formatDateTime, parseUtc, relativeTime } from '../utils/format';

interface StatCard { key: string; icon: LucideIconData; value: number; tone: 'accent' | 'success' | 'warning' | 'info'; sub?: string; }
interface Bar { label: string; count: number; pct: number; }
interface Attention { trigger: NotificationTrigger; reason: 'noNextRun' | 'neverRan' | 'everyone'; }

@Component({
  selector: 'app-notifications-overview',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, AnTPipe, AnBadgeComponent, AnEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications-overview.component.html',
  styleUrl: './notifications-overview.component.scss',
})
export class NotificationsOverviewComponent {
  private readonly api = inject(NotificationAdminApiService);
  private readonly i18n = inject(AnI18n);
  private readonly locale = inject(LocaleService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stats = signal<TriggerStatistics | null>(null);
  readonly items = signal<NotificationTrigger[]>([]);

  readonly sampled = computed(() => (this.stats()?.total ?? 0) > this.items().length);

  readonly cards = computed<StatCard[]>(() => {
    const s = this.stats();
    if (!s) return [];
    const pct = s.total ? Math.round((s.active / s.total) * 100) : 0;
    return [
      { key: 'total', icon: ListChecks, value: s.total, tone: 'accent' },
      { key: 'active', icon: Zap, value: s.active, tone: 'success', sub: `${pct}%` },
      { key: 'paused', icon: CirclePause, value: s.inactive, tone: 'warning' },
      { key: 'executions', icon: Activity, value: s.totalExecutions, tone: 'info' },
    ];
  });

  readonly typeBars = computed(() => this.bars([
    [this.i18n.t('type.db'), this.items().filter(t => t.triggerType === 'DatabaseAction').length],
    [this.i18n.t('type.scheduled'), this.items().filter(t => t.triggerType === 'Scheduled').length],
  ]));
  readonly opBars = computed(() => this.bars(['INSERT', 'UPDATE', 'DELETE'].map(op =>
    [op, this.items().filter(t => t.triggerType === 'DatabaseAction' && t.triggerOperation === op).length] as [string, number])));
  readonly channelBars = computed(() => this.bars([
    [this.i18n.t('channel.inApp'), this.items().filter(t => t.sendToNotificationTable).length],
    [this.i18n.t('channel.push'), this.items().filter(t => t.sendPushNotification).length],
    [this.i18n.t('channel.email'), this.items().filter(t => t.sendEmail).length],
  ]));

  readonly upcoming = computed(() => this.items()
    .filter(t => t.isActive && t.triggerType === 'Scheduled' && !!t.nextRunTime)
    .sort((a, b) => parseUtc(a.nextRunTime)!.getTime() - parseUtc(b.nextRunTime)!.getTime())
    .slice(0, 5));

  readonly recent = computed(() => this.items()
    .filter(t => !!t.lastExecutedAt)
    .sort((a, b) => parseUtc(b.lastExecutedAt)!.getTime() - parseUtc(a.lastExecutedAt)!.getTime())
    .slice(0, 5));

  readonly attention = computed<Attention[]>(() => {
    const dayAgo = Date.now() - 86_400_000;
    const out: Attention[] = [];
    for (const t of this.items()) {
      if (!t.isActive) continue;
      if (t.triggerType === 'Scheduled' && t.recurrenceType !== 'Once' && !t.nextRunTime) out.push({ trigger: t, reason: 'noNextRun' });
      else if (!t.targetUsersQuery?.trim() && !t.allowedRoles?.trim()) out.push({ trigger: t, reason: 'everyone' });
      else if (t.executionCount === 0 && (parseUtc(t.createdAt)?.getTime() ?? Date.now()) < dayAgo) out.push({ trigger: t, reason: 'neverRan' });
    }
    return out.slice(0, 6);
  });

  // icons
  readonly BellRing = BellRing; readonly BookOpen = BookOpen; readonly CalendarClock = CalendarClock; readonly Database = Database;
  readonly ListChecks = ListChecks; readonly Plus = Plus; readonly RefreshCw = RefreshCw; readonly TriangleAlert = TriangleAlert;

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      stats: this.api.statistics(),
      list: this.api.list({ page: 1, pageSize: 100, search: '', isActive: null, triggerType: '', operation: '' }),
    }).subscribe({
      next: ({ stats, list }) => { this.stats.set(stats); this.items.set(list.items); this.loading.set(false); },
      error: err => { this.error.set(toApiProblem(err).message || this.i18n.t('list.errorText')); this.loading.set(false); },
    });
  }

  rel(v: string | null): string { return relativeTime(v, this.locale.current); }
  fmt(v: string | null): string { return formatDateTime(v, this.locale.current); }

  private bars(rows: Array<[string, number]>): Bar[] {
    const max = Math.max(1, ...rows.map(r => r[1]));
    return rows.map(([label, count]) => ({ label, count, pct: (count / max) * 100 }));
  }
}
