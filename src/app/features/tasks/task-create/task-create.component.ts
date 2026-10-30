import {
  Component, EventEmitter, Output, signal, ElementRef, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X, Maximize2, List, FileText, Bell, Layout, LayoutDashboard,
  ChevronDown, Paperclip, BellRing, Tags, Flag, UserCircle,
  CalendarDays, MoreHorizontal, Zap, Plus,
} from 'lucide-angular';

type ModalTab = 'Task' | 'Doc' | 'Reminder' | 'Whiteboard' | 'Dashboard';

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <!-- Backdrop -->
    <div class="tcm-backdrop" (click)="close.emit()">
      <div class="tcm-panel" (click)="$event.stopPropagation()">

        <!-- ── Header tabs ── -->
        <div class="tcm-header">
          <div class="tcm-header__tabs">
            @for (tab of tabs; track tab) {
              <button
                class="tcm-tab"
                [class.tcm-tab--active]="activeTab() === tab"
                type="button"
                (click)="activeTab.set(tab)">
                <lucide-icon [img]="tabIcon(tab)" size="13" />
                {{ tab }}
              </button>
            }
          </div>
          <div class="tcm-header__actions">
            <button class="tcm-hbtn" type="button" aria-label="Expand">
              <lucide-icon [img]="Maximize2" size="15" />
            </button>
            <button class="tcm-hbtn" type="button" aria-label="Close" (click)="close.emit()">
              <lucide-icon [img]="X" size="15" />
            </button>
          </div>
        </div>

        <!-- ── Sub-header: list selector + task type ── -->
        <div class="tcm-subheader">
          <button class="tcm-pill" type="button">
            <lucide-icon [img]="List" size="13" />
            Select List...
            <lucide-icon [img]="ChevronDown" size="12" />
          </button>
          <button class="tcm-pill" type="button">
            <span class="tcm-status-dot"></span>
            Task
            <lucide-icon [img]="ChevronDown" size="12" />
          </button>
        </div>

        <!-- ── Body ── -->
        <div class="tcm-body">
          <!-- Task name -->
          <input
            #nameInput
            class="tcm-name"
            type="text"
            placeholder="Task Name or type '/' for commands"
            [(ngModel)]="taskName"
            (keydown.enter)="onCreateTask()" />

          <!-- Description -->
          <div class="tcm-desc" contenteditable="true"
            (focus)="descFocused.set(true)"
            (blur)="descFocused.set(false)"
            [class.tcm-desc--focused]="descFocused()">
            <span class="tcm-desc__placeholder" [class.hidden]="descFocused() || hasDesc">
              Add description, or write with
              <lucide-icon [img]="Zap" size="13" class="tcm-ai-icon" /> AI
            </span>
          </div>
        </div>

        <!-- ── Metadata pills ── -->
        <div class="tcm-meta">
          <button class="tcm-meta__pill tcm-meta__pill--status" type="button">
            TO DO
          </button>
          <button class="tcm-meta__pill" type="button">
            <lucide-icon [img]="UserCircle" size="14" />Assignee
          </button>
          <button class="tcm-meta__pill" type="button">
            <lucide-icon [img]="CalendarDays" size="14" />Due date
          </button>
          <button class="tcm-meta__pill" type="button">
            <lucide-icon [img]="Flag" size="14" />Priority
          </button>
          <button class="tcm-meta__pill" type="button">
            <lucide-icon [img]="Tags" size="14" />Tags
          </button>
          <button class="tcm-meta__pill tcm-meta__pill--more" type="button" aria-label="More">
            <lucide-icon [img]="MoreHorizontal" size="14" />
          </button>
        </div>

        <!-- ── Footer ── -->
        <div class="tcm-footer">
          <button class="tcm-footer__templates" type="button">
            <lucide-icon [img]="Zap" size="14" />Templates
          </button>
          <div class="tcm-footer__right">
            <button class="tcm-footer__icon" type="button" aria-label="Attach">
              <lucide-icon [img]="Paperclip" size="15" />
            </button>
            <button class="tcm-footer__icon tcm-footer__icon--remind" type="button" aria-label="Remind">
              <lucide-icon [img]="BellRing" size="15" />
              <span class="tcm-remind-badge">1</span>
            </button>
            <div class="tcm-footer__create-wrap">
              <button
                class="tcm-create-btn"
                type="button"
                [disabled]="!taskName.trim()"
                (click)="onCreateTask()">
                Create Task
              </button>
              <button class="tcm-create-btn tcm-create-btn--caret" type="button">
                <lucide-icon [img]="ChevronDown" size="14" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ── Backdrop ── */
    .tcm-backdrop {
      position: fixed;
      inset: 0;
      z-index: 600;
      background: color-mix(in srgb, #000 45%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    /* ── Panel ── */
    .tcm-panel {
      width: 38rem;
      max-width: 100%;
      display: flex;
      flex-direction: column;
      background: var(--color-surface-1);
      border: 1px solid var(--color-border);
      border-radius: .65rem;
      box-shadow: 0 24px 64px color-mix(in srgb, #000 40%, transparent);
      overflow: hidden;
    }

    /* ── Header ── */
    .tcm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: .1rem .75rem .1rem .35rem;
      border-bottom: 1px solid var(--color-border);
      flex: none;
    }
    .tcm-header__tabs { display: flex; align-items: flex-end; }
    .tcm-tab {
      display: inline-flex;
      align-items: center;
      gap: .28rem;
      height: 2.2rem;
      padding: 0 .65rem;
      border: 0;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: var(--color-text-muted);
      font: inherit;
      font-size: .83rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .tcm-tab:hover { color: var(--color-text-primary); }
    .tcm-tab--active {
      color: var(--color-text-primary) !important;
      border-bottom-color: var(--color-accent) !important;
    }
    .tcm-header__actions { display: flex; align-items: center; gap: .1rem; }
    .tcm-hbtn {
      display: grid;
      place-items: center;
      width: 1.8rem;
      height: 1.8rem;
      border: 0;
      border-radius: .32rem;
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
    }
    .tcm-hbtn:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

    /* ── Sub-header ── */
    .tcm-subheader {
      display: flex;
      align-items: center;
      gap: .45rem;
      padding: .6rem .85rem;
      border-bottom: 1px solid var(--color-border);
      flex: none;
    }
    .tcm-pill {
      display: inline-flex;
      align-items: center;
      gap: .3rem;
      height: 1.75rem;
      padding: 0 .55rem;
      border: 1px solid var(--color-border);
      border-radius: 2rem;
      background: var(--color-surface-2);
      color: var(--color-text-secondary);
      font: inherit;
      font-size: .79rem;
      font-weight: 600;
      cursor: pointer;
    }
    .tcm-pill:hover { border-color: var(--color-border-strong); color: var(--color-text-primary); }
    .tcm-status-dot {
      width: .55rem;
      height: .55rem;
      border-radius: 50%;
      border: 1.5px solid var(--color-text-muted);
      flex: none;
    }

    /* ── Body ── */
    .tcm-body {
      padding: .9rem .85rem .5rem;
      display: flex;
      flex-direction: column;
      gap: .6rem;
      flex: 1;
    }

    .tcm-name {
      width: 100%;
      box-sizing: border-box;
      border: 0;
      background: transparent;
      color: var(--color-text-primary);
      font: inherit;
      font-size: .88rem;
      font-weight: 500;
      outline: 0;
      line-height: 1.5;
    }
    .tcm-name::placeholder { color: var(--color-text-muted); }

    .tcm-desc {
      min-height: 4.5rem;
      position: relative;
      color: var(--color-text-primary);
      font-size: .87rem;
      line-height: 1.55;
      outline: 0;
      cursor: text;
    }
    .tcm-desc__placeholder {
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      align-items: center;
      gap: .25rem;
      color: var(--color-text-muted);
      font-size: .87rem;
      pointer-events: none;
    }
    .tcm-desc__placeholder.hidden { display: none; }
    .tcm-ai-icon { color: var(--color-accent-bright, var(--color-accent)); }

    /* ── Metadata pills row ── */
    .tcm-meta {
      display: flex;
      align-items: center;
      gap: .3rem;
      flex-wrap: wrap;
      padding: .5rem .85rem .6rem;
      border-top: 1px solid var(--color-border);
    }
    .tcm-meta__pill {
      display: inline-flex;
      align-items: center;
      gap: .28rem;
      height: 1.7rem;
      padding: 0 .5rem;
      border: 0;
      border-radius: .35rem;
      background: var(--color-surface-2);
      color: var(--color-text-secondary);
      font: inherit;
      font-size: .78rem;
      font-weight: 600;
      cursor: pointer;
    }
    .tcm-meta__pill:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .tcm-meta__pill--status {
      background: var(--color-surface-3);
      color: var(--color-text-primary);
      font-size: .71rem;
      font-weight: 800;
      letter-spacing: .03em;
    }
    .tcm-meta__pill--more { width: 1.7rem; padding: 0; justify-content: center; }

    /* ── Footer ── */
    .tcm-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: .6rem .85rem .7rem;
      border-top: 1px solid var(--color-border);
      flex: none;
    }
    .tcm-footer__templates {
      display: inline-flex;
      align-items: center;
      gap: .3rem;
      height: 1.9rem;
      padding: 0 .65rem;
      border: 1px solid var(--color-border);
      border-radius: .4rem;
      background: transparent;
      color: var(--color-text-secondary);
      font: inherit;
      font-size: .79rem;
      font-weight: 600;
      cursor: pointer;
    }
    .tcm-footer__templates:hover { background: var(--color-surface-2); }

    .tcm-footer__right { display: flex; align-items: center; gap: .4rem; }
    .tcm-footer__icon {
      position: relative;
      display: grid;
      place-items: center;
      width: 1.8rem;
      height: 1.8rem;
      border: 0;
      border-radius: .35rem;
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
    }
    .tcm-footer__icon:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .tcm-remind-badge {
      position: absolute;
      top: .05rem;
      right: .05rem;
      width: .85rem;
      height: .85rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--color-accent);
      color: #fff;
      font-size: .5rem;
      font-weight: 700;
    }

    /* Create Task button */
    .tcm-footer__create-wrap { display: flex; align-items: stretch; }
    .tcm-create-btn {
      height: 1.95rem;
      padding: 0 .8rem;
      border: 1px solid var(--color-border);
      background: var(--color-surface-2);
      color: var(--color-text-primary);
      font: inherit;
      font-size: .80rem;
      font-weight: 700;
      cursor: pointer;
      border-radius: .38rem 0 0 .38rem;
      white-space: nowrap;
    }
    .tcm-create-btn:hover:not(:disabled) { background: var(--color-surface-3); }
    .tcm-create-btn:disabled { opacity: .45; cursor: default; }
    .tcm-create-btn--caret {
      padding: 0 .4rem;
      border-left: 0;
      border-radius: 0 .38rem .38rem 0;
      display: grid;
      place-items: center;
      width: 1.75rem;
    }
  `],
})
export class TaskCreateComponent {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<{ name: string }>();

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;

  readonly X = X; readonly Maximize2 = Maximize2;
  readonly List = List; readonly ChevronDown = ChevronDown;
  readonly Paperclip = Paperclip; readonly BellRing = BellRing;
  readonly Tags = Tags; readonly Flag = Flag;
  readonly UserCircle = UserCircle; readonly CalendarDays = CalendarDays;
  readonly MoreHorizontal = MoreHorizontal; readonly Zap = Zap;
  readonly FileText = FileText; readonly Bell = Bell;
  readonly Layout = Layout; readonly LayoutDashboard = LayoutDashboard;

  readonly tabs: ModalTab[] = ['Task', 'Doc', 'Reminder', 'Whiteboard', 'Dashboard'];
  readonly activeTab = signal<ModalTab>('Task');
  readonly descFocused = signal(false);

  taskName = '';
  hasDesc = false;

  tabIcon(tab: ModalTab) {
    const map: Record<ModalTab, any> = {
      Task: List,
      Doc: FileText,
      Reminder: Bell,
      Whiteboard: Layout,
      Dashboard: LayoutDashboard,
    };
    return map[tab];
  }

  onCreateTask() {
    if (!this.taskName.trim()) return;
    this.created.emit({ name: this.taskName.trim() });
    this.close.emit();
  }
}
