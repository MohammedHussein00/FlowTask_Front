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
import { AnBadgeComponent } from '../ui/an-badge.component';
import { AnEmptyStateComponent } from '../ui/an-empty-state.component';
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
  template: `
    @if (loading()) {
      <div class="grid4" aria-hidden="true">@for (i of [1,2,3,4]; track i) { <div class="skel skel--stat"></div> }</div>
      <div class="grid2" aria-hidden="true"><div class="skel skel--panel"></div><div class="skel skel--panel"></div></div>
    } @else if (error()) {
      <section class="panel">
        <an-empty-state tone="danger" [icon]="TriangleAlert" [title]="'list.errorTitle' | anT" [text]="error()!">
          <button type="button" class="btn" (click)="load()">{{ 'common.retry' | anT }}</button>
        </an-empty-state>
      </section>
    } @else {
      <div class="grid4">
        @for (c of cards(); track c.key) {
          <article class="stat" [class]="'stat stat--' + c.tone">
            <span class="stat__icon"><lucide-icon [img]="c.icon" size="19" /></span>
            <div>
              <p class="stat__label">{{ ('overview.' + c.key) | anT }}</p>
              <p class="stat__value">{{ c.value }}</p>
              @if (c.sub) { <p class="stat__sub">{{ c.sub }}</p> }
            </div>
          </article>
        }
      </div>

      @if ((stats()?.total ?? 0) === 0) {
        <section class="panel">
          <an-empty-state [icon]="BellRing" [title]="'overview.emptyTitle' | anT" [text]="'overview.emptyText' | anT">
            <a class="btn" routerLink="/admin/notifications/triggers/new"><lucide-icon [img]="Plus" size="15" /> {{ 'shell.newTrigger' | anT }}</a>
            <a class="btn btn--ghost" routerLink="/admin/notifications/guide"><lucide-icon [img]="BookOpen" size="15" /> {{ 'shell.tabGuide' | anT }}</a>
          </an-empty-state>
        </section>
      } @else {
        <div class="grid2">
          <section class="panel">
            <header class="panel__head">
              <h2>{{ 'overview.mix' | anT }}</h2>
              @if (sampled()) { <span class="panel__note">{{ 'overview.sampled' | anT: { n: items().length } }}</span> }
            </header>
            <div class="bars">
              <h3>{{ 'overview.byType' | anT }}</h3>
              @for (b of typeBars(); track b.label) { <div class="bar"><span>{{ b.label }}</span><div class="bar__track"><i [style.width.%]="b.pct"></i></div><b>{{ b.count }}</b></div> }
              <h3>{{ 'overview.byOperation' | anT }}</h3>
              @for (b of opBars(); track b.label) { <div class="bar"><span>{{ b.label }}</span><div class="bar__track"><i [style.width.%]="b.pct"></i></div><b>{{ b.count }}</b></div> }
              <h3>{{ 'overview.byChannel' | anT }}</h3>
              @for (b of channelBars(); track b.label) { <div class="bar"><span>{{ b.label }}</span><div class="bar__track"><i [style.width.%]="b.pct"></i></div><b>{{ b.count }}</b></div> }
            </div>
          </section>

          <div class="stack">
            <section class="panel">
              <header class="panel__head"><h2>{{ 'overview.attention' | anT }}</h2></header>
              @if (attention().length === 0) {
                <p class="muted pad">{{ 'overview.allGood' | anT }}</p>
              } @else {
                <ul class="rows">
                  @for (a of attention(); track a.trigger.id + a.reason) {
                    <li>
                      <a [routerLink]="['/admin/notifications/triggers', a.trigger.id, 'edit']">{{ a.trigger.name }}</a>
                      <an-badge [tone]="a.reason === 'neverRan' ? 'neutral' : 'warning'">{{ ('overview.reason.' + a.reason) | anT }}</an-badge>
                    </li>
                  }
                </ul>
              }
            </section>

            <section class="panel">
              <header class="panel__head"><h2>{{ 'overview.upcoming' | anT }}</h2></header>
              @if (upcoming().length === 0) {
                <p class="muted pad">{{ 'overview.noUpcoming' | anT }}</p>
              } @else {
                <ul class="rows">
                  @for (t of upcoming(); track t.id) {
                    <li>
                      <a [routerLink]="['/admin/notifications/triggers', t.id, 'edit']">{{ t.name }}</a>
                      <span class="when" [title]="fmt(t.nextRunTime)"><lucide-icon [img]="CalendarClock" size="13" /> {{ rel(t.nextRunTime) }}</span>
                    </li>
                  }
                </ul>
              }
            </section>

            <section class="panel">
              <header class="panel__head"><h2>{{ 'overview.recent' | anT }}</h2></header>
              @if (recent().length === 0) {
                <p class="muted pad">{{ 'overview.noRecent' | anT }}</p>
              } @else {
                <ul class="rows">
                  @for (t of recent(); track t.id) {
                    <li>
                      <a [routerLink]="['/admin/notifications/triggers', t.id, 'edit']">{{ t.name }}</a>
                      <span class="when" [title]="fmt(t.lastExecutedAt)">{{ t.executionCount }} × · {{ rel(t.lastExecutedAt) }}</span>
                    </li>
                  }
                </ul>
              }
            </section>
          </div>
        </div>
      }

      <div class="actions">
        <a class="btn" routerLink="/admin/notifications/triggers/new"><lucide-icon [img]="Plus" size="15" /> {{ 'shell.newTrigger' | anT }}</a>
        <a class="btn btn--ghost" routerLink="/admin/notifications/triggers"><lucide-icon [img]="ListChecks" size="15" /> {{ 'overview.manage' | anT }}</a>
        <button type="button" class="btn btn--ghost" (click)="load()"><lucide-icon [img]="RefreshCw" size="15" /> {{ 'list.refresh' | anT }}</button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .grid4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(13.5rem, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .grid2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1rem; align-items: start; }
    .stack { display: grid; gap: 1rem; }
    .stat { display: flex; align-items: center; gap: .9rem; padding: 1.05rem 1.15rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-1); }
    .stat__icon { display: grid; place-items: center; flex: none; width: 2.7rem; height: 2.7rem; border-radius: .8rem; }
    .stat--accent .stat__icon { color: var(--color-accent-bright); background: var(--color-accent-soft); }
    .stat--success .stat__icon { color: var(--color-success-text); background: var(--color-success-soft); }
    .stat--warning .stat__icon { color: var(--color-warning-text); background: var(--color-warning-soft); }
    .stat--info .stat__icon { color: #7cc0ff; background: rgb(124 192 255 / .14); }
    .stat__label { margin: 0; font-size: .72rem; font-weight: 750; color: var(--color-text-secondary); }
    .stat__value { margin: .1rem 0 0; font-size: 1.7rem; font-weight: 800; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .stat__sub { margin: .15rem 0 0; font-size: .7rem; color: var(--color-text-muted); }

    .panel { border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-1); overflow: hidden; }
    .panel__head { display: flex; align-items: baseline; justify-content: space-between; gap: .6rem; padding: .9rem 1.1rem .7rem; }
    .panel__head h2 { margin: 0; font-size: .92rem; font-weight: 800; }
    .panel__note { font-size: .68rem; color: var(--color-text-muted); }
    .muted { color: var(--color-text-muted); font-size: .8rem; }
    .pad { margin: 0; padding: 0 1.1rem 1.1rem; }

    .bars { padding: 0 1.1rem 1.1rem; display: grid; gap: .55rem; }
    .bars h3 { margin: .7rem 0 .1rem; font-size: .66rem; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; color: var(--color-text-muted); }
    .bars h3:first-child { margin-top: 0; }
    .bar { display: grid; grid-template-columns: 7.5rem 1fr 2rem; align-items: center; gap: .65rem; font-size: .78rem; color: var(--color-text-secondary); }
    .bar b { text-align: end; color: var(--color-text-primary); font-variant-numeric: tabular-nums; }
    .bar__track { height: .5rem; border-radius: 999px; background: var(--color-surface-3); overflow: hidden; }
    .bar__track i { display: block; height: 100%; min-width: 2px; border-radius: 999px; background: linear-gradient(90deg, var(--color-accent), var(--color-accent-bright)); transition: width .4s ease; }

    .rows { list-style: none; margin: 0; padding: 0 0 .4rem; }
    .rows li { display: flex; align-items: center; justify-content: space-between; gap: .8rem; padding: .6rem 1.1rem; border-top: 1px solid var(--color-border); font-size: .8rem; }
    .rows a { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-primary); font-weight: 700; text-decoration: none; }
    .rows a:hover { color: var(--color-accent-bright); text-decoration: underline; }
    .when { display: inline-flex; align-items: center; gap: .3rem; flex: none; font-size: .72rem; color: var(--color-text-secondary); }

    .actions { display: flex; flex-wrap: wrap; gap: .6rem; margin-top: 1.2rem; }
    .btn { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.3rem; padding: 0 1rem; border-radius: var(--radius-md); color: #fff; background: var(--color-accent); font-size: .8rem; font-weight: 700; text-decoration: none; }
    .btn:hover { background: var(--color-accent-strong); }
    .btn--ghost { color: var(--color-text-secondary); background: transparent; border: 1px solid var(--color-border-strong); }
    .btn--ghost:hover { color: var(--color-text-primary); background: var(--color-surface-3); }

    .skel { border-radius: var(--radius-lg); background: linear-gradient(90deg, var(--color-surface-1) 25%, var(--color-surface-2) 50%, var(--color-surface-1) 75%); background-size: 200% 100%; animation: shimmer 1.3s linear infinite; border: 1px solid var(--color-border); }
    .skel--stat { height: 5.4rem; } .skel--panel { height: 18rem; }
    @keyframes shimmer { to { background-position: -200% 0; } }
    @media (max-width: 900px) { .grid2 { grid-template-columns: 1fr; } }
    @media (prefers-reduced-motion: reduce) { .skel, .bar__track i { animation: none; transition: none; } }
  `],
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
