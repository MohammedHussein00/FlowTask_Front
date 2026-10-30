import {
  Component, EventEmitter, Output, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ListFilter, RefreshCw, ChevronDown, ChevronUp, ChevronRight,
  Trash2, Plus, X, Link2, Star,
} from 'lucide-angular';
import { NotificationService } from '../../../core/errors/notification.service';

const FILTER_OPTIONS = [
  'Archived', 'Assigned comment', 'Assignee', 'Created by',
  'Date closed', 'Date created', 'Date done', 'Date updated', 'Dependency',
  'Due date', 'Priority', 'Sprint', 'Status', 'Tag', 'Time estimated',
];

export interface FilterRow {
  id: number;
  value: string;
  dropdownOpen: boolean;
  search: string;
}

@Component({
  selector: 'app-overview-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="ovt-host" (click)="onHostClick()">

      <!-- Toolbar bar -->
      <div class="ovt-bar">
        <button class="ovt-filter-btn" type="button" (click)="toggleFilters($event)">
          <lucide-icon [img]="ListFilter" size="14" />
          Filters
        </button>
        <div class="ovt-right">
          <span class="ovt-refresh">
            <lucide-icon [img]="RefreshCw" size="13" [class.spin]="isRefreshing" />
            {{ isRefreshing ? 'Refreshing...' : 'Refreshed: ' + refreshLabel }}
          </span>
          <button class="ovt-autorefresh" type="button">
            <lucide-icon [img]="RefreshCw" size="13" />
            Auto refresh: On
          </button>
          <button class="ovt-customize" type="button" (click)="toggleCustomize($event)">Customize</button>
          <button class="btn-accent" type="button" (click)="addCard.emit()">Add card</button>
        </div>
      </div>

      <!-- Filters panel -->
      @if (filtersOpen()) {
        <div class="ovt-filters" (click)="$event.stopPropagation()">
          <h3 class="ovt-filters__title">Overview Filters</h3>

          @for (row of filterRows(); track row.id; let first = $first) {
            <div class="ovt-frow">
              @if (!first) {
                <button class="ovt-logic" type="button">AND <lucide-icon [img]="ChevronDown" size="12" /></button>
              }
              <div class="ovt-frow__wrap">
                <button class="ovt-fselect" type="button"
                  [class.ovt-fselect--open]="row.dropdownOpen"
                  (click)="toggleDropdown(row, $event)">
                  <span>{{ row.value || 'Select filter' }}</span>
                  <lucide-icon [img]="ChevronDown" size="13" />
                </button>
                <button class="ovt-fdel" type="button" (click)="removeRow(row.id)" aria-label="Remove">
                  <lucide-icon [img]="Trash2" size="13" />
                </button>
                @if (row.dropdownOpen) {
                  <div class="ovt-dropdown" (click)="$event.stopPropagation()">
                    <input class="ovt-dsearch" type="text" placeholder="Search..."
                      [(ngModel)]="row.search" (input)="triggerUpdate()" autofocus />
                    @if (row.value) {
                      <button class="ovt-dclear" type="button" (click)="clearRow(row)">Clear all</button>
                    }
                    <div class="ovt-dgroup">In selected location(s)</div>
                    <ul class="ovt-dlist">
                      @for (opt of getOptions(row); track opt) {
                        <li class="ovt-dopt"
                          [class.ovt-dopt--active]="row.value === opt"
                          (click)="pickOption(row, opt)">{{ opt }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>
              <button class="ovt-nested" type="button">Add nested filter</button>
            </div>
          }

          <button class="ovt-addrow" type="button" (click)="addRow()">
            <lucide-icon [img]="Plus" size="13" /> Add filter
          </button>
        </div>
      }

      <!-- Customize view panel -->
      @if (customizeOpen()) {
        <div class="ovc-panel" (click)="$event.stopPropagation()">
          <header class="ovc-header">
            <h3>Customize view</h3>
            <button class="ovc-close" type="button" aria-label="Close" (click)="customizeOpen.set(false)">
              <lucide-icon [img]="X" size="16" />
            </button>
          </header>

          <div class="ovc-body">
            <!-- Filter -->
            <button class="ovc-row" type="button" (click)="toggleCustFilter($event)">
              <span>Filter</span>
              <span class="ovc-row__val">
                {{ custFilterRow().value || 'None' }}
                <lucide-icon [img]="custFilterOpen() ? ChevronUp : ChevronDown" size="14" />
              </span>
            </button>

            @if (custFilterOpen()) {
              <div class="ovc-dashfilters" (click)="$event.stopPropagation()">
                <h4 class="ovc-dashfilters__title">Dashboard Filters</h4>
                <div class="ovc-dfrow">
                  <div class="ovt-frow__wrap ovc-dfrow__wrap">
                    <button class="ovt-fselect" type="button"
                      [class.ovt-fselect--open]="custFilterRow().dropdownOpen"
                      (click)="toggleCustDropdown($event)">
                      <span>{{ custFilterRow().value || 'Select filter' }}</span>
                      <lucide-icon [img]="ChevronDown" size="13" />
                    </button>
                    @if (custFilterRow().dropdownOpen) {
                      <div class="ovt-dropdown" (click)="$event.stopPropagation()">
                        <input class="ovt-dsearch" type="text" placeholder="Search..."
                          [(ngModel)]="custFilterSearch" autofocus />
                        @if (custFilterRow().value) {
                          <button class="ovt-dclear" type="button" (click)="clearCustFilter()">Clear all</button>
                        }
                        <div class="ovt-dgroup">In selected location(s)</div>
                        <ul class="ovt-dlist">
                          @for (opt of getCustFilterOptions(); track opt) {
                            <li class="ovt-dopt"
                              [class.ovt-dopt--active]="custFilterRow().value === opt"
                              (click)="pickCustFilterOption(opt)">{{ opt }}</li>
                          }
                        </ul>
                      </div>
                    }
                  </div>
                  <button class="ovt-fdel" type="button" (click)="clearCustFilter()" aria-label="Remove">
                    <lucide-icon [img]="Trash2" size="13" />
                  </button>
                </div>
              </div>
            }

            <!-- Toggles -->
            <button class="ovc-row" type="button" (click)="autoLayout.set(!autoLayout())">
              <span>Auto layout</span>
              <span class="ovc-toggle" [class.ovc-toggle--on]="autoLayout()"><i></i></span>
            </button>
            <button class="ovc-row" type="button" (click)="autoRefresh.set(!autoRefresh())">
              <span>Auto refresh</span>
              <span class="ovc-toggle" [class.ovc-toggle--on]="autoRefresh()"><i></i></span>
            </button>

            <div class="ovc-divider"></div>

            <button class="ovc-row" type="button" (click)="protectView.set(!protectView())">
              <span>Protect view</span>
              <span class="ovc-toggle" [class.ovc-toggle--on]="protectView()"><i></i></span>
            </button>
            <button class="ovc-row" type="button" (click)="defaultView.set(!defaultView())">
              <span>Set as default view</span>
              <span class="ovc-toggle" [class.ovc-toggle--on]="defaultView()"><i></i></span>
            </button>

            <div class="ovc-divider"></div>

            <!-- Export view -->
            <button class="ovc-row" type="button" (click)="exportOpen.set(!exportOpen())">
              <span>Export view</span>
              <lucide-icon [img]="ChevronRight" size="14" class="ovc-chevron" [class.ovc-chevron--open]="exportOpen()" />
            </button>
            @if (exportOpen()) {
              <div class="ovc-submenu">
                <button class="ovc-subitem" type="button" (click)="exportView('csv')">Export as CSV</button>
                <button class="ovc-subitem" type="button" (click)="exportView('pdf')">Export as PDF</button>
              </div>
            }

            <!-- Copy link -->
            <button class="ovc-row" type="button" (click)="copyLink()">
              <span class="ovc-row__icontext"><lucide-icon [img]="Link2" size="14" /> Copy link to view</span>
            </button>

            <!-- Favorite -->
            <button class="ovc-row" type="button" (click)="favoriteOpen.set(!favoriteOpen())">
              <span>Favorite</span>
              <lucide-icon [img]="ChevronRight" size="14" class="ovc-chevron" [class.ovc-chevron--open]="favoriteOpen()" />
            </button>
            @if (favoriteOpen()) {
              <div class="ovc-favpanel">
                <div class="ovc-layout-opts">
                  <button class="ovc-layout-opt" type="button"
                    [class.ovc-layout-opt--selected]="favLayout() === 'sidebar'"
                    (click)="favLayout.set('sidebar')">
                    <span class="ovc-layout-preview ovc-layout-preview--sidebar"><i></i><b></b></span>
                    Sidebar
                  </button>
                  <button class="ovc-layout-opt" type="button"
                    [class.ovc-layout-opt--selected]="favLayout() === 'top'"
                    (click)="favLayout.set('top')">
                    <span class="ovc-layout-preview ovc-layout-preview--top"><i></i><b></b></span>
                    Top
                  </button>
                </div>
                <div class="ovc-sections-head">
                  <span>Sections</span>
                  <button class="ovc-addsection" type="button" aria-label="Add section">
                    <lucide-icon [img]="Plus" size="13" />
                  </button>
                </div>
                <div class="ovc-fav-item">
                  <lucide-icon [img]="Star" size="13" /> Favorites
                </div>
              </div>
            }

            <div class="ovc-divider"></div>

            <button class="ovc-row ovc-row--danger" type="button" (click)="deleteView()">
              <span class="ovc-row__icontext"><lucide-icon [img]="Trash2" size="14" /> Delete view</span>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .ovt-host { position: relative; }

    /* ── Toolbar bar ── */
    .ovt-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 3.4rem;
      padding: 0 .85rem;
      border-bottom: 1px solid var(--color-border);
    }
    .ovt-right { display: flex; align-items: center; gap: .5rem; }

    .ovt-filter-btn {
      display: inline-flex; align-items: center; gap: .32rem;
      min-height: 1.75rem; padding: 0 .65rem;
      border: 1px solid var(--color-border-strong); border-radius: 2rem;
      background: transparent; color: var(--color-text-muted);
      font: inherit; font-size: .78rem; cursor: pointer;
    }
    .ovt-filter-btn:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

    .ovt-refresh {
      display: inline-flex; align-items: center; gap: .28rem;
      color: var(--color-text-muted); font-size: .72rem; white-space: nowrap;
    }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .ovt-autorefresh {
      display: inline-flex; align-items: center; gap: .28rem;
      height: 1.65rem; padding: 0 .5rem;
      border: 1px solid color-mix(in srgb, var(--color-accent) 42%, var(--color-border)); border-radius: 2rem;
      background: color-mix(in srgb, var(--color-accent) 14%, transparent); color: color-mix(in srgb, var(--color-accent) 65%, var(--color-text-primary));
      font: inherit; font-size: .72rem; white-space: nowrap; cursor: pointer;
    }
    .ovt-autorefresh:hover { background: color-mix(in srgb, var(--color-accent) 24%, transparent); }
    .ovt-customize {
      border: 0; background: transparent; color: var(--color-text-secondary);
      font: inherit; font-size: .77rem; cursor: pointer; padding: .2rem .3rem;
    }
    .ovt-customize:hover { color: var(--color-text-primary); }
    .btn-accent {
      display: inline-flex; align-items: center; gap: .28rem;
      min-height: 1.85rem; padding: 0 .75rem;
      border: 0; border-radius: .5rem;
      background: var(--color-btn-primary-bg); color: var(--color-btn-primary-text);
      font: inherit; font-size: .84rem; font-weight: 600; cursor: pointer;
    }
    .btn-accent:hover { background: var(--color-btn-primary-bg-hover); }

    /* ── Filters panel ── */
    .ovt-filters {
      position: absolute;
      top: 100%; left: .85rem;
      z-index: 200;
      width: 36rem; max-width: calc(100vw - 1.7rem);
      padding: 1rem 1.1rem 1.1rem;
      background: var(--color-surface-1);
      border: 1px solid var(--color-border);
      border-radius: .65rem;
      box-shadow: 0 8px 28px color-mix(in srgb, #000 30%, transparent);
    }
    .ovt-filters__title {
      margin: 0 0 .75rem;
      font-size: .87rem; font-weight: 700;
      color: var(--color-text-primary);
    }

    .ovt-frow { display: flex; flex-direction: column; gap: .3rem; margin-bottom: .4rem; }
    .ovt-logic {
      display: inline-flex; align-items: center; gap: .25rem;
      height: 1.65rem; padding: 0 .45rem;
      border: 1px solid var(--color-border); border-radius: .32rem;
      background: var(--color-surface-2); color: var(--color-text-secondary);
      font: inherit; font-size: .75rem; font-weight: 700; cursor: pointer;
      align-self: flex-start;
    }
    .ovt-frow__wrap { position: relative; display: flex; align-items: center; gap: .35rem; }

    .ovt-fselect {
      flex: 1; display: inline-flex; align-items: center; justify-content: space-between;
      height: 2rem; padding: 0 .6rem;
      border: 1px solid var(--color-border); border-radius: .4rem;
      background: var(--color-surface-2); color: var(--color-text-secondary);
      font: inherit; font-size: .80rem; cursor: pointer; gap: .4rem;
    }
    .ovt-fselect > span { flex: 1; text-align: left; }
    .ovt-fselect:hover { border-color: var(--color-border-strong); }
    .ovt-fselect--open { border-color: var(--color-accent); }

    .ovt-fdel {
      display: grid; place-items: center;
      width: 1.75rem; height: 1.75rem; flex: none;
      border: 0; border-radius: .32rem;
      background: transparent; color: var(--color-text-muted); cursor: pointer;
    }
    .ovt-fdel:hover { background: var(--color-surface-3); color: var(--color-danger, #e5534b); }

    /* Dropdown */
    .ovt-dropdown {
      position: absolute; top: calc(100% + .2rem); left: 0;
      z-index: 300; width: 13rem;
      background: var(--color-surface-1);
      border: 1px solid var(--color-border); border-radius: .5rem;
      box-shadow: 0 6px 20px color-mix(in srgb,#000 25%,transparent);
      overflow: hidden;
    }
    .ovt-dsearch {
      display: block; width: 100%; box-sizing: border-box;
      padding: .42rem .65rem;
      border: 0; border-bottom: 1px solid var(--color-border);
      background: transparent; color: var(--color-text-primary);
      font: inherit; font-size: .80rem; outline: 0;
    }
    .ovt-dsearch::placeholder { color: var(--color-text-muted); }
    .ovt-dclear {
      position: absolute; top: .42rem; right: .45rem;
      border: 0; background: transparent;
      color: var(--color-danger, #e5534b);
      font: inherit; font-size: .72rem; font-weight: 700; cursor: pointer;
    }
    .ovt-dgroup {
      padding: .4rem .65rem .18rem;
      font-size: .69rem; font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: .04em;
    }
    .ovt-dlist {
      list-style: none; margin: 0; padding: 0 0 .3rem;
      max-height: 13rem; overflow-y: auto;
    }
    .ovt-dopt {
      padding: .35rem .65rem;
      font-size: .80rem; color: var(--color-text-secondary); cursor: pointer;
    }
    .ovt-dopt:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
    .ovt-dopt--active { color: var(--color-accent); font-weight: 600; }

    .ovt-nested {
      border: 0; background: transparent;
      color: var(--color-accent-bright, var(--color-accent));
      font: inherit; font-size: .74rem; font-weight: 600; cursor: pointer;
      padding: .12rem .2rem; border-radius: .22rem; align-self: flex-start;
    }
    .ovt-nested:hover { text-decoration: underline; }

    .ovt-addrow {
      display: inline-flex; align-items: center; gap: .28rem;
      min-height: 1.65rem; padding: 0 .5rem; margin-top: .15rem;
      border: 1px solid var(--color-border); border-radius: .35rem;
      background: transparent; color: var(--color-text-secondary);
      font: inherit; font-size: .77rem; font-weight: 600; cursor: pointer;
    }
    .ovt-addrow:hover { background: var(--color-surface-2); }

    /* ── Customize view panel ── */
    .ovc-panel {
      position: absolute;
      top: 100%; right: .85rem;
      z-index: 250;
      width: 17.5rem; max-width: calc(100vw - 1.7rem);
      background: var(--color-surface-1);
      border: 1px solid var(--color-border);
      border-radius: .6rem;
      box-shadow: 0 8px 28px color-mix(in srgb, #000 30%, transparent);
      overflow: visible;
    }
    .ovc-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: .7rem .5rem .55rem .9rem;
    }
    .ovc-header h3 { margin: 0; font-size: .90rem; font-weight: 700; color: var(--color-text-primary); }
    .ovc-close {
      display: grid; place-items: center;
      width: 1.7rem; height: 1.7rem; flex: none;
      border: 0; border-radius: .35rem;
      background: transparent; color: var(--color-text-muted); cursor: pointer;
    }
    .ovc-close:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

    .ovc-body { padding: 0 0 .5rem; display: flex; flex-direction: column; }

    .ovc-row {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; min-height: 2.15rem; padding: 0 .9rem;
      border: 0; background: transparent; color: var(--color-text-primary);
      font: inherit; font-size: .85rem; text-align: left; cursor: pointer;
    }
    .ovc-row:hover { background: var(--color-surface-2); }
    .ovc-row--danger { color: var(--color-danger, #e5534b); }
    .ovc-row--danger:hover { background: color-mix(in srgb, var(--color-danger, #e5534b) 12%, transparent); }

    .ovc-row__val {
      display: inline-flex; align-items: center; gap: .3rem;
      color: var(--color-text-muted); font-size: .83rem;
    }
    .ovc-row__icontext {
      display: inline-flex; align-items: center; gap: .5rem;
    }
    .ovc-chevron { color: var(--color-text-muted); transition: transform .12s; }
    .ovc-chevron--open { transform: rotate(90deg); }

    .ovc-divider { height: 1px; margin: .35rem 0; background: var(--color-border); }

    /* Toggle switch */
    .ovc-toggle {
      position: relative; flex: none;
      width: 1.85rem; height: 1.05rem;
      border-radius: 1rem;
      background: var(--color-border-strong);
      transition: background .12s;
    }
    .ovc-toggle i {
      position: absolute; top: .13rem; left: .13rem;
      width: .8rem; height: .8rem; border-radius: 50%;
      background: #fff; transition: left .12s;
    }
    .ovc-toggle--on { background: var(--color-accent); }
    .ovc-toggle--on i { left: calc(100% - .93rem); }

    /* Dashboard Filters popover (spawned by the Filter row) */
    .ovc-dashfilters {
      position: absolute;
      top: 0; right: calc(100% + .5rem);
      z-index: 260;
      width: 15rem;
      padding: .75rem .8rem .85rem;
      background: var(--color-surface-1);
      border: 1px solid var(--color-border);
      border-radius: .6rem;
      box-shadow: 0 8px 28px color-mix(in srgb, #000 30%, transparent);
    }
    .ovc-dashfilters__title { margin: 0 0 .6rem; font-size: .85rem; font-weight: 700; color: var(--color-text-primary); }
    .ovc-dfrow { display: flex; align-items: center; gap: .35rem; }
    .ovc-dfrow__wrap { flex: 1; }

    /* Export submenu */
    .ovc-submenu { display: flex; flex-direction: column; padding: .1rem 0 .3rem; }
    .ovc-subitem {
      display: block; width: 100%; text-align: left;
      min-height: 1.9rem; padding: 0 .9rem 0 1.6rem;
      border: 0; background: transparent; color: var(--color-text-secondary);
      font: inherit; font-size: .80rem; cursor: pointer;
    }
    .ovc-subitem:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

    /* Favorite expanded panel */
    .ovc-favpanel { padding: .3rem .9rem .6rem; }
    .ovc-layout-opts { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin-bottom: .7rem; }
    .ovc-layout-opt {
      display: grid; justify-items: center; gap: .4rem; padding: .5rem .3rem;
      border: 1.5px solid var(--color-border); border-radius: .5rem;
      background: var(--color-surface-2); color: var(--color-text-secondary);
      font: inherit; font-size: .76rem; font-weight: 600; cursor: pointer;
    }
    .ovc-layout-opt:hover { border-color: var(--color-border-strong); color: var(--color-text-primary); }
    .ovc-layout-opt--selected { border-color: var(--color-accent); color: var(--color-accent); background: var(--color-accent-soft); }
    .ovc-layout-preview {
      position: relative; display: block; width: 100%; height: 2rem;
      border-radius: .3rem; overflow: hidden;
      background: var(--color-surface-3);
    }
    .ovc-layout-preview i, .ovc-layout-preview b { position: absolute; background: var(--color-text-muted); opacity: .5; }
    .ovc-layout-preview--sidebar i { top: 0; bottom: 0; left: 0; width: 28%; opacity: .8; }
    .ovc-layout-preview--sidebar b { top: 0; right: 0; bottom: 0; left: 34%; }
    .ovc-layout-preview--top i { top: 0; left: 0; right: 0; height: 30%; opacity: .8; }
    .ovc-layout-preview--top b { top: 38%; left: 0; right: 0; bottom: 0; }
    .ovc-layout-opt--selected .ovc-layout-preview i,
    .ovc-layout-opt--selected .ovc-layout-preview b { background: var(--color-accent); opacity: .55; }
    .ovc-layout-opt--selected .ovc-layout-preview i { opacity: .9; }

    .ovc-sections-head {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: .4rem;
      font-size: .74rem; font-weight: 700; letter-spacing: .03em; text-transform: uppercase;
      color: var(--color-text-muted);
    }
    .ovc-addsection {
      display: grid; place-items: center;
      width: 1.4rem; height: 1.4rem;
      border: 0; border-radius: .3rem;
      background: transparent; color: var(--color-text-muted); cursor: pointer;
    }
    .ovc-addsection:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
    .ovc-fav-item {
      display: flex; align-items: center; gap: .5rem;
      min-height: 1.9rem; padding: 0 .5rem;
      border-radius: .35rem;
      color: var(--color-text-secondary); font-size: .83rem;
    }
    .ovc-fav-item:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

    @media (max-width: 600px) {
      .ovt-refresh, .ovt-customize { display: none; }
      .ovt-bar { padding: .6rem; }
    }
  `],
})
export class OverviewToolbarComponent {
  @Output() addCard = new EventEmitter<void>();

  private readonly notifications = inject(NotificationService);

  readonly ListFilter = ListFilter;
  readonly RefreshCw = RefreshCw;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;
  readonly ChevronRight = ChevronRight;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly X = X;
  readonly Link2 = Link2;
  readonly Star = Star;

  isRefreshing = false;
  refreshLabel = '18 mins ago';

  filtersOpen = signal(false);
  filterRows = signal<FilterRow[]>([{ id: 1, value: '', dropdownOpen: false, search: '' }]);
  private nextId = 2;

  // ── Customize view panel ──
  customizeOpen = signal(false);
  autoLayout = signal(true);
  autoRefresh = signal(true);
  protectView = signal(false);
  defaultView = signal(false);
  exportOpen = signal(false);
  favoriteOpen = signal(false);
  favLayout = signal<'sidebar' | 'top'>('sidebar');

  custFilterOpen = signal(false);
  custFilterRow = signal<FilterRow>({ id: 0, value: '', dropdownOpen: false, search: '' });
  custFilterSearch = '';

  toggleFilters(e: Event) {
    e.stopPropagation();
    this.filtersOpen.update(v => !v);
    if (!this.filtersOpen()) this.closeAllDropdowns();
  }

  toggleCustomize(e: Event) {
    e.stopPropagation();
    this.filtersOpen.set(false);
    this.customizeOpen.update(v => !v);
    if (!this.customizeOpen()) this.closeCustomizeSubpanels();
  }

  onHostClick() {
    if (this.filtersOpen()) {
      this.filtersOpen.set(false);
      this.closeAllDropdowns();
    }
    if (this.customizeOpen()) {
      this.customizeOpen.set(false);
      this.closeCustomizeSubpanels();
    }
  }

  toggleCustFilter(e: Event) {
    e.stopPropagation();
    this.custFilterOpen.update(v => !v);
    if (!this.custFilterOpen()) {
      this.custFilterRow.update(r => ({ ...r, dropdownOpen: false }));
    }
  }

  toggleCustDropdown(e: Event) {
    e.stopPropagation();
    this.custFilterRow.update(r => ({ ...r, dropdownOpen: !r.dropdownOpen }));
  }

  pickCustFilterOption(opt: string) {
    this.custFilterRow.update(r => ({ ...r, value: opt, dropdownOpen: false, search: '' }));
    this.custFilterSearch = '';
  }

  clearCustFilter() {
    this.custFilterRow.update(r => ({ ...r, value: '', search: '' }));
    this.custFilterSearch = '';
  }

  getCustFilterOptions(): string[] {
    const q = this.custFilterSearch.toLowerCase();
    return q ? FILTER_OPTIONS.filter(o => o.toLowerCase().includes(q)) : FILTER_OPTIONS;
  }

  exportView(kind: 'csv' | 'pdf') {
    this.notifications.success(`Exporting view as ${kind.toUpperCase()}...`);
    this.exportOpen.set(false);
  }

  copyLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    this.notifications.success('Link copied to clipboard');
  }

  deleteView() {
    this.notifications.warning('This view will be deleted');
    this.customizeOpen.set(false);
    this.closeCustomizeSubpanels();
  }

  private closeCustomizeSubpanels() {
    this.custFilterOpen.set(false);
    this.custFilterRow.set({ id: 0, value: '', dropdownOpen: false, search: '' });
    this.custFilterSearch = '';
    this.exportOpen.set(false);
    this.favoriteOpen.set(false);
  }

  addRow() {
    this.filterRows.update(rows => [...rows, { id: this.nextId++, value: '', dropdownOpen: false, search: '' }]);
  }

  removeRow(id: number) {
    this.filterRows.update(rows => rows.filter(r => r.id !== id));
    if (this.filterRows().length === 0) this.addRow();
  }

  toggleDropdown(row: FilterRow, e: Event) {
    e.stopPropagation();
    this.filterRows.update(rows =>
      rows.map(r => ({ ...r, dropdownOpen: r.id === row.id ? !r.dropdownOpen : false }))
    );
  }

  pickOption(row: FilterRow, opt: string) {
    this.filterRows.update(rows =>
      rows.map(r => r.id === row.id ? { ...r, value: opt, dropdownOpen: false, search: '' } : r)
    );
  }

  clearRow(row: FilterRow) {
    this.filterRows.update(rows =>
      rows.map(r => r.id === row.id ? { ...r, value: '', search: '' } : r)
    );
  }

  triggerUpdate() { this.filterRows.update(rows => [...rows]); }

  getOptions(row: FilterRow): string[] {
    const q = row.search.toLowerCase();
    return q ? FILTER_OPTIONS.filter(o => o.toLowerCase().includes(q)) : FILTER_OPTIONS;
  }

  private closeAllDropdowns() {
    this.filterRows.update(rows => rows.map(r => ({ ...r, dropdownOpen: false })));
  }
}
