import {
  Component, EventEmitter, Output, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, Search, Star } from 'lucide-angular';

export interface CardTemplate {
  id: string;
  title: string;
  description: string;
  gradient: string;
  badge?: 'Business' | 'Core';
}

const CATEGORIES = [
  'Featured', 'Overview', 'AI Cards', 'Custom', 'Sprints',
  'Statuses', 'Tags', 'Assignees', 'Priorities',
  'Time Tracking', 'Tables', 'Embeds and Apps',
];

const CARD_TEMPLATES: CardTemplate[] = [
  { id: 'ai-brain',           title: 'AI Brain',            description: 'Generate ideas and content with a custom prompt',           gradient: 'linear-gradient(135deg,#7c3aed,#4f46e5)' },
  { id: 'task-list',          title: 'Task List',            description: 'Create a List view using tasks from any location',           gradient: 'linear-gradient(135deg,#7c3aed,#ec4899)' },
  { id: 'workload-status',    title: 'Workload by Status',   description: 'Display a pie chart of your statuses usage across locations', gradient: 'linear-gradient(135deg,#0d9488,#10b981)' },
  { id: 'calculation',        title: 'Calculation',          description: 'Calculate sums, averages, and so much more for your tasks',   gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)', badge: 'Business' },
  { id: 'portfolio',          title: 'Portfolio',            description: 'Categorize and track progress of Lists & Folders',            gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)', badge: 'Core' },
  { id: 'tasks-by-assignee',  title: 'Tasks by Assignee',   description: 'Display a pie chart of your total tasks by Assignee',         gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  { id: 'form',               title: 'Form',                 description: 'Collect data from team members or external users',            gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
  { id: 'chat',               title: 'Chat',                 description: 'Bring your team conversations into the overview',             gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)' },
  { id: 'roadmap',            title: 'Roadmap',              description: 'Plan and visualize your project timeline',                    gradient: 'linear-gradient(135deg,#64748b,#94a3b8)' },
];

@Component({
  selector: 'app-add-card-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="acm-backdrop" (click)="close.emit()">
      <div class="acm-panel" (click)="$event.stopPropagation()">

        <!-- Left sidebar -->
        <aside class="acm-sidebar">
          <h2 class="acm-sidebar__heading">Add Card</h2>
          <nav class="acm-nav">
            @for (cat of categories; track cat) {
              <button
                class="acm-nav__item"
                [class.acm-nav__item--active]="activeCategory() === cat"
                type="button"
                (click)="activeCategory.set(cat)">
                <span class="acm-nav__dot"></span>
                {{ cat }}
              </button>
            }
          </nav>
          <div class="acm-sidebar__footer">
            <button class="acm-footer-link" type="button">
              <lucide-icon [img]="Search" size="14" /> Help Docs
            </button>
            <button class="acm-footer-link" type="button">
              <lucide-icon [img]="Star" size="14" /> Dashboard Webinar
            </button>
            <button class="acm-footer-link" type="button">
              <lucide-icon [img]="Star" size="14" /> Dashboard Guide
            </button>
          </div>
        </aside>

        <!-- Main area -->
        <div class="acm-main">
          <!-- Header -->
          <div class="acm-main__header">
            <div class="acm-main__title">
              <span class="acm-main__title-icon">☆</span>
              {{ activeCategory() }}
            </div>
            <div class="acm-main__search-wrap">
              <lucide-icon [img]="Search" size="15" class="acm-main__search-icon" />
              <input
                class="acm-main__search"
                type="text"
                placeholder="Search..."
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)" />
            </div>
            <button class="acm-main__close" type="button" (click)="close.emit()" aria-label="Close">
              <lucide-icon [img]="X" size="16" />
            </button>
          </div>

          <!-- Cards grid -->
          <div class="acm-content">
            <h3 class="acm-section-title">{{ activeCategory() }}</h3>
            <div class="acm-grid">
              @for (card of filteredCards(); track card.id) {
                <button class="acm-card" type="button" (click)="selectCard(card)">
                  <div class="acm-card__preview" [style.background]="card.gradient">
                    @if (card.badge) {
                      <span class="acm-badge" [class.acm-badge--business]="card.badge === 'Business'" [class.acm-badge--core]="card.badge === 'Core'">
                        {{ card.badge }}
                      </span>
                    }
                  </div>
                  <div class="acm-card__body">
                    <strong class="acm-card__title">{{ card.title }}</strong>
                    <p class="acm-card__desc">{{ card.description }}</p>
                  </div>
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Backdrop ── */
    .acm-backdrop {
      position: fixed;
      inset: 0;
      z-index: 500;
      background: color-mix(in srgb, #000 40%, transparent);
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
    }

    /* ── Panel ── */
    .acm-panel {
      display: flex;
      width: 76rem;
      max-width: calc(100vw - 2rem);
      height: calc(100vh - 3rem);
      max-height: 46rem;
      margin: 1.5rem auto;
      background: var(--color-surface-1);
      border: 1px solid var(--color-border);
      border-radius: .75rem;
      overflow: hidden;
      box-shadow: 0 20px 60px color-mix(in srgb, #000 40%, transparent);
    }

    /* ── Left sidebar ── */
    .acm-sidebar {
      width: 13rem;
      flex: none;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--color-border);
      background: var(--color-canvas);
      overflow-y: auto;
    }
    .acm-sidebar__heading {
      margin: 0;
      padding: 1rem 1rem .65rem;
      font-size: .8rem;
      font-weight: 700;
      color: var(--color-text-primary);
      border-bottom: 1px solid var(--color-border);
    }

    /* Nav */
    .acm-nav {
      display: flex;
      flex-direction: column;
      padding: .4rem 0;
      flex: 1;
    }
    .acm-nav__item {
      display: flex;
      align-items: center;
      gap: .5rem;
      height: 2rem;
      padding: 0 .75rem;
      border: 0;
      background: transparent;
      color: var(--color-text-secondary);
      font: inherit;
      font-size: .83rem;
      text-align: left;
      cursor: pointer;
      border-radius: .35rem;
      margin: 0 .3rem;
    }
    .acm-nav__item:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .acm-nav__item--active { background: var(--color-surface-3); color: var(--color-text-primary); font-weight: 700; }
    .acm-nav__dot {
      width: .55rem;
      height: .55rem;
      border-radius: 50%;
      background: var(--color-accent);
      flex: none;
      opacity: 0;
    }
    .acm-nav__item--active .acm-nav__dot { opacity: 1; }

    /* Footer links */
    .acm-sidebar__footer {
      padding: .5rem .3rem .75rem;
      border-top: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      gap: .1rem;
    }
    .acm-footer-link {
      display: flex;
      align-items: center;
      gap: .4rem;
      height: 1.9rem;
      padding: 0 .75rem;
      border: 0;
      background: transparent;
      color: var(--color-text-muted);
      font: inherit;
      font-size: .78rem;
      cursor: pointer;
      border-radius: .32rem;
      margin: 0;
    }
    .acm-footer-link:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

    /* ── Main area ── */
    .acm-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .acm-main__header {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .65rem 1rem;
      border-bottom: 1px solid var(--color-border);
      flex: none;
    }
    .acm-main__title {
      display: flex;
      align-items: center;
      gap: .35rem;
      font-size: .90rem;
      font-weight: 700;
      color: var(--color-text-primary);
      white-space: nowrap;
    }
    .acm-main__title-icon { font-size: .9rem; }

    .acm-main__search-wrap {
      position: relative;
      flex: 1;
    }
    .acm-main__search-icon {
      position: absolute;
      left: .6rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-muted);
      pointer-events: none;
    }
    .acm-main__search {
      width: 100%;
      box-sizing: border-box;
      height: 2rem;
      padding: 0 .7rem 0 2rem;
      border: 1px solid var(--color-border);
      border-radius: .4rem;
      background: var(--color-surface-2);
      color: var(--color-text-primary);
      font: inherit;
      font-size: .83rem;
      outline: 0;
    }
    .acm-main__search:focus { border-color: var(--color-accent); }
    .acm-main__search::placeholder { color: var(--color-text-muted); }

    .acm-main__close {
      display: grid;
      place-items: center;
      width: 1.8rem;
      height: 1.8rem;
      border: 1px solid var(--color-border);
      border-radius: .35rem;
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      flex: none;
    }
    .acm-main__close:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

    /* Cards content */
    .acm-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 1.1rem 1.5rem;
    }
    .acm-section-title {
      margin: 0 0 .85rem;
      font-size: .8rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .acm-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: .85rem;
    }

    /* Card tile */
    .acm-card {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--color-border);
      border-radius: .6rem;
      overflow: hidden;
      background: var(--color-canvas);
      cursor: pointer;
      text-align: left;
      padding: 0;
      transition: border-color .15s, box-shadow .15s;
    }
    .acm-card:hover {
      border-color: var(--color-accent);
      box-shadow: 0 4px 16px color-mix(in srgb, var(--color-accent) 20%, transparent);
    }
    .acm-card__preview {
      position: relative;
      height: 8rem;
      background: #333;
    }
    .acm-badge {
      position: absolute;
      top: .5rem;
      right: .5rem;
      padding: .18rem .5rem;
      border-radius: .28rem;
      font-size: .69rem;
      font-weight: 700;
      color: #fff;
    }
    .acm-badge--business { background: #7c3aed; }
    .acm-badge--core     { background: #0d9488; }

    .acm-card__body { padding: .6rem .75rem .75rem; }
    .acm-card__title {
      display: block;
      font-size: .83rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: .25rem;
    }
    .acm-card__desc {
      margin: 0;
      font-size: .75rem;
      color: var(--color-text-secondary);
      line-height: 1.5;
    }

    @media (max-width: 900px) {
      .acm-grid { grid-template-columns: repeat(2, 1fr); }
      .acm-sidebar { display: none; }
    }
  `],
})
export class AddCardModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() cardSelected = new EventEmitter<CardTemplate>();

  readonly X = X;
  readonly Search = Search;
  readonly Star = Star;

  readonly categories = CATEGORIES;
  readonly activeCategory = signal('Featured');
  readonly searchQuery = signal('');

  readonly filteredCards = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return q ? CARD_TEMPLATES.filter(c =>
      c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    ) : CARD_TEMPLATES;
  });

  selectCard(card: CardTemplate) {
    this.cardSelected.emit(card);
    this.close.emit();
  }
}
