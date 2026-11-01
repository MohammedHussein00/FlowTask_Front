import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Search,
  Plus,
  Play,
  Timer,
  Copy,
  UsersRound,
  X,
  DollarSign,
  Tag,
  Clock,
  Archive,
  ArrowUpDown,
  CheckCircle2,
  MoreHorizontal,
  StickyNote,
  Tags,
  Filter,
  Table2,
} from 'lucide-angular';

type TabId = 'my' | 'all' | 'approvals';
type ViewMode = 'timesheet' | 'entries';

interface TimesheetRow {
  id: string;
  name: string;
  status: string;
  statusColor: string;
  location: string;
  hours: Record<string, number>; // keyed by ISO date
}

interface AvailableTask {
  id: string;
  emoji: string;
  name: string;
  status: string;
  statusColor: string;
  breadcrumb: string;
  createdLabel: string;
}

interface PersonRow {
  id: string;
  initials: string;
  name: string;
  sub: string;
  hours: Record<string, number>;
}

interface DayCol {
  date: Date;
  iso: string;
  dow: string;
  label: string;
  isWeekend: boolean;
}

@Component({
  selector: 'app-timesheets',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ft-ts-page">

      <!-- ── Page header / tabs ── -->
      <div class="ft-ts-header">
        <div class="ft-ts-tabs">
          <span class="ft-ts-title">
            <lucide-icon [img]="Timer" [size]="15" />
            Timesheets
          </span>
          <button type="button" class="ft-ts-tab" [class.active]="activeTab() === 'my'" (click)="activeTab.set('my')">My timesheet</button>
          <button type="button" class="ft-ts-tab" [class.active]="activeTab() === 'all'" (click)="activeTab.set('all')">All timesheets</button>
          <button type="button" class="ft-ts-tab" [class.active]="activeTab() === 'approvals'" (click)="activeTab.set('approvals')">Approvals</button>
        </div>

        <button type="button" class="ft-ts-settings-btn">
          <lucide-icon [img]="Settings" [size]="14" />
          Settings
        </button>
      </div>

      <!-- ══════════════ MY TIMESHEET ══════════════ -->
      @if (activeTab() === 'my') {

        <div class="ft-ts-weeknav">
          <div class="ft-ts-weeknav-left">
            <button type="button" class="ft-ts-icon-btn" (click)="prevWeek()">
              <lucide-icon [img]="ChevronLeft" [size]="16" />
            </button>
            <button type="button" class="ft-ts-icon-btn" (click)="nextWeek()">
              <lucide-icon [img]="ChevronRight" [size]="16" />
            </button>
            <button type="button" class="ft-ts-week-label">
              {{ weekRangeLabel() }}
              <lucide-icon [img]="ChevronDown" [size]="14" />
            </button>
          </div>

          <div class="ft-ts-segmented">
            <button type="button" class="ft-ts-seg-btn" [class.active]="viewMode() === 'timesheet'" (click)="viewMode.set('timesheet')">
              <lucide-icon [img]="Table2" [size]="14" />
              Timesheet
            </button>
            <button type="button" class="ft-ts-seg-btn" [class.active]="viewMode() === 'entries'" (click)="viewMode.set('entries')">
              <lucide-icon [img]="Clock" [size]="14" />
              Time entries
            </button>
          </div>
        </div>

        @if (viewMode() === 'entries') {
          <div class="ft-ts-entries-empty">
            <lucide-icon [img]="Clock" [size]="34" />
            <p>No time entries tracked for this week yet.</p>
          </div>
        } @else {

          @if (rows().length === 0) {
            <!-- ── Empty state ── -->
            <div class="ft-ts-body">
              <div class="ft-ts-empty-card">
                <div class="ft-ts-empty-icon">⏱️</div>
                <div class="ft-ts-empty-title">Add entries to this week's timesheet</div>

                <div class="ft-ts-quick-actions">
                  <button type="button" class="ft-ts-quick-btn" (click)="openAddTask()">
                    <span class="ft-ts-quick-ico"><lucide-icon [img]="UsersRound" [size]="15" /></span>
                    All assigned tasks
                  </button>
                  <button type="button" class="ft-ts-quick-btn" (click)="openAddTask()">
                    <span class="ft-ts-quick-ico"><lucide-icon [img]="Copy" [size]="15" /></span>
                    Last week's tasks
                  </button>
                  <button type="button" class="ft-ts-quick-btn" (click)="openAddTask()">
                    <span class="ft-ts-quick-ico"><lucide-icon [img]="Plus" [size]="15" /></span>
                    Individual tasks
                  </button>
                  <button type="button" class="ft-ts-quick-btn" (click)="openTimeEntry()">
                    <span class="ft-ts-quick-ico"><lucide-icon [img]="Timer" [size]="15" /></span>
                    Track time
                  </button>
                </div>
              </div>
            </div>
          } @else {
            <!-- ── Filter bar ── -->
            <div class="ft-ts-filterbar">
              <div class="ft-ts-filters">
                <button type="button" class="ft-ts-filter-chip"><lucide-icon [img]="DollarSign" [size]="13" />Billable status</button>
                <button type="button" class="ft-ts-filter-chip"><lucide-icon [img]="Tag" [size]="13" />Tag</button>
                <button type="button" class="ft-ts-filter-chip"><lucide-icon [img]="Clock" [size]="13" />Tracked time</button>
                <button type="button" class="ft-ts-filter-chip"><lucide-icon [img]="Archive" [size]="13" />Archived tasks</button>
                <button type="button" class="ft-ts-filter-chip"><lucide-icon [img]="ArrowUpDown" [size]="13" />Date added</button>
              </div>
              <label class="ft-ts-toggle-wrap">
                <span>Hide weekends</span>
                <span class="ft-ts-switch" [class.on]="hideWeekends()" (click)="hideWeekends.set(!hideWeekends())">
                  <span class="ft-ts-switch-knob"></span>
                </span>
              </label>
            </div>

            <!-- ── Table ── -->
            <div class="ft-ts-table-wrap">
              <table class="ft-ts-table">
                <thead>
                  <tr>
                    <th class="ft-ts-task-col">Task / Location</th>
                    @for (day of visibleDays(); track day.iso) {
                      <th [class.weekend]="day.isWeekend">
                        <div class="ft-ts-day-head">{{ day.dow }}, {{ day.label }}</div>
                        <div class="ft-ts-day-total">{{ dayTotalLabel(day.iso) }}</div>
                      </th>
                    }
                    <th class="ft-ts-total-col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of rows(); track row.id) {
                    <tr>
                      <td class="ft-ts-task-col">
                        <div class="ft-ts-task-name">{{ row.name }}</div>
                        <div class="ft-ts-task-sub">
                          <span class="ft-ts-status-dot" [style.background]="row.statusColor"></span>
                          {{ row.status }} • {{ row.location }}
                        </div>
                      </td>
                      @for (day of visibleDays(); track day.iso) {
                        <td [class.weekend]="day.isWeekend" class="ft-ts-cell" (click)="openTimeEntry(row, day)">
                          {{ formatHours(hoursFor(row, day.iso)) }}
                        </td>
                      }
                      <td class="ft-ts-total-col">{{ rowTotalLabel(row) }}</td>
                    </tr>
                  }
                  <tr class="ft-ts-grandtotal-row">
                    <td class="ft-ts-task-col">Total</td>
                    @for (day of visibleDays(); track day.iso) {
                      <td [class.weekend]="day.isWeekend">{{ dayTotalLabel(day.iso) }}</td>
                    }
                    <td class="ft-ts-total-col">{{ grandTotalLabel() }}</td>
                  </tr>
                </tbody>
              </table>

              <button type="button" class="ft-ts-add-task-row" (click)="openAddTask()">
                <lucide-icon [img]="Plus" [size]="14" />
                Add task
              </button>
            </div>
          }
        }
      }

      <!-- ══════════════ ALL TIMESHEETS ══════════════ -->
      @if (activeTab() === 'all') {
        <div class="ft-ts-weeknav">
          <div class="ft-ts-weeknav-left">
            <button type="button" class="ft-ts-icon-btn" (click)="prevWeek()">
              <lucide-icon [img]="ChevronLeft" [size]="16" />
            </button>
            <button type="button" class="ft-ts-icon-btn" (click)="nextWeek()">
              <lucide-icon [img]="ChevronRight" [size]="16" />
            </button>
            <button type="button" class="ft-ts-week-label">
              {{ weekRangeLabel() }}
              <lucide-icon [img]="ChevronDown" [size]="14" />
            </button>
          </div>
          <button type="button" class="ft-ts-week-label">
            All members
            <lucide-icon [img]="ChevronDown" [size]="14" />
          </button>
        </div>

        <div class="ft-ts-table-wrap">
          <table class="ft-ts-table">
            <thead>
              <tr>
                <th class="ft-ts-task-col">People ({{ people().length }})</th>
                @for (day of weekDays(); track day.iso) {
                  <th>{{ day.dow }}, {{ day.label }}</th>
                }
                <th class="ft-ts-total-col">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (person of people(); track person.id) {
                <tr>
                  <td class="ft-ts-person-col">
                    <span class="ft-ts-avatar">{{ person.initials }}</span>
                    <div>
                      <div class="ft-ts-task-name">{{ person.name }}</div>
                      <div class="ft-ts-task-sub">{{ person.sub }}</div>
                    </div>
                    <button type="button" class="ft-ts-open-btn">Open →</button>
                  </td>
                  @for (day of weekDays(); track day.iso) {
                    <td>{{ personDayLabel(person, day.iso) }}</td>
                  }
                  <td class="ft-ts-total-col">0h</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ══════════════ APPROVALS ══════════════ -->
      @if (activeTab() === 'approvals') {
        <div class="ft-ts-body">
          <h2 class="ft-ts-approvals-title">Timesheet Approvals</h2>

          <div class="ft-ts-table-wrap">
            <table class="ft-ts-table ft-ts-approvals-table">
              <thead>
                <tr>
                  <th class="ft-ts-task-col">Details</th>
                  <th>Tracked</th>
                  <th>Capacity</th>
                  <th>Billable</th>
                  <th>Over capacity</th>
                  <th>Review</th>
                </tr>
              </thead>
            </table>

            <div class="ft-ts-empty-card ft-ts-approvals-empty">
              <div class="ft-ts-empty-icon ft-ts-empty-icon--check">
                <lucide-icon [img]="CheckCircle2" [size]="26" />
              </div>
              <div class="ft-ts-empty-title">No submissions to review</div>
              <div class="ft-ts-empty-sub">Pending approvals will appear here.</div>
              <button type="button" class="ft-ts-primary-btn">Setup Timesheet approvals</button>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- ══════════════ ADD TASK MODAL ══════════════ -->
    @if (showAddTask()) {
      <div class="ft-ts-overlay" (click)="closeAddTask()"></div>
      <div class="ft-ts-task-picker">
        <div class="ft-ts-picker-search">
          <lucide-icon [img]="Search" [size]="15" />
          <input
            type="text"
            [(ngModel)]="taskSearch"
            placeholder="Search for task name, ID, or URL" />
        </div>

        <div class="ft-ts-picker-tabs">
          <span class="ft-ts-picker-tab active">All Tasks</span>
          <span class="ft-ts-picker-tab">Previous Timesheet</span>
          <span class="ft-ts-picker-filter">
            <lucide-icon [img]="Filter" [size]="13" />
            Filter
          </span>
        </div>

        <div class="ft-ts-picker-list">
          @for (task of filteredAvailableTasks(); track task.id) {
            <label class="ft-ts-picker-item">
              <div class="ft-ts-picker-emoji">{{ task.emoji }}</div>
              <div class="ft-ts-picker-meta">
                <div class="ft-ts-picker-name">{{ task.name }}</div>
                <div class="ft-ts-picker-sub">
                  <span class="ft-ts-status-dot" [style.background]="task.statusColor"></span>
                  {{ task.status }} • {{ task.breadcrumb }} • {{ task.createdLabel }}
                </div>
              </div>
              <input
                type="checkbox"
                [checked]="selectedTaskIds().has(task.id)"
                (change)="toggleTaskSelect(task.id)" />
            </label>
          }
        </div>

        <div class="ft-ts-picker-footer">
          <button type="button" class="ft-ts-cancel-btn" (click)="closeAddTask()">Cancel</button>
          <button type="button" class="ft-ts-primary-btn" [disabled]="selectedTaskIds().size === 0" (click)="confirmAddTasks()">
            Add{{ selectedTaskIds().size > 0 ? ' (' + selectedTaskIds().size + ')' : '' }}
          </button>
        </div>
      </div>
    }

    <!-- ══════════════ TIME ENTRY POPOVER ══════════════ -->
    @if (showTimeEntry()) {
      <div class="ft-ts-overlay" (click)="closeTimeEntry()"></div>
      <div class="ft-ts-time-popover">
        <div class="ft-ts-popover-header">
          <span class="ft-ts-avatar ft-ts-avatar-sm">{{ currentUserInitials }}</span>
          {{ currentUserName }}
          <button type="button" class="ft-ts-icon-btn ft-ts-popover-close" (click)="closeTimeEntry()">
            <lucide-icon [img]="X" [size]="15" />
          </button>
        </div>

        <div class="ft-ts-popover-time-row">
          <input
            type="text"
            class="ft-ts-popover-time-input"
            [(ngModel)]="timeEntryValue"
            placeholder="Enter time (ex: 3h 20m) or start timer" />
          <button type="button" class="ft-ts-popover-play">
            <lucide-icon [img]="Play" [size]="13" />
          </button>
        </div>

        <div class="ft-ts-popover-field">
          <lucide-icon [img]="MoreHorizontal" [size]="15" />
          <span [class.placeholder]="!timeEntryTaskName()">{{ timeEntryTaskName() || 'Select task' }}</span>
        </div>

        <div class="ft-ts-popover-field">
          <lucide-icon [img]="Clock" [size]="15" />
          <span>{{ timeEntryDayLabel() }}</span>
        </div>

        <div class="ft-ts-popover-field">
          <lucide-icon [img]="StickyNote" [size]="15" />
          <input type="text" [(ngModel)]="timeEntryNotes" placeholder="Notes" class="ft-ts-popover-inline-input" />
        </div>

        <div class="ft-ts-popover-field">
          <lucide-icon [img]="Tags" [size]="15" />
          <span class="placeholder">Add tags</span>
        </div>

        <div class="ft-ts-popover-footer">
          <span class="ft-ts-switch" [class.on]="timeEntryBillable()" (click)="timeEntryBillable.set(!timeEntryBillable())">
            <span class="ft-ts-switch-knob"></span>
          </span>
          <button type="button" class="ft-ts-primary-btn" (click)="saveTimeEntry()">Save</button>
        </div>
      </div>
    }
  `,
  styleUrl: './timesheets.component.scss',
})
export class TimesheetsComponent {
  // Icons
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly ChevronDown = ChevronDown;
  readonly Settings = Settings;
  readonly Search = Search;
  readonly Plus = Plus;
  readonly Play = Play;
  readonly Timer = Timer;
  readonly Copy = Copy;
  readonly UsersRound = UsersRound;
  readonly X = X;
  readonly DollarSign = DollarSign;
  readonly Tag = Tag;
  readonly Clock = Clock;
  readonly Archive = Archive;
  readonly ArrowUpDown = ArrowUpDown;
  readonly CheckCircle2 = CheckCircle2;
  readonly MoreHorizontal = MoreHorizontal;
  readonly StickyNote = StickyNote;
  readonly Tags = Tags;
  readonly Filter = Filter;
  readonly Table2 = Table2;

  currentUserName = 'Muhammed Hussein Sophy Mustafa';
  currentUserInitials = 'MM';

  activeTab = signal<TabId>('my');
  viewMode = signal<ViewMode>('timesheet');
  hideWeekends = signal(false);

  private today = new Date();
  weekStart = signal<Date>(this.startOfWeek(this.today));

  rows = signal<TimesheetRow[]>([]);

  showAddTask = signal(false);
  taskSearch = '';
  selectedTaskIds = signal<Set<string>>(new Set());

  showTimeEntry = signal(false);
  timeEntryValue = '';
  timeEntryNotes = '';
  timeEntryBillable = signal(false);
  private timeEntryRowId: string | null = null;
  private timeEntryDayIso: string | null = null;

  availableTasks: AvailableTask[] = [
    { id: 't1', emoji: '🔵', name: 'Task 1', status: 'In Progress', statusColor: '#4da3ff', breadcrumb: 'Team Space / Project 1', createdLabel: 'Aug 29 at 3:57 pm' },
    { id: 't2', emoji: '🎯', name: 'Design a Workflow That Works for You', status: 'To Do', statusColor: '#9aa3af', breadcrumb: 'Team Space / Get Started', createdLabel: 'Aug 18 at 11:06 am' },
    { id: 't3', emoji: '🚀', name: 'Set up Your Tasks in Just 5 Minutes', status: 'To Do', statusColor: '#9aa3af', breadcrumb: 'Team Space / Get Started', createdLabel: 'Aug 18 at 11:06 am' },
    { id: 't4', emoji: '🤝', name: 'Bring Your Team Onboard in Minutes', status: 'To Do', statusColor: '#9aa3af', breadcrumb: 'Team Space / Get Started', createdLabel: 'Aug 18 at 11:06 am' },
    { id: 't5', emoji: '🔗', name: 'Integrate Your Favorite Tools', status: 'To Do', statusColor: '#9aa3af', breadcrumb: 'Team Space / Get Started', createdLabel: 'Aug 18 at 11:06 am' },
    { id: 't6', emoji: '🧠', name: 'Work Smarter with AI', status: 'To Do', statusColor: '#9aa3af', breadcrumb: 'Team Space / Get Started', createdLabel: 'Aug 18 at 11:06 am' },
    { id: 't7', emoji: '📥', name: 'Import Your Work', status: 'To Do', statusColor: '#9aa3af', breadcrumb: 'Team Space / Get Started', createdLabel: 'Aug 18 at 11:06 am' },
  ];

  people = signal<PersonRow[]>([
    { id: 'p1', initials: 'MH', name: 'Mohammed Hussein', sub: '40h', hours: {} },
    { id: 'p2', initials: 'MM', name: 'Muhammed Hussein Sophy Mustafa', sub: '40h', hours: {} },
  ]);

  weekDays = computed<DayCol[]>(() => {
    const start = this.weekStart();
    const days: DayCol[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({
        date: d,
        iso: this.toIso(d),
        dow: d.toLocaleDateString('en-US', { weekday: 'short' }),
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return days;
  });

  visibleDays = computed<DayCol[]>(() =>
    this.hideWeekends() ? this.weekDays().filter(d => !d.isWeekend) : this.weekDays()
  );

  weekRangeLabel = computed(() => {
    const days = this.weekDays();
    const first = days[0].date;
    const last = days[6].date;
    const sameMonth = first.getMonth() === last.getMonth();
    const firstLabel = first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const lastLabel = sameMonth
      ? last.getDate().toString()
      : last.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${firstLabel} - ${lastLabel}`;
  });

  filteredAvailableTasks = computed(() => {
    const q = this.taskSearch.trim().toLowerCase();
    if (!q) return this.availableTasks;
    return this.availableTasks.filter(t => t.name.toLowerCase().includes(q));
  });

  timeEntryTaskName = computed(() => {
    const row = this.rows().find(r => r.id === this.timeEntryRowId);
    return row?.name ?? '';
  });

  timeEntryDayLabel = computed(() => {
    const day = this.weekDays().find(d => d.iso === this.timeEntryDayIso);
    if (!day) return 'Select a date';
    return `${day.dow}, ${day.label}`;
  });

  // ── Week nav ──
  prevWeek() {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() - 7);
    this.weekStart.set(d);
  }
  nextWeek() {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() + 7);
    this.weekStart.set(d);
  }

  // ── Add task modal ──
  openAddTask() {
    this.selectedTaskIds.set(new Set());
    this.taskSearch = '';
    this.showAddTask.set(true);
  }
  closeAddTask() {
    this.showAddTask.set(false);
  }
  toggleTaskSelect(id: string) {
    const next = new Set(this.selectedTaskIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedTaskIds.set(next);
  }
  confirmAddTasks() {
    const existingIds = new Set(this.rows().map(r => r.id));
    const toAdd = this.availableTasks
      .filter(t => this.selectedTaskIds().has(t.id) && !existingIds.has(t.id))
      .map<TimesheetRow>(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        statusColor: t.statusColor,
        location: t.breadcrumb,
        hours: {},
      }));
    this.rows.set([...this.rows(), ...toAdd]);
    this.showAddTask.set(false);
  }

  // ── Time entry popover ──
  openTimeEntry(row?: TimesheetRow, day?: DayCol) {
    this.timeEntryRowId = row?.id ?? null;
    this.timeEntryDayIso = day?.iso ?? this.weekDays()[0].iso;
    const existing = row ? row.hours[this.timeEntryDayIso] : undefined;
    this.timeEntryValue = existing ? this.formatHours(existing) : '';
    this.timeEntryNotes = '';
    this.timeEntryBillable.set(false);
    this.showTimeEntry.set(true);
  }
  closeTimeEntry() {
    this.showTimeEntry.set(false);
  }
  saveTimeEntry() {
    if (!this.timeEntryRowId || !this.timeEntryDayIso) {
      this.showTimeEntry.set(false);
      return;
    }
    const hrs = this.parseDuration(this.timeEntryValue);
    const dayIso = this.timeEntryDayIso;
    this.rows.set(
      this.rows().map(r =>
        r.id === this.timeEntryRowId
          ? { ...r, hours: { ...r.hours, [dayIso]: hrs } }
          : r
      )
    );
    this.showTimeEntry.set(false);
  }

  // ── Helpers ──
  hoursFor(row: TimesheetRow, iso: string): number {
    return row.hours[iso] ?? 0;
  }
  totalForRow(row: TimesheetRow): number {
    return Object.values(row.hours).reduce((a, b) => a + b, 0);
  }
  totalForDay(iso: string): number {
    return this.rows().reduce((sum, r) => sum + (r.hours[iso] ?? 0), 0);
  }
  grandTotal(): number {
    return this.rows().reduce((sum, r) => sum + this.totalForRow(r), 0);
  }

  rowTotalLabel(row: TimesheetRow): string {
    const v = this.totalForRow(row);
    return v === 0 ? '0h' : this.formatHours(v);
  }
  dayTotalLabel(iso: string): string {
    const v = this.totalForDay(iso);
    return v === 0 ? '0h' : this.formatHours(v);
  }
  grandTotalLabel(): string {
    const v = this.grandTotal();
    return v === 0 ? '0h' : this.formatHours(v);
  }
  personDayLabel(person: PersonRow, iso: string): string {
    const v = person.hours[iso] ?? 0;
    return v === 0 ? '0h' : this.formatHours(v);
  }

  formatHours(value: number): string {
    if (!value) return '—';
    const h = Math.floor(value);
    const m = Math.round((value - h) * 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  private parseDuration(input: string): number {
    const str = input.trim().toLowerCase();
    if (!str) return 0;
    const hMatch = str.match(/(\d+(\.\d+)?)\s*h/);
    const mMatch = str.match(/(\d+(\.\d+)?)\s*m/);
    if (hMatch || mMatch) {
      const h = hMatch ? parseFloat(hMatch[1]) : 0;
      const m = mMatch ? parseFloat(mMatch[1]) : 0;
      return h + m / 60;
    }
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  }

  private startOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  private toIso(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
