import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Apollo } from 'apollo-angular';
import { LucideAngularModule, Bell } from 'lucide-angular';
import { GET_MY_NOTIFICATIONS } from '../../../graphql/notification/notification.queries';
import { Notification } from '../../../models/notification.model';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DatePipe],
  template: `
    <div class="ft-notif-panel">
      <div class="ft-notif-header">
        <span class="ft-notif-title">Notifications</span>
        <button class="ft-link-btn" type="button" (click)="loadAll()">View all</button>
      </div>

      <div class="ft-notif-tabs">
        <button class="ft-tab" [class.ft-tab--active]="activeTab === 0" type="button" (click)="onTabChange(0)">All</button>
        <button class="ft-tab" [class.ft-tab--active]="activeTab === 1" type="button" (click)="onTabChange(1)">Unread</button>
      </div>

      @if (loading()) {
        <div class="ft-notif-spinner">
          <div class="ft-spinner"></div>
        </div>
      } @else if (notifications().length === 0) {
        <div class="ft-notif-empty">
          <lucide-icon [img]="Bell" size="32" />
          <p>No notifications</p>
        </div>
      } @else {
        <ul class="ft-notif-list">
          @for (n of notifications(); track n.id) {
            <li class="ft-notif-item" [class.ft-notif-unread]="!n.isRead">
              <div class="ft-notif-body">
                <div class="ft-notif-top">
                  <span class="ft-notif-item-title">{{ n.title }}</span>
                  @if (!n.isRead) { <span class="ft-unread-dot"></span> }
                </div>
                @if (n.message) {
                  <p class="ft-notif-message">{{ n.message }}</p>
                }
                <span class="ft-notif-time">{{ n.createdAt | date:'MMM d, h:mm a' }}</span>
              </div>
            </li>
          }
        </ul>

        @if (hasMore()) {
          <div class="ft-notif-load-more">
            <button class="ft-link-btn" type="button" (click)="loadMore()">Load more</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .ft-notif-panel {
      width: 340px;
      max-height: 480px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--color-surface-1);
      border: 1px solid var(--color-border);
      border-radius: .75rem;
      box-shadow: 0 8px 24px color-mix(in srgb, #000 25%, transparent);
    }

    .ft-notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: .75rem 1rem 0;
    }
    .ft-notif-title {
      font-weight: 700;
      font-size: .82rem;
      color: var(--color-text-primary);
    }

    /* Tab bar */
    .ft-notif-tabs {
      display: flex;
      gap: 0;
      padding: .25rem 1rem 0;
      border-bottom: 1px solid var(--color-border);
    }
    .ft-tab {
      min-height: 2rem;
      padding: 0 .55rem;
      border: 0;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: var(--color-text-muted);
      font: inherit;
      font-size: .7rem;
      font-weight: 600;
      cursor: pointer;
    }
    .ft-tab:hover { color: var(--color-text-primary); }
    .ft-tab--active { color: var(--color-text-primary); border-bottom-color: var(--color-accent); }

    /* States */
    .ft-notif-spinner {
      display: grid;
      place-items: center;
      padding: 2rem;
    }
    .ft-spinner {
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .ft-notif-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: .5rem;
      padding: 2rem;
      color: var(--color-text-muted);
    }
    .ft-notif-empty p { margin: 0; font-size: .72rem; }

    /* List */
    .ft-notif-list {
      list-style: none;
      margin: 0;
      padding: 0;
      overflow-y: auto;
      flex: 1;
    }
    .ft-notif-item {
      padding: .65rem 1rem;
      cursor: pointer;
      transition: background .14s;
      border-bottom: 1px solid var(--color-border);
    }
    .ft-notif-item:last-child { border-bottom: 0; }
    .ft-notif-item:hover { background: var(--color-surface-2); }
    .ft-notif-unread { background: color-mix(in srgb, var(--color-accent) 8%, transparent); }
    .ft-notif-unread:hover { background: color-mix(in srgb, var(--color-accent) 14%, transparent); }

    .ft-notif-body { display: flex; flex-direction: column; gap: .18rem; width: 100%; }
    .ft-notif-top { display: flex; justify-content: space-between; align-items: center; }
    .ft-notif-item-title { font-weight: 600; font-size: .72rem; color: var(--color-text-primary); }
    .ft-unread-dot {
      width: .45rem; height: .45rem; border-radius: 50%;
      background: var(--color-accent); flex: none;
    }
    .ft-notif-message {
      font-size: .67rem;
      color: var(--color-text-secondary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 270px;
    }
    .ft-notif-time { font-size: .63rem; color: var(--color-text-muted); }

    /* Link button */
    .ft-link-btn {
      border: 0;
      background: transparent;
      color: var(--color-accent-bright, var(--color-accent));
      font: inherit;
      font-size: .68rem;
      font-weight: 600;
      cursor: pointer;
      padding: .2rem .35rem;
      border-radius: .28rem;
    }
    .ft-link-btn:hover { background: color-mix(in srgb, var(--color-accent) 12%, transparent); }

    .ft-notif-load-more {
      text-align: center;
      padding: .45rem;
      border-top: 1px solid var(--color-border);
    }
  `],
})
export class NotificationPanelComponent implements OnInit {
  readonly Bell = Bell;

  notifications = signal<Notification[]>([]);
  loading = signal(false);
  hasMore = signal(false);
  activeTab = 0;

  private page = 1;
  private readonly pageSize = 10;

  constructor(private apollo: Apollo) {}

  ngOnInit() { this.loadNotifications(); }

  onTabChange(index: number) {
    this.activeTab = index;
    this.page = 1;
    this.loadNotifications();
  }

  loadAll() { this.loadNotifications(); }

  loadMore() {
    this.page++;
    this.loadNotifications(true);
  }

  private loadNotifications(append = false) {
    this.loading.set(true);
    const onlyUnread = this.activeTab === 1;
    this.apollo.query<{ getMyNotifications: { items: Notification[]; hasMore: boolean } }>({
      query: GET_MY_NOTIFICATIONS,
      variables: { page: this.page, pageSize: this.pageSize, onlyUnread },
    }).subscribe({
      next: (res) => {
        const data = res.data?.getMyNotifications;
        const items = data?.items ?? [];
        this.notifications.set(append ? [...this.notifications(), ...items] : items);
        this.hasMore.set(data?.hasMore ?? false);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
