import { Injectable, signal } from '@angular/core';
import {
  AtSign, Bot, CalendarDays, Clapperboard, ClipboardList, Compass, FileText, Grid2X2, Home, Inbox,
  LayoutDashboard, LayoutGrid, ListChecks, ListTodo, MessageCircle, MessageSquare, PenLine, Reply, Rss, Send,
  Target, Timer, UserPlus, Video, Zap, type LucideIconData,
} from 'lucide-angular';

export type NavDensity = 'icons' | 'icons-labels';

export interface CustomizeItem {
  id: string;
  label: string;
  checked: boolean;
  locked?: boolean;
  hint?: string;
  icon?: LucideIconData;
  route?: string;
}

export interface CustomizeSection {
  id: string;
  label: string;
  hidden: boolean;
}

const STORAGE_KEY = 'flowtask.customize';

interface StoredState {
  navDensity: NavDensity;
  railItems: Record<string, boolean>;
  homeItems: Record<string, boolean>;
  sectionOrder: string[];
  hiddenSections: string[];
}

/** Backs the Customize panel: rail navigation visibility, Home widgets, sidebar section order, and nav density. */
@Injectable({ providedIn: 'root' })
export class WorkspaceCustomizationService {
  readonly navDensity = signal<NavDensity>('icons-labels');

  readonly railItems = signal<CustomizeItem[]>([
    { id: 'home', label: 'Home', checked: true, locked: true, hint: 'Home will show a badge for @mentions, DMs & Inbox', icon: Home, route: '/dashboard' },
    { id: 'spaces', label: 'Spaces', checked: false, icon: LayoutGrid, route: '/all-spaces' },
    { id: 'chat', label: 'Chat', checked: false, icon: MessageCircle, route: '/chat' },
    { id: 'planner', label: 'Planner', checked: true, icon: CalendarDays, route: '/planner' },
    { id: 'ai', label: 'AI', checked: true, icon: Bot, route: '/ai' },
    { id: 'teams', label: 'Teams', checked: true, icon: UserPlus, route: '/teams' },
    { id: 'docs', label: 'Docs', checked: false, icon: FileText, route: '/docs' },
    { id: 'dashboards', label: 'Dashboards', checked: false, icon: LayoutDashboard, route: '/dashboards/new' },
    { id: 'whiteboards', label: 'Whiteboards', checked: false, icon: PenLine, route: '/whiteboards' },
    { id: 'forms', label: 'Forms', checked: false, icon: ClipboardList, route: '/forms' },
    { id: 'clips', label: 'Clips', checked: false, icon: Clapperboard, route: '/clips' },
    { id: 'goals', label: 'Goals', checked: false, icon: Target, route: '/goals' },
    { id: 'timesheets', label: 'Timesheets', checked: false, icon: Timer, route: '/timesheets' },
  ]);

  readonly homeItems = signal<CustomizeItem[]>([
    { id: 'inbox', label: 'Inbox', checked: true, icon: Inbox, route: '/inbox' },
    { id: 'replies', label: 'Replies', checked: true, icon: Reply, route: '/replies' },
    { id: 'assigned-comments', label: 'Assigned Comments', checked: true, icon: MessageSquare, route: '/assigned-comments' },
    { id: 'my-tasks', label: 'My Tasks', checked: true, icon: ListTodo, route: '/my-work' },
    { id: 'skills', label: 'Skills', checked: true, icon: Zap, route: '/skills' },
    { id: 'chat-activity', label: 'Chat Activity', checked: false, icon: AtSign, route: '/chat-activity' },
    { id: 'drafts-sent', label: 'Drafts & Sent', checked: false, icon: Send, route: '/drafts-sent' },
    { id: 'posts', label: 'Posts', checked: false, icon: Rss, route: '/posts' },
    { id: 'meetings', label: 'Meetings', checked: true, icon: Video, route: '/meetings' },
    { id: 'all-channels', label: 'All Channels', checked: false, icon: Grid2X2, route: '/all-channels' },
    { id: 'all-spaces', label: 'All Spaces', checked: false, icon: Compass, route: '/all-spaces' },
    { id: 'all-tasks', label: 'All Tasks', checked: false, icon: ListChecks, route: '/all-tasks' },
  ]);

  readonly sections = signal<CustomizeSection[]>([
    { id: 'ai-chats', label: 'AI Chats', hidden: false },
    { id: 'spaces', label: 'Spaces', hidden: false },
    { id: 'channels', label: 'Channels', hidden: false },
    { id: 'direct-messages', label: 'Direct Messages', hidden: false },
  ]);

  constructor() {
    this.restore();
  }

  setNavDensity(density: NavDensity): void {
    this.navDensity.set(density);
    this.persist();
  }

  toggleRailItem(id: string): void {
    this.railItems.update(items => items.map(item => (item.id === id && !item.locked ? { ...item, checked: !item.checked } : item)));
    this.persist();
  }

  toggleHomeItem(id: string): void {
    this.homeItems.update(items => items.map(item => (item.id === id ? { ...item, checked: !item.checked } : item)));
    this.persist();
  }

  reorderSections(fromIndex: number, toIndex: number): void {
    this.sections.update(sections => {
      const next = [...sections];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    this.persist();
  }

  private persist(): void {
    try {
      const state: StoredState = {
        navDensity: this.navDensity(),
        railItems: Object.fromEntries(this.railItems().map(item => [item.id, item.checked])),
        homeItems: Object.fromEntries(this.homeItems().map(item => [item.id, item.checked])),
        sectionOrder: this.sections().map(section => section.id),
        hiddenSections: this.sections().filter(section => section.hidden).map(section => section.id),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Storage may be unavailable (SSR, private mode) — customization simply won't persist. */
    }
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      if (parsed.navDensity) this.navDensity.set(parsed.navDensity);
      if (parsed.railItems) this.railItems.update(items => items.map(item => ({ ...item, checked: parsed.railItems?.[item.id] ?? item.checked })));
      if (parsed.homeItems) this.homeItems.update(items => items.map(item => ({ ...item, checked: parsed.homeItems?.[item.id] ?? item.checked })));
      if (parsed.sectionOrder?.length) {
        this.sections.update(sections => {
          const byId = new Map(sections.map(section => [section.id, section]));
          const ordered = parsed.sectionOrder!.map(id => byId.get(id)).filter((section): section is CustomizeSection => !!section);
          const missing = sections.filter(section => !parsed.sectionOrder!.includes(section.id));
          return [...ordered, ...missing];
        });
      }
    } catch {
      /* Ignore malformed or inaccessible storage. */
    }
  }
}
