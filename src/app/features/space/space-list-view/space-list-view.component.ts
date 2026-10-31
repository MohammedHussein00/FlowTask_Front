import { Component, signal, computed, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { SpaceContextService } from '../space-context.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Filter, CircleOff, UserCircle, Search,
  Settings2, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Folder, List, FileText,
  Circle, Diamond, ClipboardList, FileSignature, LayoutTemplate,
  X, Trash2, Link2, Star, Check, Calendar, Flag, MessageSquare, Hash,
  GitBranch, Clock, CheckCircle2, GitPullRequest, TrendingUp, Rocket,
  CalendarClock, CircleDot, Tag, Shapes, Timer, Palette, Heart, AlignLeft,
  Paperclip, MoreHorizontal, Pencil, CircleChevronUp, EyeOff, CheckCheck, ChevronsUp, Bot,
} from 'lucide-angular';
import { NotificationService } from '../../../core/errors/notification.service';

const FILTER_OPTIONS = [
  'Status', 'Tags', 'Due date', 'Priority', 'Assignee', 'Archived',
  'Assigned comment', 'Created by', 'Date closed', 'Date created',
  'Date done', 'Date updated', 'Dependency', 'Sprint', 'Time estimated',
];

interface ListFilterRow {
  id: number;
  value: string;
  dropdownOpen: boolean;
  search: string;
}

interface FieldDef {
  id: string;
  label: string;
  icon?: any;
  iconText?: string;
  color?: string;
  locked?: boolean;
  on: boolean;
}

const FIELD_DEFS: FieldDef[] = [
  { id: 'taskName', label: 'Task Name', iconText: 'Aa', locked: true, on: true },
  { id: 'assignee', label: 'Assignee', icon: UserCircle, on: true },
  { id: 'dueDate', label: 'Due date', icon: Calendar, on: true },
  { id: 'priority', label: 'Priority', icon: Flag, on: true },
  { id: 'assignedComments', label: 'Assigned Comments', icon: UserCircle, on: false },
  { id: 'comments', label: 'Comments', icon: MessageSquare, on: false },
  { id: 'createdBy', label: 'Created by', icon: UserCircle, on: false },
  { id: 'customTaskId', label: 'Custom Task ID', icon: Hash, on: false },
  { id: 'dateClosed', label: 'Date closed', icon: Calendar, on: false },
  { id: 'dateCreated', label: 'Date created', icon: Calendar, on: false },
  { id: 'dateDone', label: 'Date done', icon: Calendar, on: false },
  { id: 'dateUpdated', label: 'Date updated', icon: Calendar, on: false },
  { id: 'dependencies', label: 'Dependencies', icon: GitBranch, on: false },
  { id: 'duration', label: 'Duration', icon: Clock, on: false, locked: true },
  { id: 'latestComment', label: 'Latest comment', icon: MessageSquare, on: false },
  { id: 'linkedDocs', label: 'Linked Docs', icon: FileText, on: false },
  { id: 'linkedTasks', label: 'Linked tasks', icon: CheckCircle2, on: false },
  { id: 'lists', label: 'Lists', icon: List, on: false },
  { id: 'pullRequests', label: 'Pull Requests', icon: GitPullRequest, on: false },
  { id: 'sprintPoints', label: 'Sprint points', icon: TrendingUp, on: false },
  { id: 'sprints', label: 'Sprints', icon: Rocket, on: false },
  { id: 'startDate', label: 'Start date', icon: CalendarClock, on: false },
  { id: 'status', label: 'Status', icon: CircleDot, on: false },
  { id: 'tags', label: 'Tags', icon: Tag, on: false },
  { id: 'taskId', label: 'Task ID', icon: Hash, on: false },
  { id: 'taskType', label: 'Task Type', icon: Shapes, on: false },
  { id: 'timeEstimate', label: 'Time estimate', icon: Timer, on: false },
  { id: 'timeTracked', label: 'Time tracked', icon: Clock, on: false },
  { id: 'timeline', label: 'Timeline', icon: Calendar, on: false },
];

const CUSTOM_FIELD_DEFS: FieldDef[] = [
  { id: 'category', label: 'Category', icon: Palette, color: '#2fbf71', on: false },
  { id: 'likes', label: 'Likes', icon: Heart, color: '#e0447e', on: false },
  { id: 'summary', label: 'Summary', icon: AlignLeft, color: '#2f8fe0', on: false },
];

const PROPERTIES_TOTAL = 25;
const CUSTOM_FIELDS_TOTAL = 3;

interface TaskType {
  id: string;
  label: string;
  icon: any;
}

const TASK_TYPES: TaskType[] = [
  { id: 'task',          label: 'Task',             icon: Circle },
  { id: 'milestone',     label: 'Milestone',        icon: Diamond },
  { id: 'form-response', label: 'Form Response',    icon: ClipboardList },
  { id: 'meeting-note',  label: 'Meeting Note',     icon: FileSignature },
  { id: 'create-type',   label: 'Create Task Type', icon: Plus },
];

const MANAGE_ITEMS: TaskType[] = [
  { id: 'apply-template', label: 'Apply a template', icon: LayoutTemplate },
];

interface Assignee {
  id: number;
  name: string;
  initial: string;
  color: string;
}

const ME: Assignee = { id: 1, name: 'Me', initial: 'M', color: '#5b9bd5' };

interface ListTask {
  id: number;
  name: string;
  typeId: string;
  assignees: Assignee[];
  dueDate: Date | null;
}

/** Quick-pick options shown at the top of the due-date popover. */
function quickDateOptions(from: Date): { label: string; day: string; date: Date }[] {
  const dow = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const addDays = (n: number) => { const d = new Date(from); d.setDate(d.getDate() + n); return d; };
  const nextWeekday = (target: number) => {
    const d = new Date(from);
    const diff = (target + 7 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d;
  };
  const fmt = (d: Date) => `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
  const today = from;
  const tomorrow = addDays(1);
  const weekend = nextWeekday(6);
  const nextWeek = nextWeekday(1);
  const nextWeekend = new Date(weekend); nextWeekend.setDate(weekend.getDate() + 7);
  const twoWeeks = addDays(14);
  const fourWeeks = addDays(28);
  return [
    { label: 'Today', day: dow[today.getDay()], date: today },
    { label: 'Tomorrow', day: dow[tomorrow.getDay()], date: tomorrow },
    { label: 'This weekend', day: dow[weekend.getDay()], date: weekend },
    { label: 'Next week', day: dow[nextWeek.getDay()], date: nextWeek },
    { label: 'Next weekend', day: fmt(nextWeekend), date: nextWeekend },
    { label: '2 weeks', day: fmt(twoWeeks), date: twoWeeks },
    { label: '4 weeks', day: fmt(fourWeeks), date: fourWeeks },
  ];
}

@Component({
  selector: 'app-space-list-view',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="slv-host">

      <!-- ── List toolbar ── -->
      <div class="slv-toolbar-wrap" (click)="onWrapClick()">
      <div class="slv-toolbar">
        <!-- Left pills -->
        <div class="slv-toolbar__left">
          @if (viewDirty()) {
            <div class="slv-saveview-wrap">
              <button class="slv-saveview" type="button" (click)="saveView($event)">Save view</button>
              <button class="slv-saveview-caret" type="button" (click)="toggleSaveMenu($event)">
                <lucide-icon [img]="ChevronDown" size="12" />
              </button>
              @if (saveMenuOpen()) {
                <div class="slv-saveview-menu" (click)="$event.stopPropagation()">
                  <button type="button" (click)="saveView($event)">Save view</button>
                  <button type="button" (click)="resetView($event)">Reset changes</button>
                </div>
              }
            </div>
          }
          <button class="slv-pill slv-pill--accent" type="button" (click)="openGroupPanel($event)">
            <lucide-icon [img]="Settings2" size="13" />
            Group: {{ groupField() }}
            <lucide-icon [img]="ChevronDown" size="12" />
          </button>
          <button class="slv-pill" type="button" (click)="openSubtasksPanel($event)">
            <lucide-icon [img]="ChevronDown" size="12" />
            Subtasks
          </button>
        </div>

        <!-- Right actions -->
        <div class="slv-toolbar__right">
          <button class="slv-action" type="button" [class.slv-action--active]="filterBarOpen()" (click)="toggleFilterBar($event)">
            <lucide-icon [img]="Filter" size="13" />Filter
          </button>
          <button class="slv-action" type="button" [class.slv-action--active]="showClosedTasks()" (click)="toggleClosed($event)">
            <lucide-icon [img]="CircleOff" size="13" />Closed
          </button>
          <button class="slv-action" type="button">
            <lucide-icon [img]="UserCircle" size="13" />Assignee
          </button>
          <div class="slv-action-divider"></div>
          <button class="slv-action slv-action--icon" type="button" aria-label="Search">
            <lucide-icon [img]="Search" size="14" />
          </button>
          <button class="slv-action" type="button" (click)="toggleCustomize($event)">
            <lucide-icon [img]="Settings2" size="13" />Customize
          </button>
          <div class="slv-add-task-wrap" style="position:relative">
            <button class="slv-add-task" type="button" (click)="openInlineAdd()">
              Add Task
            </button>
            <button class="slv-add-task slv-add-task--caret" type="button"
              (click)="toggleTypeDropdown($event)">
              <lucide-icon [img]="ChevronDown" size="13" />
            </button>

            <!-- Task type dropdown -->
            @if (typeDropdownOpen()) {
              <div class="slv-type-dropdown" (click)="$event.stopPropagation()">

                <!-- Tabs -->
                <div class="slv-tdd-tabs">
                  <button class="slv-tdd-tab"
                    [class.slv-tdd-tab--active]="typeTab() === 'create'"
                    type="button" (click)="typeTab.set('create')">Create</button>
                  <button class="slv-tdd-tab"
                    [class.slv-tdd-tab--active]="typeTab() === 'manage'"
                    type="button" (click)="typeTab.set('manage')">Manage</button>
                </div>

                <!-- Search -->
                <div class="slv-tdd-search-wrap">
                  <input
                    class="slv-tdd-search"
                    type="text"
                    placeholder="Find type (e.g. Milestone)"
                    [(ngModel)]="typeSearch" />
                </div>

                <!-- Type list -->
                <ul class="slv-tdd-list">
                  @if (typeTab() === 'create') {
                    @for (t of filteredTypes(); track t.id) {
                      <li class="slv-tdd-item"
                        [class.slv-tdd-item--create]="t.id === 'create-type'"
                        (click)="selectType(t)">
                        <lucide-icon [img]="t.icon" size="15" class="slv-tdd-item__icon" />
                        {{ t.label }}
                      </li>
                    }
                  } @else {
                    @for (t of MANAGE_ITEMS; track t.id) {
                      <li class="slv-tdd-item" (click)="selectType(t)">
                        <lucide-icon [img]="t.icon" size="15" class="slv-tdd-item__icon" />
                        {{ t.label }}
                      </li>
                    }
                  }
                </ul>

                <!-- Pinned footer: always visible regardless of active tab -->
                @if (typeTab() === 'create') {
                  <ul class="slv-tdd-list slv-tdd-list--footer">
                    <li class="slv-tdd-item" (click)="selectType(MANAGE_ITEMS[0])">
                      <lucide-icon [img]="MANAGE_ITEMS[0].icon" size="15" class="slv-tdd-item__icon" />
                      {{ MANAGE_ITEMS[0].label }}
                    </li>
                  </ul>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- ── Filter bar ── -->
      @if (filterBarOpen()) {
        <div class="slv-filterbar" (click)="$event.stopPropagation()">
          <div class="slv-filterbar__head">
            <h3>List Filters</h3>
            <button class="slv-savedfilters" type="button">
              Saved filters <lucide-icon [img]="ChevronDown" size="12" />
            </button>
          </div>

          @for (row of filterRows(); track row.id; let first = $first) {
            <div class="slv-frow">
              @if (!first) {
                <button class="slv-logic" type="button">AND <lucide-icon [img]="ChevronDown" size="12" /></button>
              }
              <div class="slv-frow__wrap">
                <button class="slv-fselect" type="button"
                  [class.slv-fselect--open]="row.dropdownOpen"
                  (click)="toggleFilterDropdown(row, $event)">
                  <span>{{ row.value || 'Select filter' }}</span>
                  <lucide-icon [img]="ChevronDown" size="13" />
                </button>
                <button class="slv-fdel" type="button" (click)="removeFilterRow(row.id)" aria-label="Remove">
                  <lucide-icon [img]="Trash2" size="13" />
                </button>
                @if (row.dropdownOpen) {
                  <div class="slv-fdropdown" (click)="$event.stopPropagation()">
                    <input class="slv-fsearch" type="text" placeholder="Search..."
                      [(ngModel)]="row.search" autofocus />
                    <ul class="slv-flist">
                      @for (opt of getFilterOptions(row); track opt) {
                        <li class="slv-fopt"
                          [class.slv-fopt--active]="row.value === opt"
                          (click)="pickFilterOption(row, opt)">{{ opt }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>
              <button class="slv-nested" type="button">Add nested filter</button>
            </div>
          }

          <button class="slv-addfilterrow" type="button" (click)="addFilterRow()">
            <lucide-icon [img]="Plus" size="13" /> Add filter
          </button>
        </div>
      }

      <!-- ── Customize view drawer ── -->
      @if (customizeOpen()) {
        <div class="slv-cz" (click)="$event.stopPropagation()">

          @if (activePanel() === 'main') {
            <header class="slv-cz__header">
              <h3>Customize view</h3>
              <button class="slv-cz-close" type="button" aria-label="Close" (click)="closeCustomize()">
                <lucide-icon [img]="X" size="16" />
              </button>
            </header>

            <div class="slv-cz-viewname">
              <span class="slv-cz-viewname__icon"><lucide-icon [img]="List" size="14" /></span>
              <input class="slv-cz-viewname__input" type="text" [(ngModel)]="viewName" />
            </div>

            <div class="slv-cz-body">
              <button class="cz-row" type="button" (click)="toggleFlag('showEmptyStatuses')">
                <span>Show empty statuses</span>
                <span class="cz-toggle" [class.cz-toggle--on]="showEmptyStatuses()"><i></i></span>
              </button>
              <button class="cz-row" type="button" (click)="toggleFlag('wrapText')">
                <span>Wrap text</span>
                <span class="cz-toggle" [class.cz-toggle--on]="wrapText()"><i></i></span>
              </button>
              <button class="cz-row" type="button" (click)="toggleFlag('showTaskLocations')">
                <span>Show task locations</span>
                <span class="cz-toggle" [class.cz-toggle--on]="showTaskLocations()"><i></i></span>
              </button>
              <button class="cz-row" type="button" (click)="toggleFlag('showSubtaskParentNames')">
                <span>Show subtask parent names</span>
                <span class="cz-toggle" [class.cz-toggle--on]="showSubtaskParentNames()"><i></i></span>
              </button>
              <button class="cz-row" type="button" (click)="toggleClosed($event)">
                <span>Show closed tasks</span>
                <span class="cz-toggle" [class.cz-toggle--on]="showClosedTasks()"><i></i></span>
              </button>
              <button class="cz-row" type="button">
                <span>More options</span>
                <lucide-icon [img]="ChevronRight" size="14" class="cz-chevron" />
              </button>

              <div class="cz-divider"></div>

              <!-- Fields -->
              <button class="cz-row" type="button" (click)="openFields()">
                <span>Fields</span>
                <span class="cz-row__val">{{ fieldsShownCount() }} shown <lucide-icon [img]="ChevronRight" size="14" class="cz-chevron" /></span>
              </button>

              <!-- Filter -->
              <button class="cz-row" type="button" (click)="toggleFilterBar($event)">
                <span>Filter</span>
                <span class="cz-row__val">{{ filterSummary() }} <lucide-icon [img]="filterBarOpen() ? ChevronUp : ChevronRight" size="14" class="cz-chevron" [class.cz-chevron--open]="filterBarOpen()" /></span>
              </button>

              <!-- Group -->
              <button class="cz-row" type="button" (click)="groupOpen.update(v => !v)">
                <span>Group</span>
                <span class="cz-row__val">{{ groupField() }} <lucide-icon [img]="ChevronRight" size="14" class="cz-chevron" [class.cz-chevron--open]="groupOpen()" /></span>
              </button>
              @if (groupOpen()) {
                <div class="cz-inline">
                  <div class="cz-group-row">
                    <div class="cz-group-select">
                      <lucide-icon [img]="CircleDot" size="13" />
                      <select [(ngModel)]="groupFieldSelect" (ngModelChange)="onGroupFieldChange($event)">
                        <option>Status</option>
                        <option>Assignee</option>
                        <option>Priority</option>
                        <option>Due date</option>
                        <option>Tags</option>
                      </select>
                      <lucide-icon [img]="ChevronDown" size="12" />
                    </div>
                    <div class="cz-group-select cz-group-select--order">
                      <select [(ngModel)]="groupOrder" (ngModelChange)="markDirty()">
                        <option>Ascending</option>
                        <option>Descending</option>
                      </select>
                      <lucide-icon [img]="ChevronDown" size="12" />
                    </div>
                    <button class="cz-group-del" type="button" aria-label="Remove group">
                      <lucide-icon [img]="Trash2" size="13" />
                    </button>
                  </div>
                  <button class="cz-row cz-row--nested" type="button" (click)="toggleFlag('alsoGroupByList')">
                    <span>Also group by List</span>
                    <span class="cz-toggle" [class.cz-toggle--on]="alsoGroupByList()"><i></i></span>
                  </button>
                </div>
              }

              <!-- Subtasks -->
              <button class="cz-row" type="button" (click)="subtasksOpen.update(v => !v)">
                <span>Subtasks</span>
                <span class="cz-row__val">{{ subtasksMode() }} <lucide-icon [img]="ChevronRight" size="14" class="cz-chevron" [class.cz-chevron--open]="subtasksOpen()" /></span>
              </button>
              @if (subtasksOpen()) {
                <div class="cz-flyout" (click)="$event.stopPropagation()">
                  <div class="cz-flyout__label">Show subtasks</div>
                  @for (opt of subtaskOptions; track opt.id) {
                    <button class="cz-flyout__item" type="button" (click)="pickSubtaskMode(opt.id)">
                      <span class="cz-flyout__body">
                        <strong>{{ opt.label }}{{ opt.id === 'collapsed' ? ' (default)' : '' }}</strong>
                        @if (opt.hint) { <small>{{ opt.hint }}</small> }
                      </span>
                      @if (subtasksMode() === opt.label) {
                        <lucide-icon [img]="Check" size="14" />
                      }
                    </button>
                  }
                </div>
              }

              <!-- Templates -->
              <button class="cz-row" type="button" (click)="templatesOpen.update(v => !v)">
                <span>Templates</span>
                <lucide-icon [img]="ChevronRight" size="14" class="cz-chevron" [class.cz-chevron--open]="templatesOpen()" />
              </button>
              @if (templatesOpen()) {
                <div class="cz-flyout" (click)="$event.stopPropagation()">
                  <div class="cz-flyout__label">Templates</div>
                  <button class="cz-flyout__item cz-flyout__item--action" type="button" (click)="applyTemplate()">
                    <lucide-icon [img]="LayoutTemplate" size="14" /> Apply a template
                  </button>
                  <button class="cz-flyout__item cz-flyout__item--action" type="button" (click)="saveAsTemplate()">
                    <lucide-icon [img]="LayoutTemplate" size="14" /> Save as template
                  </button>
                  <button class="cz-flyout__item cz-flyout__item--action" type="button" (click)="updateTemplate()">
                    <lucide-icon [img]="LayoutTemplate" size="14" /> Update existing template
                  </button>
                </div>
              }

              <div class="cz-divider"></div>

              <button class="cz-row" type="button" (click)="toggleFlag('autosaveForMe')">
                <span>Autosave for me</span>
                <span class="cz-toggle" [class.cz-toggle--on]="autosaveForMe()"><i></i></span>
              </button>
              <button class="cz-row" type="button" (click)="toggleFlag('pinView')">
                <span>Pin view</span>
                <span class="cz-toggle" [class.cz-toggle--on]="pinView()"><i></i></span>
              </button>
              <button class="cz-row" type="button" (click)="toggleFlag('privateView')">
                <span>Private view</span>
                <span class="cz-toggle" [class.cz-toggle--on]="privateView()"><i></i></span>
              </button>
              <button class="cz-row" type="button" (click)="toggleFlag('protectView')">
                <span>Protect view</span>
                <span class="cz-toggle" [class.cz-toggle--on]="protectView()"><i></i></span>
              </button>
              <button class="cz-row" type="button" (click)="toggleFlag('defaultView')">
                <span>Set as default view</span>
                <span class="cz-toggle" [class.cz-toggle--on]="defaultView()"><i></i></span>
              </button>

              <button class="cz-row" type="button" (click)="copyLink()">
                <span class="cz-row__icontext"><lucide-icon [img]="Link2" size="14" /> Copy link to view</span>
              </button>

              <!-- Favorite -->
              <button class="cz-row" type="button" (click)="favoriteOpen.update(v => !v)">
                <span>Favorite</span>
                <lucide-icon [img]="ChevronRight" size="14" class="cz-chevron" [class.cz-chevron--open]="favoriteOpen()" />
              </button>
              @if (favoriteOpen()) {
                <div class="cz-favpanel">
                  <div class="cz-layout-opts">
                    <button class="cz-layout-opt" type="button"
                      [class.cz-layout-opt--selected]="favLayout() === 'sidebar'"
                      (click)="favLayout.set('sidebar')">
                      <span class="cz-layout-preview cz-layout-preview--sidebar"><i></i><b></b></span>
                      Sidebar
                    </button>
                    <button class="cz-layout-opt" type="button"
                      [class.cz-layout-opt--selected]="favLayout() === 'top'"
                      (click)="favLayout.set('top')">
                      <span class="cz-layout-preview cz-layout-preview--top"><i></i><b></b></span>
                      Top
                    </button>
                  </div>
                  <div class="cz-sections-head">
                    <span>Sections</span>
                    <button class="cz-addsection" type="button" aria-label="Add section">
                      <lucide-icon [img]="Plus" size="13" />
                    </button>
                  </div>
                  <div class="cz-fav-item">
                    <lucide-icon [img]="Star" size="13" /> Favorites
                  </div>
                </div>
              }

              <!-- Export -->
              <button class="cz-row" type="button" (click)="exportOpen.update(v => !v)">
                <span>Export view</span>
                <lucide-icon [img]="ChevronRight" size="14" class="cz-chevron" [class.cz-chevron--open]="exportOpen()" />
              </button>
              @if (exportOpen()) {
                <div class="cz-exportpanel" (click)="$event.stopPropagation()">
                  <div class="cz-export-field">
                    <label>File format <span class="cz-info">ⓘ</span></label>
                    <div class="cz-export-toggle2">
                      <button type="button" [class.selected]="exportFormat() === 'csv'" (click)="exportFormat.set('csv')">
                        <lucide-icon [img]="FileText" size="13" /> CSV
                      </button>
                      <button type="button" [class.selected]="exportFormat() === 'excel'" (click)="exportFormat.set('excel')">
                        <lucide-icon [img]="FileText" size="13" /> Excel
                      </button>
                    </div>
                  </div>

                  <div class="cz-export-field">
                    <label>What to export <span class="cz-info">ⓘ</span></label>
                    <label class="cz-radio">
                      <input type="radio" name="exportwhat" [checked]="exportWhat() === 'visible'" (change)="exportWhat.set('visible')" />
                      Visible columns
                    </label>
                    <label class="cz-radio">
                      <input type="radio" name="exportwhat" [checked]="exportWhat() === 'names'" (change)="exportWhat.set('names')" />
                      Task Names only
                    </label>
                    <label class="cz-radio">
                      <input type="radio" name="exportwhat" [checked]="exportWhat() === 'all'" (change)="exportWhat.set('all')" />
                      All columns
                    </label>
                  </div>

                  <div class="cz-export-field">
                    <label>Date format <span class="cz-info">ⓘ</span></label>
                    <div class="cz-export-select">
                      <select [(ngModel)]="exportDateFormat">
                        <option>Normal</option>
                        <option>ISO 8601</option>
                        <option>US (MM/DD/YYYY)</option>
                      </select>
                      <lucide-icon [img]="ChevronDown" size="12" />
                    </div>
                  </div>

                  <div class="cz-export-field">
                    <label>Time format <span class="cz-info">ⓘ</span></label>
                    <div class="cz-export-select">
                      <select [(ngModel)]="exportTimeFormat">
                        <option>Normal</option>
                        <option>24 hour</option>
                      </select>
                      <lucide-icon [img]="ChevronDown" size="12" />
                    </div>
                  </div>

                  <button class="cz-export-download" type="button" (click)="downloadExport()">
                    ↓ Download
                  </button>
                  <p class="cz-export-hint">Business feature</p>
                </div>
              }

              <button class="cz-row" type="button" (click)="openSharing()">
                <span class="cz-row__icontext">Sharing &amp; Permissions</span>
                <lucide-icon [img]="ChevronRight" size="14" class="cz-chevron" />
              </button>
            </div>
          }

          @if (activePanel() === 'fields') {
            <header class="slv-cz__header slv-cz__header--fields">
              <button class="slv-cz-back" type="button" aria-label="Back" (click)="activePanel.set('main')">
                <lucide-icon [img]="ChevronLeft" size="16" />
              </button>
              <h3>Fields</h3>
              <span class="slv-cz-header__spacer"></span>
              <button class="slv-cz-close" type="button" aria-label="Field settings" (click)="notifications.info('Field settings')">
                <lucide-icon [img]="Settings2" size="15" />
              </button>
              <button class="slv-cz-close" type="button" aria-label="Close" (click)="closeCustomize()">
                <lucide-icon [img]="X" size="16" />
              </button>
            </header>

            <div class="cz-fields-search">
              <input type="text" placeholder="Search Task Fields" [(ngModel)]="fieldsSearch" />
            </div>

            <div class="cz-fields-tabs">
              <button type="button" [class.cz-fields-tab--active]="fieldsTab() === 'create'" (click)="fieldsTab.set('create')">Create new</button>
              <button type="button" [class.cz-fields-tab--active]="fieldsTab() === 'existing'" (click)="fieldsTab.set('existing')">Add existing</button>
            </div>

            <div class="cz-fields-body">
              @if (fieldsTab() === 'create') {
                <div class="cz-fields-create">
                  <input type="text" placeholder="Field name" [(ngModel)]="newFieldName" class="cz-fields-create__name" />
                  <select [(ngModel)]="newFieldType" class="cz-fields-create__type">
                    <option>Text</option>
                    <option>Number</option>
                    <option>Dropdown</option>
                    <option>Date</option>
                    <option>Checkbox</option>
                  </select>
                  <button type="button" class="cz-fields-create__btn" (click)="createField()">Create field</button>
                </div>
              } @else {
                <div class="cz-fields-group">
                  <button class="cz-fields-group__head" type="button" (click)="shownSectionOpen.update(v => !v)">
                    Shown <lucide-icon [img]="shownSectionOpen() ? ChevronUp : ChevronDown" size="12" />
                    <span class="cz-fields-group__count">{{ shownFields().length }}</span>
                  </button>
                  @if (shownSectionOpen()) {
                    @for (f of shownFields(); track f.id) {
                      <div class="cz-field-row" [class.cz-field-row--locked]="f.locked">
                        <span class="cz-field-row__icon">
                          @if (f.iconText) { <b>{{ f.iconText }}</b> } @else { <lucide-icon [img]="f.icon" size="15" [style.color]="f.color" /> }
                        </span>
                        <span class="cz-field-row__label">{{ f.label }}</span>
                        <span class="cz-toggle" [class.cz-toggle--on]="f.on" [class.cz-toggle--disabled]="f.locked" (click)="toggleField(f)"><i></i></span>
                      </div>
                    }
                  }
                </div>

                <div class="cz-fields-group">
                  <button class="cz-fields-group__head" type="button" (click)="propertiesSectionOpen.update(v => !v)">
                    Properties <lucide-icon [img]="propertiesSectionOpen() ? ChevronUp : ChevronDown" size="12" />
                    <span class="cz-fields-group__count">{{ PROPERTIES_TOTAL }}</span>
                  </button>
                  @if (propertiesSectionOpen()) {
                    @for (f of hiddenFields(); track f.id) {
                      <div class="cz-field-row" [class.cz-field-row--locked]="f.locked">
                        <span class="cz-field-row__icon">
                          <lucide-icon [img]="f.icon" size="15" />
                        </span>
                        <span class="cz-field-row__label">{{ f.label }}</span>
                        <span class="cz-toggle" [class.cz-toggle--on]="f.on" [class.cz-toggle--disabled]="f.locked" (click)="toggleField(f)"><i></i></span>
                      </div>
                    }
                  }
                </div>

                <div class="cz-fields-group">
                  <button class="cz-fields-group__head" type="button" (click)="customSectionOpen.update(v => !v)">
                    Custom Fields in Workspace <lucide-icon [img]="customSectionOpen() ? ChevronUp : ChevronDown" size="12" />
                    <span class="cz-fields-group__count">{{ CUSTOM_FIELDS_TOTAL }}</span>
                  </button>
                  @if (customSectionOpen()) {
                    @for (f of customFields(); track f.id) {
                      <div class="cz-field-row">
                        <span class="cz-field-row__icon">
                          <lucide-icon [img]="f.icon" size="15" [style.color]="f.color" />
                        </span>
                        <span class="cz-field-row__label">{{ f.label }}</span>
                        <span class="cz-toggle" [class.cz-toggle--on]="f.on" (click)="toggleField(f)"><i></i></span>
                      </div>
                    }
                  }
                </div>
              }
            </div>
          }
        </div>
      }
      </div>

      <!-- ── Status groups ── -->
      <div class="slv-groups">
        <div class="slv-card__head">
          <small>{{ ctx.spaceName() }}</small>
          <div class="slv-card__title"><b>List</b><lucide-icon [img]="MoreHorizontal" size="14" /></div>
        </div>
        <div class="slv-group" [class.slv-group--hidden]="groupHidden()">

          <!-- Group header -->
          <div class="slv-group__header">
            <button class="slv-group__chevron" type="button" (click)="groupCollapsed.update(v => !v)" aria-label="Collapse group">
              <lucide-icon [img]="groupCollapsed() ? ChevronRight : ChevronDown" size="13" />
            </button>
            <span class="slv-group__pill">
              <span class="slv-group__dot"></span>
              @if (groupRenaming()) {
                <input class="slv-group__rename" type="text" [value]="groupName()" (click)="$event.stopPropagation()"
                  (keydown.enter)="commitGroupRename($any($event.target).value)" (keydown.escape)="groupRenaming.set(false)"
                  (blur)="commitGroupRename($any($event.target).value)" />
              } @else {
                <span class="slv-group__title">{{ groupName() }}</span>
              }
            </span>
            <span class="slv-group__count">{{ tasks().length }}</span>
            <span class="slv-group__menu-wrap">
              <button class="slv-group__icon-btn" [class.slv-group__icon-btn--on]="groupMenuOpen()" type="button" aria-label="Group options" (click)="toggleGroupMenu($event)">
                <lucide-icon [img]="MoreHorizontal" size="14" />
              </button>
              @if (groupMenuOpen()) {
                <div class="slv-gmenu" role="menu" (click)="$event.stopPropagation()">
                  <p class="slv-gmenu__label">Group options</p>
                  <button class="slv-gmenu__item" type="button" role="menuitem" (click)="startGroupRename()"><lucide-icon [img]="Pencil" size="15" />Rename</button>
                  <button class="slv-gmenu__item" type="button" role="menuitem" (click)="groupMenuSoon('New status')"><lucide-icon [img]="Plus" size="15" />New status</button>
                  <button class="slv-gmenu__item" type="button" role="menuitem" (click)="groupMenuSoon('Edit statuses')"><lucide-icon [img]="Settings2" size="15" />Edit statuses</button>
                  <div class="slv-gmenu__sep"></div>
                  <button class="slv-gmenu__item" type="button" role="menuitem" (click)="collapseGroupFromMenu()"><lucide-icon [img]="CircleChevronUp" size="15" />{{ groupCollapsed() ? 'Expand group' : 'Collapse group' }}</button>
                  <button class="slv-gmenu__item" type="button" role="menuitem" (click)="hideGroupStatus()"><lucide-icon [img]="EyeOff" size="15" />Hide status</button>
                  <div class="slv-gmenu__sep"></div>
                  <button class="slv-gmenu__item" type="button" role="menuitem" (click)="groupMenuSoon('Select all')"><lucide-icon [img]="CheckCheck" size="15" />Select all</button>
                  <button class="slv-gmenu__item" type="button" role="menuitem" (click)="collapseAllGroups()"><lucide-icon [img]="ChevronsUp" size="15" />Collapse all groups</button>
                  <div class="slv-gmenu__sep"></div>
                  <button class="slv-gmenu__item" type="button" role="menuitem" (click)="groupMenuSoon('Automate status')"><lucide-icon [img]="Bot" size="15" />Automate status</button>
                </div>
              }
            </span>
            <button class="slv-group__icon-btn" type="button" aria-label="Add task" (click)="$event.stopPropagation(); openInlineAdd()">
              <lucide-icon [img]="Plus" size="14" />
            </button>
          </div>

          @if (!groupCollapsed()) {
            <!-- Column headers -->
            <div class="slv-cols">
              <span class="slv-cols__name">Name</span>
              <span class="slv-cols__assignee">Assignee</span>
              <span class="slv-cols__due">Due date</span>
              <span class="slv-cols__priority">Priority</span>
              <button class="slv-cols__add" type="button" aria-label="Add field" (click)="openFieldsPanel($event)">
                <lucide-icon [img]="Plus" size="14" />
              </button>
            </div>

            <!-- Task rows -->
            @for (task of tasks(); track task.id) {
              <div class="slv-row">
                <span class="slv-row__dot"></span>
                <span class="slv-row__name">{{ task.name }}</span>
                <span class="slv-row__assignees">
                  @for (a of task.assignees; track a.id) {
                    <span class="slv-avatar" [style.background]="a.color">{{ a.initial }}</span>
                  }
                </span>
                <span class="slv-row__due">{{ task.dueDate ? formatDate(task.dueDate) : '' }}</span>
                <span class="slv-row__priority"></span>
              </div>
            }

            <!-- Inline add-task row -->
            @if (inlineAddOpen()) {
              <div class="slv-inline-row" (click)="$event.stopPropagation()">
                <span class="slv-inline-row__dot">
                  <lucide-icon [img]="inlineType().icon" size="14" />
                </span>
                <input
                  #inlineNameInput
                  class="slv-inline-row__input"
                  type="text"
                  placeholder="Task Name or type '/' for commands"
                  [(ngModel)]="inlineTaskName"
                  (keydown.enter)="saveInlineTask()"
                  (keydown.escape)="closeInlineAdd()" />

                <div class="slv-inline-row__icons">
                  <!-- Type picker -->
                  <div class="slv-inline-icon-wrap">
                    <button class="slv-inline-icon" type="button" aria-label="Task type" (click)="toggleInlineTypeDropdown($event)">
                      <lucide-icon [img]="inlineType().icon" size="15" />
                    </button>
                    @if (inlineTypeOpen()) {
                      <div class="slv-type-dropdown slv-type-dropdown--row" (click)="$event.stopPropagation()">
                        <div class="slv-tdd-tabs">
                          <button class="slv-tdd-tab" [class.slv-tdd-tab--active]="inlineTypeTab() === 'create'" type="button" (click)="inlineTypeTab.set('create')">Create</button>
                          <button class="slv-tdd-tab" [class.slv-tdd-tab--active]="inlineTypeTab() === 'manage'" type="button" (click)="inlineTypeTab.set('manage')">Manage</button>
                        </div>
                        <div class="slv-tdd-search-wrap">
                          <input class="slv-tdd-search" type="text" placeholder="Find type (e.g. Milestone)" [(ngModel)]="inlineTypeSearch" />
                        </div>
                        <ul class="slv-tdd-list">
                          @if (inlineTypeTab() === 'create') {
                            @for (t of filteredInlineTypes(); track t.id) {
                              <li class="slv-tdd-item" [class.slv-tdd-item--create]="t.id === 'create-type'" (click)="selectInlineType(t)">
                                <lucide-icon [img]="t.icon" size="15" class="slv-tdd-item__icon" />{{ t.label }}
                              </li>
                            }
                          } @else {
                            @for (t of MANAGE_ITEMS; track t.id) {
                              <li class="slv-tdd-item" (click)="inlineTypeOpen.set(false)">
                                <lucide-icon [img]="t.icon" size="15" class="slv-tdd-item__icon" />{{ t.label }}
                              </li>
                            }
                          }
                        </ul>
                      </div>
                    }
                  </div>

                  <button class="slv-inline-icon" type="button" aria-label="Attach">
                    <lucide-icon [img]="Paperclip" size="15" />
                  </button>

                  <!-- Assignee picker -->
                  <div class="slv-inline-icon-wrap">
                    <button class="slv-inline-icon" type="button" aria-label="Assignee" (click)="toggleInlineAssigneeDropdown($event)">
                      @if (inlineAssignees().length) {
                        <span class="slv-avatar slv-avatar--sm" [style.background]="inlineAssignees()[0].color">{{ inlineAssignees()[0].initial }}</span>
                      } @else {
                        <lucide-icon [img]="UserCircle" size="15" />
                      }
                    </button>
                    @if (inlineAssigneeOpen()) {
                      <div class="slv-assignee-dropdown" (click)="$event.stopPropagation()">
                        <div class="slv-assignee-search-wrap">
                          <lucide-icon [img]="Search" size="13" class="slv-assignee-search-icon" />
                          <input class="slv-assignee-search" type="text" placeholder="Search or enter email..." [(ngModel)]="inlineAssigneeSearch" />
                        </div>
                        <div class="slv-assignee-section">
                          <span class="slv-assignee-section__label">People</span>
                          @for (p of filteredAssignees(); track p.id) {
                            <button class="slv-assignee-item" type="button" (click)="toggleInlineAssignee(p)">
                              <span class="slv-avatar slv-avatar--sm" [style.background]="p.color">{{ p.initial }}</span>
                              <span>{{ p.name }}</span>
                              @if (isInlineAssigned(p)) { <lucide-icon [img]="Check" size="14" class="slv-assignee-item__check" /> }
                            </button>
                          }
                        </div>
                        <div class="slv-assignee-section">
                          <span class="slv-assignee-section__label">Agents</span>
                          <button class="slv-assignee-item slv-assignee-item--create" type="button">
                            <lucide-icon [img]="Plus" size="14" />
                            <span>Create Agent</span>
                          </button>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Due date picker -->
                  <div class="slv-inline-icon-wrap">
                    <button class="slv-inline-icon" type="button" aria-label="Due date" (click)="toggleInlineDateDropdown($event)">
                      @if (inlineDueDate()) {
                        <span class="slv-inline-icon__date">{{ formatDate(inlineDueDate()!) }}</span>
                      } @else {
                        <lucide-icon [img]="Calendar" size="15" />
                      }
                    </button>
                    @if (inlineDateOpen()) {
                      <div class="slv-date-dropdown" (click)="$event.stopPropagation()">
                        <div class="slv-date-dropdown__fields">
                          <button class="slv-date-field" type="button">
                            <lucide-icon [img]="Calendar" size="13" />Start date
                          </button>
                          <button class="slv-date-field slv-date-field--active" type="button">
                            <lucide-icon [img]="Calendar" size="13" />
                            {{ inlineDueDate() ? formatDate(inlineDueDate()!) : 'Due date' }}
                          </button>
                        </div>
                        <div class="slv-date-dropdown__body">
                          <div class="slv-date-quick">
                            @for (opt of quickDateOptions(); track opt.label) {
                              <button class="slv-date-quick__item" type="button" (click)="pickInlineDate(opt.date)">
                                <span>{{ opt.label }}</span>
                                <span class="slv-date-quick__day">{{ opt.day }}</span>
                              </button>
                            }
                            <div class="slv-date-quick__divider"></div>
                            <button class="slv-date-quick__item" type="button">
                              <span>Set Recurring</span>
                              <lucide-icon [img]="ChevronRight" size="13" />
                            </button>
                          </div>
                          <div class="slv-date-cal">
                            <div class="slv-date-cal__head">
                              <span>{{ calendarMonthLabel() }}</span>
                              <span class="slv-date-cal__today" (click)="jumpToToday()">Today</span>
                              <button type="button" (click)="shiftCalendarMonth(-1)" aria-label="Previous month"><lucide-icon [img]="ChevronUp" size="14" /></button>
                              <button type="button" (click)="shiftCalendarMonth(1)" aria-label="Next month"><lucide-icon [img]="ChevronDown" size="14" /></button>
                            </div>
                            <div class="slv-date-cal__dow">
                              @for (d of ['Su','Mo','Tu','We','Th','Fr','Sa']; track d) { <span>{{ d }}</span> }
                            </div>
                            <div class="slv-date-cal__grid">
                              @for (cell of calendarCells(); track cell.key) {
                                <button type="button"
                                  class="slv-date-cal__cell"
                                  [class.slv-date-cal__cell--muted]="!cell.inMonth"
                                  [class.slv-date-cal__cell--today]="cell.isToday"
                                  [class.slv-date-cal__cell--selected]="cell.isSelected"
                                  (click)="pickInlineDate(cell.date)">
                                  {{ cell.date.getDate() }}
                                </button>
                              }
                            </div>
                          </div>
                        </div>
                        @if (showScheduleBanner()) {
                          <div class="slv-date-banner">
                            <span class="slv-date-banner__icon">🏖️</span>
                            <span class="slv-date-banner__text">
                              <b>Set up your work schedule</b>
                              Set working days/hours and holidays for your workspace.
                            </span>
                            <button type="button" aria-label="Dismiss" (click)="showScheduleBanner.set(false)"><lucide-icon [img]="X" size="13" /></button>
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <button class="slv-inline-icon" type="button" aria-label="Priority">
                    <lucide-icon [img]="Flag" size="15" />
                  </button>
                  <button class="slv-inline-icon" type="button" aria-label="Link">
                    <lucide-icon [img]="Link2" size="15" />
                  </button>
                </div>

                <button class="slv-inline-row__cancel" type="button" (click)="closeInlineAdd()">Cancel</button>
                <button class="slv-inline-row__save" type="button" [disabled]="!inlineTaskName().trim()" (click)="saveInlineTask()">Save</button>
              </div>
            } @else {
              <button class="slv-add-row" type="button" (click)="openInlineAdd()">
                <span class="slv-add-row__dot"></span>Add Task
              </button>
            }
          }
        </div>
        @if (groupHidden()) {
          <div class="slv-hidden-row">
            <lucide-icon [img]="EyeOff" size="14" />
            <span>1 hidden status: {{ groupName() }}</span>
            <button type="button" (click)="groupHidden.set(false)">Show</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; background: var(--color-canvas); }

    .slv-host {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      color: var(--color-text-primary);
    }

    /* ── Toolbar ── */
    .slv-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 3rem;
      padding: 0 .75rem;
      border-bottom: 1px solid var(--color-border);
      gap: .5rem;
      flex: none;
    }
    .slv-toolbar__left { display: flex; align-items: center; gap: .35rem; }
    .slv-toolbar__right { display: flex; align-items: center; gap: .2rem; }

    /* Pills (left) */
    .slv-pill {
      display: inline-flex;
      align-items: center;
      gap: .28rem;
      height: 1.75rem;
      padding: 0 .55rem;
      border: 1px solid var(--color-border);
      border-radius: 2rem;
      background: transparent;
      color: var(--color-text-secondary);
      font: inherit;
      font-size: .78rem;
      font-weight: 600;
      cursor: pointer;
    }
    .slv-pill:hover { border-color: var(--color-border-strong); color: var(--color-text-primary); }
    .slv-pill--accent {
      background: color-mix(in srgb, var(--color-accent) 18%, transparent);
      border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
      color: var(--color-accent-bright, var(--color-accent));
    }
    .slv-pill--accent:hover { background: color-mix(in srgb, var(--color-accent) 26%, transparent); }

    /* Right actions */
    .slv-action {
      display: inline-flex;
      align-items: center;
      gap: .28rem;
      height: 1.8rem;
      padding: 0 .5rem;
      border: 0;
      border-radius: .35rem;
      background: transparent;
      color: var(--color-text-muted);
      font: inherit;
      font-size: .78rem;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
    }
    .slv-action:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .slv-action--icon { width: 1.8rem; padding: 0; }

    .slv-action-divider {
      width: 1px;
      height: 1.1rem;
      background: var(--color-border);
      margin: 0 .1rem;
      flex: none;
    }

    /* Add Task split button */
    .slv-add-task-wrap { display: flex; align-items: stretch; margin-left: .25rem; }
    .slv-add-task {
      height: 1.9rem;
      padding: 0 .7rem;
      border: 0;
      background: var(--color-btn-primary-bg);
      color: var(--color-btn-primary-text);
      font: inherit;
      font-size: .79rem;
      font-weight: 700;
      cursor: pointer;
      border-radius: .5rem 0 0 .5rem;
      white-space: nowrap;
    }
    .slv-add-task:hover { filter: brightness(1.1); }
    .slv-add-task--caret {
      padding: 0 .45rem;
      border-left: 1px solid color-mix(in srgb, var(--color-btn-primary-text) 22%, transparent);
      border-radius: 0 .5rem .5rem 0;
      display: grid;
      place-items: center;
      color: var(--color-btn-primary-text);
    }

    /* ── Task type dropdown ── */
    .slv-type-dropdown {
      position: absolute;
      top: calc(100% + .4rem);
      right: 0;
      width: 17.5rem;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border-strong);
      border-radius: .6rem;
      box-shadow: 0 16px 32px rgba(0, 0, 0, .5);
      padding: .7rem .65rem;
      z-index: 50;
    }

    .slv-tdd-tabs {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 .15rem .55rem;
    }
    .slv-tdd-tab {
      border: 0;
      background: transparent;
      font: inherit;
      font-size: .87rem;
      font-weight: 600;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 0;
    }
    .slv-tdd-tab--active { color: var(--color-text-primary); }

    .slv-tdd-search-wrap { margin-bottom: .55rem; }
    .slv-tdd-search {
      width: 100%;
      height: 2.1rem;
      padding: 0 .65rem;
      border: 1px solid var(--color-border-strong);
      border-radius: .4rem;
      background: var(--color-canvas);
      color: var(--color-text-primary);
      font: inherit;
      font-size: .85rem;
      box-sizing: border-box;
    }
    .slv-tdd-search::placeholder { color: var(--color-text-muted); }
    .slv-tdd-search:focus {
      outline: none;
      border-color: var(--color-accent-bright, var(--color-accent));
    }

    .slv-tdd-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .slv-tdd-item {
      display: flex;
      align-items: center;
      gap: .6rem;
      padding: .5rem .4rem;
      border-radius: .4rem;
      font-size: .90rem;
      font-weight: 600;
      color: var(--color-text-primary);
      cursor: pointer;
    }
    .slv-tdd-item:hover { background: var(--color-surface-3); }
    .slv-tdd-item__icon { color: var(--color-text-muted); flex: none; }

    /* Separator above "Create Task Type" */
    .slv-tdd-item--create {
      margin-top: .3rem;
      padding-top: .6rem;
      border-top: 1px solid var(--color-border);
    }

    /* Pinned footer row ("Apply a template") gets its own separator */
    .slv-tdd-list--footer {
      margin-top: .3rem;
      padding-top: .35rem;
      border-top: 1px solid var(--color-border);
    }

    /* ── Empty state ── */
    /* ══════════ Status groups ══════════ */
    .slv-groups { flex: 1; overflow: auto; }
    .slv-group { display: flex; flex-direction: column; }

    .slv-group__header {
      display: flex; align-items: center; gap: .45rem;
      padding: .5rem 1rem; min-height: 2.1rem;
    }
    .slv-group__chevron {
      width: 1.1rem; height: 1.1rem; display: grid; place-items: center;
      border: 0; background: transparent; color: var(--color-text-muted); cursor: pointer; padding: 0; flex: none;
    }
    .slv-group__dot {
      width: .55rem; height: .55rem; border-radius: 50%;
      background: var(--color-text-muted); flex: none;
    }
    .slv-group__title { font-size: .83rem; font-weight: 800; letter-spacing: .03em; color: var(--color-text-secondary); }
    .slv-group__count { font-size: .83rem; color: var(--color-text-muted); margin-inline-start: .1rem; }
    .slv-group__icon-btn {
      width: 1.5rem; height: 1.5rem; display: grid; place-items: center; margin-inline-start: .1rem;
      border: 0; border-radius: .3rem; background: transparent; color: var(--color-text-muted);
      cursor: pointer; padding: 0; flex: none;
    }
    .slv-group__icon-btn:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

    .slv-cols {
      display: grid; grid-template-columns: 1fr 9rem 7rem 6rem 2.2rem;
      align-items: center; gap: .4rem; padding: 0 1rem; min-height: 1.9rem;
      color: var(--color-text-muted); font-size: .78rem; font-weight: 600;
      border-bottom: 1px solid var(--color-border);
    }
    .slv-cols__add {
      width: 1.4rem; height: 1.4rem; display: grid; place-items: center; justify-self: end;
      border: 0; border-radius: .3rem; background: transparent; color: var(--color-text-muted); cursor: pointer; padding: 0;
    }
    .slv-cols__add:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

    .slv-row {
      display: grid; grid-template-columns: 1fr 9rem 7rem 6rem 2.2rem;
      align-items: center; gap: .4rem; padding: 0 1rem; min-height: 2.1rem;
      border-bottom: 1px solid var(--color-border); cursor: pointer;
    }
    .slv-row:hover { background: var(--color-surface-2); }
    .slv-row__dot { width: .5rem; height: .5rem; border-radius: 50%; border: 1.5px solid var(--color-text-muted); flex: none; }
    .slv-row__name { font-size: .84rem; color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .slv-row__assignees { display: flex; gap: .2rem; }
    .slv-row__due { font-size: .80rem; color: var(--color-text-secondary); }

    .slv-avatar {
      width: 1.35rem; height: 1.35rem; border-radius: 50%; display: grid; place-items: center;
      color: #fff; font-size: .71rem; font-weight: 700; flex: none;
    }
    .slv-avatar--sm { width: 1.15rem; height: 1.15rem; font-size: .67rem; }

    /* ── Idle "Add Task" placeholder row ── */
    .slv-add-row {
      display: flex; align-items: center; gap: .6rem; width: 100%;
      padding: .6rem 1rem; border: 0; background: transparent; cursor: pointer;
      font: inherit; font-size: .84rem; color: var(--color-text-muted); text-align: start;
    }
    .slv-add-row:hover { background: var(--color-surface-2); color: var(--color-text-secondary); }
    .slv-add-row__dot { width: .5rem; height: .5rem; border-radius: 50%; border: 1.5px dashed var(--color-text-muted); flex: none; }

    /* ── Active/editing inline "Add Task" row ── */
    .slv-inline-row {
      display: flex; align-items: center; gap: .5rem;
      padding: .45rem 1rem; border-bottom: 1px solid var(--color-border-strong);
      background: var(--color-surface-1);
    }
    .slv-inline-row__dot {
      display: grid; place-items: center; color: var(--color-text-muted); flex: none;
    }
    .slv-inline-row__input {
      flex: 1; min-width: 0; height: 1.9rem; border: 0; background: transparent;
      color: var(--color-text-primary); font: inherit; font-size: .87rem; outline: 0;
    }
    .slv-inline-row__input::placeholder { color: var(--color-text-muted); }
    .slv-inline-row__icons { display: flex; align-items: center; gap: .15rem; flex: none; }
    .slv-inline-icon-wrap { position: relative; }
    .slv-inline-icon {
      width: 1.7rem; height: 1.7rem; display: grid; place-items: center;
      border: 0; border-radius: .35rem; background: transparent; color: var(--color-text-muted);
      cursor: pointer; padding: 0;
    }
    .slv-inline-icon:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .slv-inline-icon__date { font-size: .76rem; font-weight: 600; color: var(--color-text-primary); padding: 0 .1rem; }
    .slv-inline-row__save {
      flex: none; height: 1.9rem; padding: 0 .85rem; border: 0; border-radius: .35rem;
      background: var(--color-accent); color: #fff; font: inherit; font-size: .83rem; font-weight: 700; cursor: pointer;
    }
    .slv-inline-row__save:disabled { opacity: .45; cursor: default; }
    .slv-inline-row__save:hover:not(:disabled) { background: color-mix(in srgb, var(--color-accent) 85%, #000); }

    .slv-type-dropdown--row { right: auto; left: 0; top: calc(100% + .3rem); width: 16rem; }

    /* ── Assignee popover ── */
    .slv-assignee-dropdown {
      position: absolute; top: calc(100% + .3rem); left: 0; width: 15.5rem;
      background: var(--color-surface-2); border: 1px solid var(--color-border-strong);
      border-radius: .6rem; box-shadow: 0 16px 32px rgba(0,0,0,.5); padding: .55rem; z-index: 50;
    }
    .slv-assignee-search-wrap {
      display: flex; align-items: center; gap: .35rem; height: 1.9rem; padding: 0 .5rem;
      border: 1px solid var(--color-border-strong); border-radius: .4rem; margin-bottom: .5rem;
    }
    .slv-assignee-search-icon { color: var(--color-text-muted); flex: none; }
    .slv-assignee-search { flex: 1; border: 0; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .83rem; outline: 0; }
    .slv-assignee-search::placeholder { color: var(--color-text-muted); }
    .slv-assignee-section { padding: .2rem 0; }
    .slv-assignee-section__label { display: block; padding: .2rem .35rem; font-size: .74rem; font-weight: 700; color: var(--color-text-muted); }
    .slv-assignee-item {
      display: flex; align-items: center; gap: .5rem; width: 100%; padding: .35rem .4rem;
      border: 0; border-radius: .4rem; background: transparent; color: var(--color-text-primary);
      font: inherit; font-size: .85rem; text-align: start; cursor: pointer;
    }
    .slv-assignee-item:hover { background: var(--color-surface-3); }
    .slv-assignee-item__check { margin-inline-start: auto; color: var(--color-accent); }
    .slv-assignee-item--create { color: var(--color-text-secondary); }

    /* ── Due-date popover ── */
    .slv-date-dropdown {
      position: absolute; top: calc(100% + .3rem); left: 0; width: 28.5rem;
      background: var(--color-surface-2); border: 1px solid var(--color-border-strong);
      border-radius: .6rem; box-shadow: 0 16px 32px rgba(0,0,0,.5); z-index: 50; overflow: hidden;
    }
    .slv-date-dropdown__fields { display: flex; gap: .4rem; padding: .6rem .6rem 0; }
    .slv-date-field {
      flex: 1; display: flex; align-items: center; gap: .35rem; height: 1.85rem; padding: 0 .55rem;
      border: 1px solid var(--color-border-strong); border-radius: .4rem; background: transparent;
      color: var(--color-text-muted); font: inherit; font-size: .78rem; cursor: pointer;
    }
    .slv-date-field--active { color: var(--color-text-primary); border-color: var(--color-accent); }
    .slv-date-dropdown__body { display: flex; gap: 0; padding: .5rem; }
    .slv-date-quick { width: 9.5rem; display: flex; flex-direction: column; padding-inline-end: .4rem; }
    .slv-date-quick__item {
      display: flex; align-items: center; justify-content: space-between; gap: .3rem;
      padding: .32rem .4rem; border: 0; border-radius: .35rem; background: transparent;
      color: var(--color-text-primary); font: inherit; font-size: .80rem; cursor: pointer; text-align: start;
    }
    .slv-date-quick__item:hover { background: var(--color-surface-3); }
    .slv-date-quick__day { color: var(--color-text-muted); font-size: .75rem; }
    .slv-date-quick__divider { height: 1px; background: var(--color-border); margin: .3rem .2rem; }
    .slv-date-cal { flex: 1; padding-inline-start: .5rem; border-inline-start: 1px solid var(--color-border); }
    .slv-date-cal__head { display: flex; align-items: center; gap: .4rem; padding: .2rem .3rem .5rem; font-size: .85rem; font-weight: 700; color: var(--color-text-primary); }
    .slv-date-cal__today { margin-inline-start: auto; color: var(--color-accent); font-size: .78rem; font-weight: 600; cursor: pointer; }
    .slv-date-cal__head button { width: 1.4rem; height: 1.4rem; display: grid; place-items: center; border: 0; border-radius: .3rem; background: transparent; color: var(--color-text-muted); cursor: pointer; padding: 0; }
    .slv-date-cal__head button:hover { background: var(--color-surface-3); }
    .slv-date-cal__dow { display: grid; grid-template-columns: repeat(7, 1fr); padding: 0 .3rem; margin-bottom: .2rem; }
    .slv-date-cal__dow span { text-align: center; font-size: .71rem; color: var(--color-text-muted); }
    .slv-date-cal__grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: .1rem; padding: 0 .3rem; }
    .slv-date-cal__cell {
      aspect-ratio: 1; display: grid; place-items: center; border: 0; border-radius: .35rem;
      background: transparent; color: var(--color-text-primary); font: inherit; font-size: .78rem; cursor: pointer;
    }
    .slv-date-cal__cell:hover { background: var(--color-surface-3); }
    .slv-date-cal__cell--muted { color: var(--color-text-muted); opacity: .5; }
    .slv-date-cal__cell--today { color: var(--color-accent); font-weight: 700; }
    .slv-date-cal__cell--selected { background: var(--color-accent); color: #fff; font-weight: 700; }
    .slv-date-banner {
      display: flex; align-items: center; gap: .5rem; padding: .5rem .65rem;
      background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface-2));
      border-top: 1px solid var(--color-border);
    }
    .slv-date-banner__icon { font-size: 1.1rem; flex: none; }
    .slv-date-banner__text { flex: 1; display: flex; flex-direction: column; font-size: .76rem; color: var(--color-text-secondary); }
    .slv-date-banner__text b { font-size: .80rem; color: var(--color-text-primary); }
    .slv-date-banner button { flex: none; width: 1.3rem; height: 1.3rem; display: grid; place-items: center; border: 0; border-radius: .3rem; background: transparent; color: var(--color-text-muted); cursor: pointer; padding: 0; }
    .slv-date-banner button:hover { background: var(--color-surface-3); }

    /* ══════════ Toolbar wrapper (anchors filter bar + customize drawer) ══════════ */
    .slv-toolbar-wrap { position: relative; flex: none; }

    .slv-action--active {
      color: var(--color-accent-bright, var(--color-accent));
      border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
      background: color-mix(in srgb, var(--color-accent) 14%, transparent);
    }

    /* Save view pill */
    .slv-saveview-wrap { position: relative; display: flex; align-items: stretch; }
    .slv-saveview {
      height: 1.75rem; padding: 0 .65rem;
      border: 0; border-radius: .35rem 0 0 .35rem;
      background: var(--color-accent); color: #fff;
      font: inherit; font-size: .78rem; font-weight: 700; cursor: pointer;
    }
    .slv-saveview:hover { background: color-mix(in srgb, var(--color-accent) 82%, #000); }
    .slv-saveview-caret {
      height: 1.75rem; padding: 0 .35rem;
      border: 0; border-left: 1px solid color-mix(in srgb, #000 20%, transparent);
      border-radius: 0 .35rem .35rem 0;
      background: var(--color-accent); color: #fff; cursor: pointer;
      display: grid; place-items: center;
    }
    .slv-saveview-caret:hover { background: color-mix(in srgb, var(--color-accent) 82%, #000); }
    .slv-saveview-menu {
      position: absolute; top: calc(100% + .3rem); left: 0; z-index: 220;
      width: 10rem; padding: .3rem;
      background: var(--color-surface-1); border: 1px solid var(--color-border);
      border-radius: .45rem; box-shadow: 0 8px 24px color-mix(in srgb,#000 30%, transparent);
    }
    .slv-saveview-menu button {
      display: block; width: 100%; text-align: left;
      min-height: 1.9rem; padding: 0 .5rem; border: 0; border-radius: .3rem;
      background: transparent; color: var(--color-text-primary);
      font: inherit; font-size: .80rem; cursor: pointer;
    }
    .slv-saveview-menu button:hover { background: var(--color-surface-2); }

    /* ══════════ Filter bar ══════════ */
    .slv-filterbar {
      position: relative; z-index: 150;
      padding: .9rem 1rem 1rem;
      background: var(--color-surface-1);
      border-bottom: 1px solid var(--color-border);
    }
    .slv-filterbar__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: .7rem; }
    .slv-filterbar__head h3 { margin: 0; font-size: .90rem; font-weight: 700; color: var(--color-text-primary); }
    .slv-savedfilters {
      display: inline-flex; align-items: center; gap: .3rem;
      height: 1.8rem; padding: 0 .6rem;
      border: 1px solid var(--color-border); border-radius: .35rem;
      background: transparent; color: var(--color-text-secondary);
      font: inherit; font-size: .78rem; font-weight: 600; cursor: pointer;
    }
    .slv-savedfilters:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

    .slv-frow { display: flex; flex-direction: column; gap: .3rem; margin-bottom: .4rem; max-width: 34rem; }
    .slv-logic {
      display: inline-flex; align-items: center; gap: .25rem;
      height: 1.65rem; padding: 0 .45rem;
      border: 1px solid var(--color-border); border-radius: .32rem;
      background: var(--color-surface-2); color: var(--color-text-secondary);
      font: inherit; font-size: .75rem; font-weight: 700; cursor: pointer;
      align-self: flex-start;
    }
    .slv-frow__wrap { position: relative; display: flex; align-items: center; gap: .35rem; flex: 1; }
    .slv-fselect {
      flex: 1; display: inline-flex; align-items: center; justify-content: space-between;
      height: 2rem; padding: 0 .6rem;
      border: 1px solid var(--color-border); border-radius: .4rem;
      background: var(--color-surface-2); color: var(--color-text-secondary);
      font: inherit; font-size: .80rem; cursor: pointer; gap: .4rem;
    }
    .slv-fselect > span { flex: 1; text-align: left; }
    .slv-fselect:hover { border-color: var(--color-border-strong); }
    .slv-fselect--open { border-color: var(--color-accent); }
    .slv-fdel {
      display: grid; place-items: center;
      width: 1.75rem; height: 1.75rem; flex: none;
      border: 0; border-radius: .32rem;
      background: transparent; color: var(--color-text-muted); cursor: pointer;
    }
    .slv-fdel:hover { background: var(--color-surface-3); color: var(--color-danger, #e5534b); }
    .slv-fdropdown {
      position: absolute; top: calc(100% + .2rem); left: 0;
      z-index: 300; width: 13rem;
      background: var(--color-surface-1);
      border: 1px solid var(--color-border); border-radius: .5rem;
      box-shadow: 0 6px 20px color-mix(in srgb,#000 25%,transparent);
      overflow: hidden;
    }
    .slv-fsearch {
      display: block; width: 100%; box-sizing: border-box;
      padding: .42rem .65rem; border: 0; border-bottom: 1px solid var(--color-border);
      background: transparent; color: var(--color-text-primary);
      font: inherit; font-size: .80rem; outline: 0;
    }
    .slv-fsearch::placeholder { color: var(--color-text-muted); }
    .slv-flist { list-style: none; margin: 0; padding: .2rem 0 .3rem; max-height: 13rem; overflow-y: auto; }
    .slv-fopt { padding: .35rem .65rem; font-size: .80rem; color: var(--color-text-secondary); cursor: pointer; }
    .slv-fopt:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
    .slv-fopt--active { color: var(--color-accent); font-weight: 600; }
    .slv-nested {
      border: 0; background: transparent;
      color: var(--color-accent-bright, var(--color-accent));
      font: inherit; font-size: .74rem; font-weight: 600; cursor: pointer;
      padding: .12rem .2rem; border-radius: .22rem; align-self: flex-start;
    }
    .slv-nested:hover { text-decoration: underline; }
    .slv-addfilterrow {
      display: inline-flex; align-items: center; gap: .28rem;
      min-height: 1.65rem; padding: 0 .5rem; margin-top: .15rem;
      border: 1px solid var(--color-border); border-radius: .35rem;
      background: transparent; color: var(--color-text-secondary);
      font: inherit; font-size: .77rem; font-weight: 600; cursor: pointer;
    }
    .slv-addfilterrow:hover { background: var(--color-surface-2); }

    /* ══════════ Customize view drawer ══════════ */
    .slv-cz {
      position: absolute; top: 100%; right: .75rem;
      z-index: 250; width: 18.5rem; max-width: calc(100vw - 1.5rem);
      max-height: calc(100vh - 8rem); overflow-y: auto;
      background: var(--color-surface-1);
      border: 1px solid var(--color-border);
      border-radius: .6rem;
      box-shadow: 0 8px 28px color-mix(in srgb, #000 30%, transparent);
    }
    .slv-cz__header {
      position: sticky; top: 0; z-index: 2;
      display: flex; align-items: center; justify-content: space-between;
      padding: .7rem .5rem .55rem .9rem;
      background: var(--color-surface-1);
    }
    .slv-cz__header--fields { padding-left: .5rem; gap: .3rem; }
    .slv-cz__header h3 { margin: 0; font-size: .90rem; font-weight: 700; color: var(--color-text-primary); }
    .slv-cz-header__spacer { flex: 1; }
    .slv-cz-close, .slv-cz-back {
      display: grid; place-items: center;
      width: 1.7rem; height: 1.7rem; flex: none;
      border: 0; border-radius: .35rem;
      background: transparent; color: var(--color-text-muted); cursor: pointer;
    }
    .slv-cz-close:hover, .slv-cz-back:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

    .slv-cz-viewname {
      display: flex; align-items: center; gap: .5rem;
      margin: 0 .9rem .6rem; padding: 0 .1rem;
    }
    .slv-cz-viewname__icon {
      display: grid; place-items: center;
      width: 1.7rem; height: 1.7rem; flex: none;
      border: 1px solid var(--color-border); border-radius: .35rem;
      color: var(--color-text-muted);
    }
    .slv-cz-viewname__input {
      flex: 1; height: 1.9rem; padding: 0 .5rem;
      border: 1px solid var(--color-border); border-radius: .35rem;
      background: var(--color-surface-2); color: var(--color-text-primary);
      font: inherit; font-size: .85rem; font-weight: 600;
    }
    .slv-cz-viewname__input:focus { outline: 0; border-color: var(--color-accent); }

    .slv-cz-body { padding-bottom: .5rem; display: flex; flex-direction: column; }

    /* Generic row / toggle / divider (shared across drawer sections) */
    .cz-row {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; min-height: 2.15rem; padding: 0 .9rem;
      border: 0; background: transparent; color: var(--color-text-primary);
      font: inherit; font-size: .85rem; text-align: left; cursor: pointer;
    }
    .cz-row:hover { background: var(--color-surface-2); }
    .cz-row--nested { padding-left: 1.3rem; }
    .cz-row__val { display: inline-flex; align-items: center; gap: .3rem; color: var(--color-text-muted); font-size: .83rem; }
    .cz-row__icontext { display: inline-flex; align-items: center; gap: .5rem; }
    .cz-chevron { color: var(--color-text-muted); transition: transform .12s; }
    .cz-chevron--open { transform: rotate(90deg); }
    .cz-divider { height: 1px; margin: .35rem 0; background: var(--color-border); }

    .cz-toggle {
      position: relative; flex: none;
      width: 1.85rem; height: 1.05rem;
      border-radius: 1rem; background: var(--color-border-strong);
      transition: background .12s; cursor: pointer;
    }
    .cz-toggle i {
      position: absolute; top: .13rem; left: .13rem;
      width: .8rem; height: .8rem; border-radius: 50%;
      background: #fff; transition: left .12s;
    }
    .cz-toggle--on { background: var(--color-accent); }
    .cz-toggle--on i { left: calc(100% - .93rem); }
    .cz-toggle--disabled { opacity: .5; cursor: default; }

    .cz-inline { padding: .2rem .9rem .5rem; display: flex; flex-direction: column; gap: .5rem; }
    .cz-group-row { display: flex; align-items: center; gap: .4rem; }
    .cz-group-select {
      flex: 1; display: flex; align-items: center; gap: .3rem;
      height: 2rem; padding: 0 .55rem;
      border: 1px solid var(--color-border); border-radius: .4rem;
      background: var(--color-surface-2); color: var(--color-text-secondary);
    }
    .cz-group-select select {
      flex: 1; border: 0; background: transparent; color: var(--color-text-primary);
      font: inherit; font-size: .80rem; cursor: pointer;
    }
    .cz-group-select select:focus { outline: 0; }
    .cz-group-select--order { flex: none; width: 7rem; }
    .cz-group-del {
      display: grid; place-items: center; width: 1.9rem; height: 1.9rem; flex: none;
      border: 0; border-radius: .35rem; background: transparent;
      color: var(--color-text-muted); cursor: pointer;
    }
    .cz-group-del:hover { background: var(--color-surface-2); color: var(--color-danger, #e5534b); }

    /* Flyout menus (Subtasks / Templates) */
    .cz-flyout {
      position: relative; margin: 0 .9rem .3rem; padding: .35rem 0;
      background: var(--color-surface-2); border: 1px solid var(--color-border);
      border-radius: .5rem; box-shadow: 0 6px 18px color-mix(in srgb,#000 25%,transparent);
    }
    .cz-flyout__label { padding: .3rem .8rem .35rem; font-size: .74rem; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: var(--color-text-muted); }
    .cz-flyout__item {
      display: flex; align-items: center; justify-content: space-between; gap: .5rem;
      width: 100%; min-height: 2.2rem; padding: 0 .8rem;
      border: 0; background: transparent; color: var(--color-text-primary);
      font: inherit; font-size: .83rem; text-align: left; cursor: pointer;
    }
    .cz-flyout__item:hover { background: var(--color-surface-3); }
    .cz-flyout__item--action { justify-content: flex-start; gap: .6rem; font-weight: 600; }
    .cz-flyout__item--action lucide-icon { color: var(--color-text-muted); }
    .cz-flyout__body { display: flex; flex-direction: column; gap: .05rem; }
    .cz-flyout__body strong { font-size: .83rem; font-weight: 650; }
    .cz-flyout__body small { font-size: .71rem; color: var(--color-text-muted); }

    /* Favorite panel */
    .cz-favpanel { padding: .3rem .9rem .6rem; }
    .cz-layout-opts { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin-bottom: .7rem; }
    .cz-layout-opt {
      display: grid; justify-items: center; gap: .4rem; padding: .5rem .3rem;
      border: 1.5px solid var(--color-border); border-radius: .5rem;
      background: var(--color-surface-2); color: var(--color-text-secondary);
      font: inherit; font-size: .76rem; font-weight: 600; cursor: pointer;
    }
    .cz-layout-opt:hover { border-color: var(--color-border-strong); color: var(--color-text-primary); }
    .cz-layout-opt--selected { border-color: var(--color-accent); color: var(--color-accent); background: var(--color-accent-soft); }
    .cz-layout-preview {
      position: relative; display: block; width: 100%; height: 2rem;
      border-radius: .3rem; overflow: hidden; background: var(--color-surface-3);
    }
    .cz-layout-preview i, .cz-layout-preview b { position: absolute; background: var(--color-text-muted); opacity: .5; }
    .cz-layout-preview--sidebar i { top: 0; bottom: 0; left: 0; width: 28%; opacity: .8; }
    .cz-layout-preview--sidebar b { top: 0; right: 0; bottom: 0; left: 34%; }
    .cz-layout-preview--top i { top: 0; left: 0; right: 0; height: 30%; opacity: .8; }
    .cz-layout-preview--top b { top: 38%; left: 0; right: 0; bottom: 0; }
    .cz-layout-opt--selected .cz-layout-preview i,
    .cz-layout-opt--selected .cz-layout-preview b { background: var(--color-accent); opacity: .55; }
    .cz-layout-opt--selected .cz-layout-preview i { opacity: .9; }
    .cz-sections-head {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: .4rem;
      font-size: .74rem; font-weight: 700; letter-spacing: .03em; text-transform: uppercase;
      color: var(--color-text-muted);
    }
    .cz-addsection {
      display: grid; place-items: center; width: 1.4rem; height: 1.4rem;
      border: 0; border-radius: .3rem; background: transparent; color: var(--color-text-muted); cursor: pointer;
    }
    .cz-addsection:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
    .cz-fav-item {
      display: flex; align-items: center; gap: .5rem;
      min-height: 1.9rem; padding: 0 .5rem; border-radius: .35rem;
      color: var(--color-text-secondary); font-size: .83rem;
    }
    .cz-fav-item:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

    /* Export panel */
    .cz-exportpanel {
      position: absolute; top: 0; right: calc(100% + .5rem); z-index: 260;
      width: 16.5rem; padding: .85rem .9rem 1rem;
      background: var(--color-surface-1); border: 1px solid var(--color-border);
      border-radius: .6rem; box-shadow: 0 8px 28px color-mix(in srgb, #000 30%, transparent);
      display: flex; flex-direction: column; gap: .8rem;
    }
    .cz-export-field { display: flex; flex-direction: column; gap: .35rem; }
    .cz-export-field label {
      display: flex; align-items: center; gap: .3rem;
      font-size: .78rem; font-weight: 700; color: var(--color-text-secondary);
    }
    .cz-info { opacity: .6; font-size: .71rem; }
    .cz-export-toggle2 { display: flex; gap: .4rem; }
    .cz-export-toggle2 button {
      flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: .3rem;
      height: 1.9rem; border: 1px solid var(--color-border); border-radius: .35rem;
      background: var(--color-surface-2); color: var(--color-text-secondary);
      font: inherit; font-size: .78rem; font-weight: 600; cursor: pointer;
    }
    .cz-export-toggle2 button.selected { border-color: var(--color-accent); color: var(--color-accent); background: var(--color-accent-soft); }
    .cz-radio { display: flex; align-items: center; gap: .45rem; font-size: .80rem; color: var(--color-text-primary); cursor: pointer; }
    .cz-export-select {
      display: flex; align-items: center; gap: .3rem;
      height: 1.9rem; padding: 0 .55rem;
      border: 1px solid var(--color-border); border-radius: .35rem;
      background: var(--color-surface-2); color: var(--color-text-secondary);
    }
    .cz-export-select select { flex: 1; border: 0; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .80rem; }
    .cz-export-select select:focus { outline: 0; }
    .cz-export-download {
      min-height: 2rem; border: 0; border-radius: .4rem;
      background: var(--color-surface-3); color: var(--color-text-primary);
      font: inherit; font-size: .83rem; font-weight: 700; cursor: pointer;
    }
    .cz-export-download:hover { background: var(--color-border-strong); }
    .cz-export-hint { margin: -.4rem 0 0; text-align: center; font-size: .69rem; color: var(--color-text-muted); }

    /* ══════════ Fields panel ══════════ */
    .cz-fields-search { padding: 0 .9rem .6rem; }
    .cz-fields-search input {
      width: 100%; box-sizing: border-box; height: 2rem; padding: 0 .6rem;
      border: 1px solid var(--color-border); border-radius: .4rem;
      background: var(--color-surface-2); color: var(--color-text-primary);
      font: inherit; font-size: .83rem;
    }
    .cz-fields-search input:focus { outline: 0; border-color: var(--color-accent); }
    .cz-fields-tabs { display: flex; gap: 1rem; padding: 0 .9rem .5rem; border-bottom: 1px solid var(--color-border); }
    .cz-fields-tabs button {
      border: 0; background: transparent; color: var(--color-text-muted);
      font: inherit; font-size: .83rem; font-weight: 700; cursor: pointer;
      padding: 0 0 .5rem; border-bottom: 2px solid transparent;
    }
    .cz-fields-tab--active { color: var(--color-text-primary); border-bottom-color: var(--color-text-primary); }
    .cz-fields-body { padding: .3rem 0 .6rem; }

    .cz-fields-create { display: flex; flex-direction: column; gap: .5rem; padding: .6rem .9rem; }
    .cz-fields-create__name, .cz-fields-create__type {
      height: 2rem; padding: 0 .55rem;
      border: 1px solid var(--color-border); border-radius: .4rem;
      background: var(--color-surface-2); color: var(--color-text-primary);
      font: inherit; font-size: .83rem;
    }
    .cz-fields-create__btn {
      height: 2rem; border: 0; border-radius: .4rem;
      background: var(--color-accent); color: #fff;
      font: inherit; font-size: .83rem; font-weight: 700; cursor: pointer;
    }
    .cz-fields-create__btn:hover { background: color-mix(in srgb, var(--color-accent) 82%, #000); }

    .cz-fields-group { margin-bottom: .3rem; }
    .cz-fields-group__head {
      display: flex; align-items: center; gap: .3rem;
      width: 100%; min-height: 1.9rem; padding: 0 .9rem;
      border: 0; background: transparent; color: var(--color-text-muted);
      font: inherit; font-size: .76rem; font-weight: 700; text-transform: uppercase; letter-spacing: .03em;
      cursor: pointer;
    }
    .cz-fields-group__count { margin-left: auto; color: var(--color-text-muted); font-size: .76rem; font-weight: 600; text-transform: none; letter-spacing: 0; }
    .cz-field-row {
      display: flex; align-items: center; gap: .55rem;
      min-height: 2.1rem; padding: 0 .9rem;
    }
    .cz-field-row:hover { background: var(--color-surface-2); }
    .cz-field-row--locked { opacity: .85; }
    .cz-field-row__icon {
      display: grid; place-items: center; width: 1.3rem; flex: none;
      color: var(--color-text-muted); font-size: .85rem; font-weight: 700;
    }
    .cz-field-row__label { flex: 1; font-size: .84rem; color: var(--color-text-primary); }

    /* ══════════ ClickUp list look ══════════ */
    /* Toolbar: every control is a bordered pill */
    .slv-toolbar { min-height: 3.1rem; padding: 0 1rem; border-bottom: 1px solid var(--color-border); }
    .slv-pill { height: 1.9rem; padding: 0 .7rem; border-color: var(--color-border-strong); color: var(--color-text-primary); font-size: .78rem; }
    .slv-pill:hover { background: var(--color-surface-3); border-color: var(--color-border-strong); color: var(--color-text-primary); }
    .slv-pill--accent { color: var(--color-accent-bright, var(--color-accent)); border-color: color-mix(in srgb, var(--color-accent) 55%, transparent); background: color-mix(in srgb, var(--color-accent) 14%, transparent); }
    .slv-pill--accent:hover { color: var(--color-accent-bright, var(--color-accent)); background: color-mix(in srgb, var(--color-accent) 24%, transparent); border-color: color-mix(in srgb, var(--color-accent) 70%, transparent); }
    .slv-action { height: 1.9rem; padding: 0 .7rem; border: 1px solid var(--color-border-strong); border-radius: 999px; color: var(--color-text-primary); font-size: .78rem; }
    .slv-action:hover { background: var(--color-surface-3); color: var(--color-text-primary); border-color: var(--color-border-strong); }
    .slv-action--active { background: color-mix(in srgb, var(--color-accent) 16%, transparent); border-color: color-mix(in srgb, var(--color-accent) 50%, transparent); color: var(--color-accent-bright, var(--color-accent)); }
    .slv-action--icon { width: 1.9rem; padding: 0; justify-content: center; }
    .slv-toolbar__right { gap: .4rem; }
    .slv-action-divider { display: none; }
    .slv-add-task { height: 1.9rem; }

    /* The list is a rounded card with a breadcrumb title */
    .slv-groups { flex: 0 0 auto; overflow: visible; margin: 1rem 1rem 1.5rem; padding: .75rem 1.1rem 1rem; border: 1px solid var(--color-border); border-radius: .85rem; background: var(--color-canvas); }
    .slv-card__head { padding: .15rem .25rem 1.4rem; }
    .slv-card__head small { display: block; color: var(--color-text-muted); font-size: .72rem; }
    .slv-card__title { display: flex; align-items: center; gap: .6rem; margin-top: .15rem; }
    .slv-card__title b { font-size: 1.05rem; font-weight: 700; color: var(--color-text-primary); }
    .slv-card__title lucide-icon { color: var(--color-text-muted); }
    .slv-groups .slv-group__header, .slv-groups .slv-cols, .slv-groups .slv-row, .slv-groups .slv-inline-row, .slv-groups .slv-add-row { padding-inline: .3rem; }

    /* Status chip, like ClickUp's coloured status labels */
    .slv-group__pill { display: inline-flex; align-items: center; gap: .35rem; height: 1.45rem; padding: 0 .5rem; border-radius: .4rem; background: var(--color-surface-3); }
    .slv-group__pill .slv-group__dot { width: .8rem; height: .8rem; border-radius: 50%; border: 1.6px dashed var(--color-text-secondary); background: transparent; }
    .slv-group__pill .slv-group__title { font-size: .72rem; font-weight: 700; letter-spacing: .01em; color: var(--color-text-primary); }
    .slv-group__count { font-size: .78rem; }

    /* Add-column "+" is a filled accent circle */
    .slv-cols__add { width: 1.1rem; height: 1.1rem; border-radius: 50%; background: var(--color-btn-primary-bg); color: var(--color-btn-primary-text); }
    .slv-cols__add:hover { filter: brightness(1.12); background: var(--color-btn-primary-bg); color: var(--color-btn-primary-text); }
    .slv-cols { border-bottom: 1px solid var(--color-border); }
    .slv-row:hover { background: var(--color-surface-1); }
    .slv-row__dot { width: .85rem; height: .85rem; border-width: 1.6px; }

    /* Inline "add task" row: bordered icon buttons, Cancel + Save */
    .slv-inline-row { background: transparent; border-bottom: 1px solid var(--color-border-strong); gap: .45rem; }
    .slv-inline-icon { width: 1.85rem; height: 1.85rem; border: 1px solid var(--color-border-strong); border-radius: .45rem; color: var(--color-text-secondary); }
    .slv-inline-icon:hover { background: var(--color-surface-3); color: var(--color-text-primary); border-color: var(--color-border-strong); }
    .slv-inline-row__cancel { flex: none; height: 1.85rem; padding: 0 .7rem; border: 1px solid var(--color-border-strong); border-radius: .45rem; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .8rem; font-weight: 600; cursor: pointer; }
    .slv-inline-row__cancel:hover { background: var(--color-surface-3); }
    .slv-inline-row__save { height: 1.85rem; border-radius: .45rem; background: var(--color-btn-primary-bg); color: var(--color-btn-primary-text); }
    .slv-inline-row__save:hover:not(:disabled) { filter: brightness(1.1); }
    .slv-inline-row__save:disabled { opacity: .45; }
    .slv-add-row:hover { background: var(--color-surface-1); }

    /* Menus */
    .slv-type-dropdown, .slv-assignee-dropdown { border-radius: .75rem; }
    .slv-tdd-item:hover { background: var(--color-surface-3); }

    /* ── Group options menu ── */
    .slv-group--hidden { display: none; }
    .slv-group__menu-wrap { position: relative; display: inline-flex; }
    .slv-group__icon-btn--on { background: var(--color-surface-3); color: var(--color-text-primary); }
    .slv-group__rename { width: 7rem; height: 1.2rem; border: 0; outline: 0; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .72rem; font-weight: 700; text-transform: uppercase; }
    .slv-gmenu { position: absolute; top: calc(100% + .35rem); left: 0; z-index: 120; width: 15rem; padding: .4rem; background: var(--color-surface-2); border: 1px solid var(--color-border-strong); border-radius: .75rem; box-shadow: 0 14px 34px rgba(0,0,0,.5); }
    .slv-gmenu__label { margin: 0; padding: .35rem .55rem .3rem; color: var(--color-text-muted); font-size: .72rem; font-weight: 500; }
    .slv-gmenu__item { display: flex; align-items: center; gap: .65rem; width: 100%; min-height: 2rem; padding: 0 .55rem; border: 0; border-radius: .45rem; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .84rem; font-weight: 500; text-align: start; cursor: pointer; }
    .slv-gmenu__item lucide-icon { color: var(--color-text-secondary); }
    .slv-gmenu__item:hover { background: var(--color-surface-3); }
    .slv-gmenu__sep { height: 1px; margin: .3rem .2rem; background: var(--color-border); }
    .slv-hidden-row { display: flex; align-items: center; gap: .5rem; margin-top: .5rem; padding: .55rem .3rem 0; border-top: 1px solid var(--color-border); color: var(--color-text-muted); font-size: .8rem; }
    .slv-hidden-row button { border: 0; background: transparent; color: var(--color-accent-bright, var(--color-accent)); font: inherit; font-weight: 600; cursor: pointer; }
    .slv-hidden-row button:hover { text-decoration: underline; }

    /* ── Filter: floating popover under the toolbar (was a full-width bar) ── */
    .slv-filterbar { position: absolute; top: calc(100% + .4rem); right: 1rem; left: auto; z-index: 150; width: min(38rem, calc(100vw - 2rem)); padding: 1rem 1.1rem 1.1rem; background: var(--color-surface-2); border: 1px solid var(--color-border-strong); border-radius: .85rem; box-shadow: 0 16px 40px rgba(0,0,0,.5); }
    .slv-filterbar__head h3 { font-size: .95rem; }
    .slv-savedfilters { border-color: var(--color-border-strong); border-radius: 999px; height: 1.85rem; padding: 0 .75rem; color: var(--color-text-primary); }
    .slv-savedfilters:hover { background: var(--color-surface-3); }
    .slv-frow { max-width: none; margin-bottom: .6rem; }
    .slv-fselect { height: 2.15rem; border-color: var(--color-border-strong); background: var(--color-surface-1); color: var(--color-text-primary); border-radius: .5rem; font-size: .84rem; }
    .slv-fselect:hover { background: var(--color-surface-3); }
    .slv-fdropdown { width: 100%; background: var(--color-surface-2); border-color: var(--color-border-strong); border-radius: .65rem; box-shadow: 0 12px 30px rgba(0,0,0,.5); }
    .slv-fopt { padding: .45rem .75rem; font-size: .84rem; }
    .slv-fopt:hover { background: var(--color-surface-3); }
    .slv-nested { color: var(--color-text-secondary); font-size: .8rem; font-weight: 500; }
    .slv-nested:hover { color: var(--color-text-primary); text-decoration: none; background: var(--color-surface-3); }
    .slv-addfilterrow { height: 2rem; padding: 0 .8rem; border-color: var(--color-border-strong); border-radius: 999px; color: var(--color-text-primary); font-size: .8rem; }
    .slv-addfilterrow:hover { background: var(--color-surface-3); }
    .slv-logic { border-color: var(--color-border-strong); }
    .slv-logic:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

    /* ── Add-task popovers open leftwards so they never run off the right edge ── */
    .slv-inline-icon-wrap .slv-date-dropdown, .slv-inline-icon-wrap .slv-assignee-dropdown, .slv-inline-icon-wrap .slv-type-dropdown--row { left: auto; right: 0; }
    .slv-date-dropdown { width: min(28.5rem, calc(100vw - 2rem)); border-radius: .85rem; }
    .slv-date-dropdown__body { align-items: flex-start; }
    .slv-date-field { color: var(--color-text-secondary); }
    .slv-date-field:hover { background: var(--color-surface-3); }
  `],
})
export class SpaceListViewComponent {
  readonly notifications = inject(NotificationService);
  readonly ctx = inject(SpaceContextService);

  readonly Filter = Filter; readonly CircleOff = CircleOff;
  readonly UserCircle = UserCircle; readonly Search = Search;
  readonly Settings2 = Settings2; readonly Plus = Plus;
  readonly ChevronDown = ChevronDown; readonly Folder = Folder;
  readonly List = List; readonly FileText = FileText;
  readonly ChevronUp = ChevronUp; readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight; readonly X = X;
  readonly Trash2 = Trash2; readonly Link2 = Link2; readonly Star = Star;
  readonly Check = Check; readonly CircleDot = CircleDot;
  // Task type icons (used in template via TASK_TYPES array)
  readonly Circle = Circle; readonly Diamond = Diamond;
  readonly ClipboardList = ClipboardList; readonly FileSignature = FileSignature;
  readonly LayoutTemplate = LayoutTemplate;
  readonly Paperclip = Paperclip; readonly MoreHorizontal = MoreHorizontal;
  readonly Pencil = Pencil; readonly CircleChevronUp = CircleChevronUp; readonly EyeOff = EyeOff;
  readonly CheckCheck = CheckCheck; readonly ChevronsUp = ChevronsUp; readonly Bot = Bot;
  readonly Calendar = Calendar; readonly Flag = Flag;

  // Expose constants to template
  readonly TASK_TYPES = TASK_TYPES;
  readonly MANAGE_ITEMS = MANAGE_ITEMS;
  readonly PROPERTIES_TOTAL = PROPERTIES_TOTAL;
  readonly CUSTOM_FIELDS_TOTAL = CUSTOM_FIELDS_TOTAL;

  typeDropdownOpen = signal(false);
  typeTab          = signal<'create' | 'manage'>('create');
  typeSearch       = '';
  tasks            = signal<ListTask[]>([]);
  private nextId   = 1;

  // ── Group (single "TO DO" group for now, matching Group: Status) ──
  groupCollapsed = signal(false);

  /* ── Group options menu (Rename / Collapse / Hide …) ── */
  groupName = signal('TO DO');
  groupMenuOpen = signal(false);
  groupRenaming = signal(false);
  groupHidden = signal(false);

  toggleGroupMenu(e: Event) { e.stopPropagation(); this.groupMenuOpen.update(v => !v); }
  startGroupRename() { this.groupMenuOpen.set(false); this.groupRenaming.set(true); setTimeout(() => (document.querySelector('.slv-group__rename') as HTMLInputElement | null)?.select()); }
  commitGroupRename(value: string) { const v = value.trim(); if (v) this.groupName.set(v.toUpperCase()); this.groupRenaming.set(false); }
  collapseGroupFromMenu() { this.groupMenuOpen.set(false); this.groupCollapsed.update(v => !v); }
  collapseAllGroups() { this.groupMenuOpen.set(false); this.groupCollapsed.set(true); }
  hideGroupStatus() { this.groupMenuOpen.set(false); this.groupHidden.set(true); }
  groupMenuSoon(label: string) { this.groupMenuOpen.set(false); this.notifications.info(label, 'This option is coming soon.'); }

  // ── Inline "Add Task" row state ──
  @ViewChild('inlineNameInput') inlineNameInputRef?: ElementRef<HTMLInputElement>;
  readonly workspaceMembers: Assignee[] = [ME];

  inlineAddOpen      = signal(false);
  inlineTaskName     = signal('');
  inlineType         = signal<TaskType>(TASK_TYPES[0]);
  inlineAssignees    = signal<Assignee[]>([]);
  inlineDueDate      = signal<Date | null>(null);

  inlineTypeOpen     = signal(false);
  inlineTypeTab      = signal<'create' | 'manage'>('create');
  inlineTypeSearch   = '';

  inlineAssigneeOpen   = signal(false);
  inlineAssigneeSearch = '';

  inlineDateOpen   = signal(false);
  calendarMonth    = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  showScheduleBanner = signal(true);

  // ── Customize view drawer ──
  customizeOpen = signal(false);
  activePanel = signal<'main' | 'fields'>('main');
  viewName = 'List';
  viewDirty = signal(false);
  saveMenuOpen = signal(false);

  showEmptyStatuses = signal(false);
  wrapText = signal(false);
  showTaskLocations = signal(false);
  showSubtaskParentNames = signal(false);
  showClosedTasks = signal(false);

  autosaveForMe = signal(false);
  pinView = signal(false);
  privateView = signal(false);
  protectView = signal(false);
  defaultView = signal(false);

  // Filter bar (shared between toolbar "Filter" pill and the drawer's Filter row)
  filterBarOpen = signal(false);
  filterRows = signal<ListFilterRow[]>([{ id: 1, value: '', dropdownOpen: false, search: '' }]);
  private nextFilterId = 2;
  filterSummary = computed(() => {
    const applied = this.filterRows().filter(r => r.value).length;
    return applied ? `${applied} applied` : 'None';
  });

  // Group
  groupOpen = signal(false);
  groupField = signal('Status');
  groupFieldSelect = 'Status';
  groupOrder = 'Ascending';
  alsoGroupByList = signal(true);

  // Subtasks
  subtasksOpen = signal(false);
  subtasksMode = signal('Collapsed');
  readonly subtaskOptions = [
    { id: 'collapsed', label: 'Collapsed', hint: undefined as string | undefined },
    { id: 'expanded', label: 'Expanded', hint: undefined as string | undefined },
    { id: 'separate', label: 'Separate', hint: 'Use this to filter subtasks' },
  ];

  // Templates
  templatesOpen = signal(false);

  // Favorite
  favoriteOpen = signal(false);
  favLayout = signal<'sidebar' | 'top'>('sidebar');

  // Export
  exportOpen = signal(false);
  exportFormat = signal<'csv' | 'excel'>('csv');
  exportWhat = signal<'visible' | 'names' | 'all'>('visible');
  exportDateFormat = 'Normal';
  exportTimeFormat = 'Normal';

  // Fields panel
  fieldsSearch = '';
  fieldsTab = signal<'create' | 'existing'>('existing');
  newFieldName = '';
  newFieldType = 'Text';
  shownSectionOpen = signal(true);
  propertiesSectionOpen = signal(true);
  customSectionOpen = signal(true);

  private allFields = signal<FieldDef[]>(FIELD_DEFS.map(f => ({ ...f })));
  private allCustomFields = signal<FieldDef[]>(CUSTOM_FIELD_DEFS.map(f => ({ ...f })));

  shownFields = computed(() => {
    const q = this.fieldsSearch.toLowerCase();
    return this.allFields().filter(f => f.on && f.label.toLowerCase().includes(q));
  });
  hiddenFields = computed(() => {
    const q = this.fieldsSearch.toLowerCase();
    return this.allFields().filter(f => !f.on && f.label.toLowerCase().includes(q));
  });
  customFields = computed(() => {
    const q = this.fieldsSearch.toLowerCase();
    return this.allCustomFields().filter(f => f.label.toLowerCase().includes(q));
  });
  fieldsShownCount = computed(() =>
    this.allFields().filter(f => f.on && !f.locked).length
    + this.allCustomFields().filter(f => f.on).length
  );

  markDirty() { this.viewDirty.set(true); }

  toggleFlag(name: 'showEmptyStatuses' | 'wrapText' | 'showTaskLocations' | 'showSubtaskParentNames'
    | 'alsoGroupByList' | 'autosaveForMe' | 'pinView' | 'privateView' | 'protectView' | 'defaultView') {
    switch (name) {
      case 'showEmptyStatuses': this.showEmptyStatuses.update(v => !v); break;
      case 'wrapText': this.wrapText.update(v => !v); break;
      case 'showTaskLocations': this.showTaskLocations.update(v => !v); break;
      case 'showSubtaskParentNames': this.showSubtaskParentNames.update(v => !v); break;
      case 'alsoGroupByList': this.alsoGroupByList.update(v => !v); break;
      case 'autosaveForMe': this.autosaveForMe.update(v => !v); break;
      case 'pinView': this.pinView.update(v => !v); break;
      case 'privateView': this.privateView.update(v => !v); break;
      case 'protectView': this.protectView.update(v => !v); break;
      case 'defaultView': this.defaultView.update(v => !v); break;
    }
    this.markDirty();
  }

  onWrapClick() {
    this.filterBarOpen.set(false);
    this.saveMenuOpen.set(false);
    this.closeAllFilterDropdowns();
    if (this.customizeOpen()) {
      this.customizeOpen.set(false);
      this.activePanel.set('main');
      this.groupOpen.set(false);
      this.subtasksOpen.set(false);
      this.templatesOpen.set(false);
      this.favoriteOpen.set(false);
      this.exportOpen.set(false);
    }
  }

  toggleCustomize(e: Event) {
    e.stopPropagation();
    this.customizeOpen.update(v => !v);
    if (!this.customizeOpen()) this.activePanel.set('main');
  }

  closeCustomize() {
    this.customizeOpen.set(false);
    this.activePanel.set('main');
  }

  toggleClosed(e: Event) {
    e.stopPropagation();
    this.showClosedTasks.update(v => !v);
    this.markDirty();
  }

  toggleFilterBar(e: Event) {
    e.stopPropagation();
    this.filterBarOpen.update(v => !v);
    if (!this.filterBarOpen()) this.closeAllFilterDropdowns();
  }

  addFilterRow() {
    this.filterRows.update(rows => [...rows, { id: this.nextFilterId++, value: '', dropdownOpen: false, search: '' }]);
  }

  removeFilterRow(id: number) {
    this.filterRows.update(rows => rows.filter(r => r.id !== id));
    if (this.filterRows().length === 0) this.addFilterRow();
    this.markDirty();
  }

  toggleFilterDropdown(row: ListFilterRow, e: Event) {
    e.stopPropagation();
    this.filterRows.update(rows =>
      rows.map(r => ({ ...r, dropdownOpen: r.id === row.id ? !r.dropdownOpen : false })));
  }

  pickFilterOption(row: ListFilterRow, opt: string) {
    this.filterRows.update(rows =>
      rows.map(r => r.id === row.id ? { ...r, value: opt, dropdownOpen: false, search: '' } : r));
    this.markDirty();
  }

  getFilterOptions(row: ListFilterRow): string[] {
    const q = row.search.toLowerCase();
    return q ? FILTER_OPTIONS.filter(o => o.toLowerCase().includes(q)) : FILTER_OPTIONS;
  }

  private closeAllFilterDropdowns() {
    this.filterRows.update(rows => rows.map(r => ({ ...r, dropdownOpen: false })));
  }

  openGroupPanel(e: Event) {
    e.stopPropagation();
    this.customizeOpen.set(true);
    this.activePanel.set('main');
    this.groupOpen.set(true);
  }

  onGroupFieldChange(val: string) {
    this.groupField.set(val);
    this.markDirty();
  }

  openSubtasksPanel(e: Event) {
    e.stopPropagation();
    this.customizeOpen.set(true);
    this.activePanel.set('main');
    this.subtasksOpen.set(true);
  }

  pickSubtaskMode(id: string) {
    const opt = this.subtaskOptions.find(o => o.id === id)!;
    this.subtasksMode.set(opt.label);
    this.subtasksOpen.set(false);
    this.markDirty();
  }

  applyTemplate() {
    this.notifications.info('Choose a template to apply');
    this.templatesOpen.set(false);
  }
  saveAsTemplate() {
    this.notifications.success('View saved as template');
    this.templatesOpen.set(false);
  }
  updateTemplate() {
    this.notifications.success('Template updated');
    this.templatesOpen.set(false);
  }

  copyLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    this.notifications.success('Link copied to clipboard');
  }

  downloadExport() {
    this.notifications.warning('Exporting requires a Business plan');
  }

  openSharing() {
    this.notifications.info('Sharing & Permissions');
  }

  openFields() {
    this.activePanel.set('fields');
  }

  toggleField(f: FieldDef) {
    if (f.locked) return;
    const isCustom = this.allCustomFields().some(c => c.id === f.id);
    if (isCustom) {
      this.allCustomFields.update(fields => fields.map(c => c.id === f.id ? { ...c, on: !c.on } : c));
    } else {
      this.allFields.update(fields => fields.map(x => x.id === f.id ? { ...x, on: !x.on } : x));
    }
    this.markDirty();
  }

  createField() {
    if (!this.newFieldName.trim()) return;
    this.notifications.success(`Field "${this.newFieldName}" created`);
    this.newFieldName = '';
    this.fieldsTab.set('existing');
  }

  saveView(e: Event) {
    e.stopPropagation();
    this.viewDirty.set(false);
    this.saveMenuOpen.set(false);
    this.notifications.success('View saved');
  }

  resetView(e: Event) {
    e.stopPropagation();
    this.showEmptyStatuses.set(false);
    this.wrapText.set(false);
    this.showTaskLocations.set(false);
    this.showSubtaskParentNames.set(false);
    this.showClosedTasks.set(false);
    this.groupField.set('Status');
    this.groupFieldSelect = 'Status';
    this.groupOrder = 'Ascending';
    this.alsoGroupByList.set(true);
    this.subtasksMode.set('Collapsed');
    this.viewDirty.set(false);
    this.saveMenuOpen.set(false);
    this.notifications.info('Changes reset');
  }

  toggleSaveMenu(e: Event) {
    e.stopPropagation();
    this.saveMenuOpen.update(v => !v);
  }

  filteredTypes() {
    const q = this.typeSearch.toLowerCase();
    const types = TASK_TYPES.filter(t => t.id !== 'create-type');
    const createType = TASK_TYPES.find(t => t.id === 'create-type')!;
    const filtered = q ? types.filter(t => t.label.toLowerCase().includes(q)) : types;
    return [...filtered, createType];
  }

  toggleTypeDropdown(e: Event) {
    e.stopPropagation();
    this.typeDropdownOpen.update(v => !v);
    if (this.typeDropdownOpen()) {
      this.typeSearch = '';
      this.typeTab.set('create');
    }
  }

  selectType(t: TaskType) {
    this.typeDropdownOpen.set(false);
    if (t.id !== 'create-type' && t.id !== 'apply-template') {
      this.openInlineAdd(t);
    }
  }

  openFieldsPanel(e: Event) {
    e.stopPropagation();
    this.customizeOpen.set(true);
    this.activePanel.set('fields');
  }

  // ───────────────────────── Inline "Add Task" row ─────────────────────────

  openInlineAdd(type: TaskType = TASK_TYPES[0]) {
    this.groupCollapsed.set(false);
    this.inlineType.set(type);
    this.inlineAddOpen.set(true);
    queueMicrotask(() => this.inlineNameInputRef?.nativeElement?.focus());
  }

  closeInlineAdd() {
    this.inlineAddOpen.set(false);
    this.inlineTaskName.set('');
    this.inlineAssignees.set([]);
    this.inlineDueDate.set(null);
    this.inlineTypeOpen.set(false);
    this.inlineAssigneeOpen.set(false);
    this.inlineDateOpen.set(false);
  }

  saveInlineTask() {
    const name = this.inlineTaskName().trim();
    if (!name) return;
    this.tasks.update(t => [...t, {
      id: this.nextId++,
      name,
      typeId: this.inlineType().id,
      assignees: this.inlineAssignees(),
      dueDate: this.inlineDueDate(),
    }]);
    this.notifications.success('Task created');
    // Stay open for fast successive entry, matching ClickUp's inline-add behaviour.
    this.inlineTaskName.set('');
    this.inlineAssignees.set([]);
    this.inlineDueDate.set(null);
    queueMicrotask(() => this.inlineNameInputRef?.nativeElement?.focus());
  }

  onTaskCreated(task: { name: string }) {
    this.tasks.update(t => [...t, {
      id: this.nextId++, name: task.name, typeId: 'task', assignees: [], dueDate: null,
    }]);
  }

  formatDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ── Row-level type dropdown ──
  toggleInlineTypeDropdown(e: Event) {
    e.stopPropagation();
    this.inlineAssigneeOpen.set(false);
    this.inlineDateOpen.set(false);
    this.inlineTypeOpen.update(v => !v);
    if (this.inlineTypeOpen()) {
      this.inlineTypeSearch = '';
      this.inlineTypeTab.set('create');
    }
  }

  filteredInlineTypes() {
    const q = this.inlineTypeSearch.toLowerCase();
    const types = TASK_TYPES.filter(t => t.id !== 'create-type');
    const createType = TASK_TYPES.find(t => t.id === 'create-type')!;
    const filtered = q ? types.filter(t => t.label.toLowerCase().includes(q)) : types;
    return [...filtered, createType];
  }

  selectInlineType(t: TaskType) {
    this.inlineTypeOpen.set(false);
    if (t.id !== 'create-type' && t.id !== 'apply-template') {
      this.inlineType.set(t);
    }
  }

  // ── Row-level assignee dropdown ──
  toggleInlineAssigneeDropdown(e: Event) {
    e.stopPropagation();
    this.inlineTypeOpen.set(false);
    this.inlineDateOpen.set(false);
    this.inlineAssigneeOpen.update(v => !v);
    if (this.inlineAssigneeOpen()) this.inlineAssigneeSearch = '';
  }

  filteredAssignees(): Assignee[] {
    const q = this.inlineAssigneeSearch.toLowerCase();
    return q ? this.workspaceMembers.filter(m => m.name.toLowerCase().includes(q)) : this.workspaceMembers;
  }

  isInlineAssigned(p: Assignee): boolean {
    return this.inlineAssignees().some(a => a.id === p.id);
  }

  toggleInlineAssignee(p: Assignee) {
    this.inlineAssignees.update(list =>
      list.some(a => a.id === p.id) ? list.filter(a => a.id !== p.id) : [...list, p]);
  }

  // ── Row-level due-date dropdown ──
  toggleInlineDateDropdown(e: Event) {
    e.stopPropagation();
    this.inlineTypeOpen.set(false);
    this.inlineAssigneeOpen.set(false);
    this.inlineDateOpen.update(v => !v);
    if (this.inlineDateOpen()) this.calendarMonth.set(this.startOfMonth(new Date()));
  }

  quickDateOptions() {
    return quickDateOptions(new Date());
  }

  pickInlineDate(d: Date) {
    this.inlineDueDate.set(d);
    this.inlineDateOpen.set(false);
  }

  private startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }

  calendarMonthLabel(): string {
    return this.calendarMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  shiftCalendarMonth(delta: number) {
    const m = this.calendarMonth();
    this.calendarMonth.set(new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  jumpToToday() {
    this.calendarMonth.set(this.startOfMonth(new Date()));
  }

  calendarCells(): { key: string; date: Date; inMonth: boolean; isToday: boolean; isSelected: boolean }[] {
    const month = this.calendarMonth();
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    const today = new Date();
    const selected = this.inlineDueDate();
    const cells: { key: string; date: Date; inMonth: boolean; isToday: boolean; isSelected: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push({
        key: d.toDateString(),
        date: d,
        inMonth: d.getMonth() === month.getMonth(),
        isToday: d.toDateString() === today.toDateString(),
        isSelected: !!selected && d.toDateString() === selected.toDateString(),
      });
    }
    return cells;
  }

  @HostListener('document:click')
  onDocClick() {
    this.typeDropdownOpen.set(false);
    this.inlineTypeOpen.set(false);
    this.inlineAssigneeOpen.set(false);
    this.inlineDateOpen.set(false);
    this.groupMenuOpen.set(false);
  }
}
