import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, Injector, afterNextRender,
  computed, effect, inject, signal, viewChild,
} from '@angular/core';
import { Location, NgTemplateOutlet } from '@angular/common';
import {
  LucideAngularModule,
  AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowUpToLine, Bold, ChevronDown, ChevronsUp, Copy,
  Ellipsis, FileText, Flag, Hand, Image as ImageIcon, Italic, Maximize2, Minimize2, Minus, MousePointer2,
  PenLine, Plus, Redo2, Search, Share2, Sparkles, Star, SquareCheckBig, Trash2, Undo2, User, X, Workflow,
} from 'lucide-angular';
import { AuthSessionStore } from '../../core/auth/auth-session.store';
import { SpaceContextService } from '../space/space-context.service';

/* ───────────────────────── Types ───────────────────────── */
type Tool = 'select' | 'hand' | 'pen' | 'shape' | 'arrow' | 'note' | 'text' | 'frame';
type ItemType = 'shape' | 'note' | 'task' | 'text' | 'frame' | 'image' | 'arrow' | 'pen';
type Kind = 'rect' | 'ellipse' | 'triangle' | 'diamond' | 'parallelogram' | 'trapezoid' | 'hexagon' | 'cloud' | 'star'
  | 'pentagon' | 'octagon' | 'cross' | 'heart' | 'bubble' | 'rarrow';
type FontSize = 'S' | 'M' | 'L' | 'XL';
type Dash = 'solid' | 'dashed' | 'dotted';
type Align = 'left' | 'center' | 'right';
type Font = 'sans' | 'hand' | 'mono';
type Curve = 'straight' | 'curve' | 'elbow';

interface Style {
  fill: string; stroke: string; dash: Dash; sw: number;
  fs: FontSize; bold: boolean; italic: boolean; align: Align; ff: Font;
  kind: Kind; cur: Curve; head: boolean;
}
interface Item extends Style {
  id: number; type: ItemType;
  x: number; y: number; w: number; h: number;
  x2: number; y2: number;            // arrow end (world)
  pts: number[][];                   // pen points relative to x/y
  text: string;
  status: string; crumb: string; assignee: string; src: string;
}
interface View { x: number; y: number; z: number; }
interface Box { x: number; y: number; w: number; h: number; }
interface Drag {
  mode: 'pan' | 'move' | 'resize' | 'size' | 'arrow' | 'pen' | 'endpoint' | 'marquee';
  cx: number; cy: number; wx: number; wy: number;
  id?: number; handle?: string; end?: string; shift?: boolean;
  snaps?: Map<number, Item>; view0?: View; moved?: boolean; box0?: Box;
}
interface TaskRef { title: string; status: string; list: string; }

/* ───────────────────────── Constants ───────────────────────── */
const STORAGE_KEY = 'flowtask.whiteboard.v2';
const PALETTE = ['ink', '#ff5a5f', '#ff9f43', '#ffd666', '#43d17a', '#2dd4bf', '#4c8dff', '#a78bfa', '#f472b6', '#8b8fa3'];
const NOTE_PALETTE = ['#ffd666', '#ff9ec7', '#8ec5ff', '#8fe3a7', '#c4a7ff', '#ffb27a', '#ffffff', '#c9ccd6'];
const FS_PX: Record<FontSize, number> = { S: 14, M: 18, L: 26, XL: 40 };
const FS_LABEL: Record<FontSize, string> = { S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra large' };
const FF_CSS: Record<Font, string> = {
  sans: 'var(--font-sans, Inter, system-ui, sans-serif)',
  hand: "'Caveat', 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};
const FF_LABEL: Record<Font, string> = { sans: 'Sans serif', hand: 'Handwriting', mono: 'Monospace' };
const MAIN_KINDS: Kind[] = ['rect', 'ellipse', 'triangle', 'diamond', 'parallelogram', 'trapezoid', 'hexagon', 'cloud', 'star'];
const MORE_KINDS: Kind[] = ['pentagon', 'octagon', 'cross', 'heart', 'bubble', 'rarrow'];
const STATUSES = ['TO DO', 'IN PROGRESS', 'COMPLETE'];
const STATUS_COLOR: Record<string, string> = { 'TO DO': '#6b7086', 'IN PROGRESS': '#1a73e8', 'COMPLETE': '#2ea043' };
const WIDTHS = [2, 3, 5, 8];
const PEN_WIDTHS = [3, 5, 8, 14];

const BASE: Style = {
  fill: 'none', stroke: 'ink', dash: 'solid', sw: 3, fs: 'M', bold: false, italic: false,
  align: 'center', ff: 'sans', kind: 'rect', cur: 'straight', head: true,
};
const RECENT_TASKS: TaskRef[] = [
  { title: 'Task 1', status: 'IN PROGRESS', list: 'Project 1' },
  { title: 'Work smarter with AI', status: 'TO DO', list: 'Project 1' },
  { title: 'Bring your team onboard in minutes', status: 'TO DO', list: 'Project 1' },
  { title: 'Integrate your favorite tools', status: 'TO DO', list: 'Project 1' },
  { title: 'Design a workflow that works for you', status: 'TO DO', list: 'Project 1' },
  { title: 'Set up your tasks in just 5 minutes', status: 'COMPLETE', list: 'Project 1' },
];
const RECENT_DOCS = ['Product roadmap', 'Meeting notes', 'Team handbook', 'Launch checklist'];

function poly(pts: number[][], w: number, h: number): string {
  return 'M' + pts.map(p => `${p[0] * w} ${p[1] * h}`).join(' L') + ' Z';
}
const STAR_PTS = Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? 0.22 : 0.5;
  return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)];
});

function shapeD(kind: Kind, w: number, h: number): string {
  switch (kind) {
    case 'ellipse': return `M0 ${h / 2} A${w / 2} ${h / 2} 0 1 0 ${w} ${h / 2} A${w / 2} ${h / 2} 0 1 0 0 ${h / 2} Z`;
    case 'triangle': return poly([[.5, 0], [1, 1], [0, 1]], w, h);
    case 'diamond': return poly([[.5, 0], [1, .5], [.5, 1], [0, .5]], w, h);
    case 'parallelogram': return poly([[.22, 0], [1, 0], [.78, 1], [0, 1]], w, h);
    case 'trapezoid': return poly([[.2, 0], [.8, 0], [1, 1], [0, 1]], w, h);
    case 'hexagon': return poly([[.25, 0], [.75, 0], [1, .5], [.75, 1], [.25, 1], [0, .5]], w, h);
    case 'pentagon': return poly([[.5, 0], [1, .38], [.81, 1], [.19, 1], [0, .38]], w, h);
    case 'octagon': return poly([[.29, 0], [.71, 0], [1, .29], [1, .71], [.71, 1], [.29, 1], [0, .71], [0, .29]], w, h);
    case 'cross': return poly([[.33, 0], [.67, 0], [.67, .33], [1, .33], [1, .67], [.67, .67], [.67, 1], [.33, 1], [.33, .67], [0, .67], [0, .33], [.33, .33]], w, h);
    case 'star': return poly(STAR_PTS, w, h);
    case 'rarrow': return poly([[0, .3], [.6, .3], [.6, 0], [1, .5], [.6, 1], [.6, .7], [0, .7]], w, h);
    case 'cloud':
      return `M${.25 * w} ${.85 * h} C${-.06 * w} ${.85 * h} ${-.06 * w} ${.45 * h} ${.22 * w} ${.45 * h} C${.2 * w} ${.08 * h} ${.58 * w} ${-.02 * h} ${.64 * w} ${.3 * h} C${.8 * w} ${.1 * h} ${1.06 * w} ${.28 * h} ${.92 * w} ${.52 * h} C${1.08 * w} ${.62 * h} ${1.04 * w} ${.88 * h} ${.78 * w} ${.85 * h} Z`;
    case 'heart':
      return `M${.5 * w} ${.95 * h} C${-.25 * w} ${.45 * h} ${.12 * w} ${-.08 * h} ${.5 * w} ${.28 * h} C${.88 * w} ${-.08 * h} ${1.25 * w} ${.45 * h} ${.5 * w} ${.95 * h} Z`;
    case 'bubble': {
      const r = Math.min(12, w / 4, h / 4); const b = h * 0.78;
      return `M${r} 0 H${w - r} Q${w} 0 ${w} ${r} V${b - r} Q${w} ${b} ${w - r} ${b} H${.42 * w} L${.24 * w} ${h} L${.28 * w} ${b} H${r} Q0 ${b} 0 ${b - r} V${r} Q0 0 ${r} 0 Z`;
    }
    default: {
      const r = Math.min(10, w / 3, h / 3);
      return `M${r} 0 H${w - r} Q${w} 0 ${w} ${r} V${h - r} Q${w} ${h} ${w - r} ${h} H${r} Q0 ${h} 0 ${h - r} V${r} Q0 0 ${r} 0 Z`;
    }
  }
}

const keyOfType = (t: ItemType | Tool): string =>
  t === 'task' || t === 'image' || t === 'select' || t === 'hand' ? 'shape' : t;

/* ───────────────────────── Component ───────────────────────── */
@Component({
  selector: 'app-whiteboard-editor',
  standalone: true,
  imports: [LucideAngularModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wb" [class.wb--dragging]="dragging()">

      <!-- ═════════ Canvas ═════════ -->
      <div #canvas tabindex="-1" [class]="'wb-canvas wb-cursor-' + cursor()"
           [style.background-size]="gridSize()" [style.background-position]="view().x + 'px ' + view().y + 'px'"
           (pointerdown)="onPointerDown($event)" (pointermove)="onPointerMove($event)"
           (pointerup)="onPointerUp($event)" (pointercancel)="onPointerUp($event)"
           (dblclick)="onDblClick($event)" (wheel)="onWheel($event)">

        <div class="wb-world" [style.transform]="worldTransform()" [style.--z]="view().z">
          <svg class="wb-svg" width="1" height="1">
            <defs>
              <marker id="wb-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M1 1 L9 5 L1 9" fill="none" stroke="context-stroke" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </marker>
            </defs>
            @for (it of svgItems(); track it.id) {
              @switch (it.type) {
                @case ('frame') {
                  <rect class="wb-frame" [attr.data-id]="it.id" [attr.x]="it.x" [attr.y]="it.y" [attr.width]="it.w" [attr.height]="it.h" rx="14"
                        [attr.fill]="it.fill === 'none' ? 'var(--color-surface-1)' : col(it.fill)" [attr.fill-opacity]="it.fill === 'none' ? .55 : .25"
                        stroke="var(--color-border-strong)" stroke-width="1.5" />
                }
                @case ('shape') {
                  <path class="wb-shape" [attr.data-id]="it.id" [attr.transform]="'translate(' + it.x + ' ' + it.y + ')'" [attr.d]="kindPath(it)"
                        [attr.fill]="it.fill === 'none' ? 'transparent' : col(it.fill)" [attr.stroke]="col(it.stroke)" [attr.stroke-width]="it.sw"
                        [attr.stroke-dasharray]="dashArray(it)" stroke-linejoin="round" stroke-linecap="round" />
                }
                @case ('arrow') {
                  <g [style.color]="col(it.stroke)">
                    <path class="wb-hit" [attr.data-id]="it.id" [attr.d]="arrowPath(it)" fill="none" stroke="transparent" stroke-width="18" />
                    <path class="wb-stroke" [attr.d]="arrowPath(it)" fill="none" stroke="currentColor" [attr.stroke-width]="it.sw" stroke-linecap="round" stroke-linejoin="round"
                          [attr.stroke-dasharray]="dashArray(it)" [attr.marker-end]="it.head ? 'url(#wb-head)' : null" />
                  </g>
                }
                @case ('pen') {
                  <g [attr.transform]="'translate(' + it.x + ' ' + it.y + ')'" [style.color]="col(it.stroke)">
                    <path class="wb-hit" [attr.data-id]="it.id" [attr.d]="penPath(it)" fill="none" stroke="transparent" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
                    <path class="wb-stroke" [attr.d]="penPath(it)" fill="none" stroke="currentColor" [attr.stroke-width]="it.sw" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                }
              }
            }
          </svg>

          @for (it of htmlItems(); track it.id) {
            <div [class]="'wb-item wb-item--' + it.type + (editingId() === it.id ? ' is-editing' : '')" [attr.data-id]="it.id"
                 [style.left.px]="it.x" [style.top.px]="it.type === 'frame' ? it.y - 30 : it.y"
                 [style.width.px]="it.w" [style.height.px]="it.type === 'frame' ? 26 : it.h"
                 [style.background]="it.type === 'note' ? col(it.fill) : null"
                 [style.color]="textColor(it)" [style.font-size.px]="fsPx(it)"
                 [style.font-weight]="it.bold ? 700 : 500" [style.font-style]="it.italic ? 'italic' : 'normal'"
                 [style.text-align]="it.align" [style.font-family]="ffCss(it)">
              @switch (it.type) {
                @case ('image') { <img class="wb-img" [src]="it.src" alt="" draggable="false" /> }
                @case ('task') {
                  <div class="wb-card">
                    <div class="wb-card__crumb">@for (c of crumbParts(it); track $index) { <span>{{ c }}</span> }</div>
                    @if (editingId() === it.id) {
                      <textarea class="wb-edit wb-card__title" rows="1" [value]="it.text" placeholder="Task name"
                                (input)="setText(it.id, $any($event.target).value)" (blur)="endEdit()" (keydown.escape)="endEdit()"
                                (keydown.enter)="$event.preventDefault(); endEdit()" (pointerdown)="$event.stopPropagation()"></textarea>
                    } @else { <div class="wb-card__title">{{ it.text }}</div> }
                    <div class="wb-card__row">
                      @if (it.status) {
                        <button type="button" class="wb-pill" [style.background]="statusColor(it.status)" (pointerdown)="$event.stopPropagation()" (click)="cycleStatus(it.id)">{{ it.status }}</button>
                      }
                      <span class="wb-card__flag"><lucide-icon [img]="Flag" size="14" /></span>
                      <span class="wb-avatar wb-avatar--sm">{{ initials() }}</span>
                    </div>
                  </div>
                }
                @default {
                  @if (editingId() === it.id) {
                    <textarea class="wb-edit" [value]="it.text" [placeholder]="it.type === 'frame' ? 'Frame name' : 'Type something'"
                              (input)="setText(it.id, $any($event.target).value)" (blur)="endEdit()" (keydown.escape)="endEdit()"
                              (pointerdown)="$event.stopPropagation()"></textarea>
                  } @else { <div class="wb-text">{{ it.text }}</div> }
                }
              }
            </div>
          }

          @if (marquee(); as m) {
            <div class="wb-marquee" [style.left.px]="m.x" [style.top.px]="m.y" [style.width.px]="m.w" [style.height.px]="m.h"></div>
          }

          @if (selBox(); as b) {
            @if (!singleArrow()) {
              <div class="wb-sel" [style.left.px]="b.x - 4" [style.top.px]="b.y - 4" [style.width.px]="b.w + 8" [style.height.px]="b.h + 8">
                @if (canResize()) {
                  <span class="wb-handle wb-handle--nw" data-handle="nw"></span><span class="wb-handle wb-handle--ne" data-handle="ne"></span>
                  <span class="wb-handle wb-handle--sw" data-handle="sw"></span><span class="wb-handle wb-handle--se" data-handle="se"></span>
                }
                @if (canAnchor()) {
                  <span class="wb-anchor wb-anchor--n" data-anchor="n"></span><span class="wb-anchor wb-anchor--e" data-anchor="e"></span>
                  <span class="wb-anchor wb-anchor--s" data-anchor="s"></span><span class="wb-anchor wb-anchor--w" data-anchor="w"></span>
                }
              </div>
            }
          }
          @if (singleArrow(); as a) {
            <span class="wb-end" data-end="1" [style.left.px]="a.x" [style.top.px]="a.y"></span>
            <span class="wb-end" data-end="2" [style.left.px]="a.x2" [style.top.px]="a.y2"></span>
          }
        </div>

        @if (showHints()) {
          <div class="wb-hints" aria-hidden="true">
            <div class="wb-hint wb-hint--rename">
              <svg width="46" height="64" viewBox="0 0 46 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M34 60 C 40 42, 30 20, 14 8"/><path d="M12 22 L14 8 L26 14"/></svg>
              <span>Rename your canvas</span>
            </div>
            <div class="wb-hint wb-hint--share">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 44 C 28 46, 46 34, 48 8"/><path d="M38 14 L48 6 L52 18"/></svg>
              <span>Share, collaborate and<br>chat with your team</span>
            </div>
            <div class="wb-hero">
              <div class="wb-hero__card wb-hero__card--back"></div>
              <div class="wb-hero__card wb-hero__card--front">
                <i class="wb-hero__h wb-hero__h--tl"></i><i class="wb-hero__h wb-hero__h--tr"></i>
                <i class="wb-hero__h wb-hero__h--bl"></i><i class="wb-hero__h wb-hero__h--br"></i>
                <b>Whiteboards</b>
              </div>
              <p>Follow the
                <svg width="60" height="22" viewBox="0 0 60 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6 C 18 24, 40 22, 56 10"/><path d="M46 8 L56 10 L50 18"/></svg>
                to take a tour.<br>Brainstorm, diagram, plan and more!</p>
            </div>
            <div class="wb-hint wb-hint--add">
              <span>Add <em class="wb-hint__chip"><lucide-icon [img]="TaskIcon" size="16" /></em> <u>tasks</u>, drawings,<br>shapes and more</span>
              <svg width="20" height="64" viewBox="0 0 20 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2 L10 58"/><path d="M3 50 L10 60 L17 50"/></svg>
            </div>
            <div class="wb-hint wb-hint--tpl">
              <span>Start with a template <i class="wb-hint__star">★</i></span>
              <svg width="40" height="64" viewBox="0 0 40 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M32 2 L10 56"/><path d="M8 44 L10 58 L22 52"/></svg>
            </div>
            <div class="wb-hint wb-hint--zoom">
              <svg width="56" height="52" viewBox="0 0 56 52" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M50 6 C 24 2, 12 18, 10 44"/><path d="M2 36 L10 48 L20 38"/></svg>
              <span>Zoom controls</span>
            </div>
          </div>
        }
      </div>

      <!-- ═════════ Title (top-left) ═════════ -->
      <div class="wb-title">
        <span class="wb-title__icon"><lucide-icon [img]="PenLine" size="13" /></span>
        <input class="wb-title__input" aria-label="Whiteboard name" [value]="title()" [style.width.ch]="titleWidth()"
               (input)="title.set($any($event.target).value)" (keydown.enter)="$any($event.target).blur()" />
        <button type="button" class="wb-icon-btn" [class.wb-icon-btn--on]="starred()" aria-label="Favorite" (click)="starred.set(!starred())">
          <lucide-icon [img]="Star" size="15" />
        </button>
      </div>

      <!-- ═════════ Actions (top-right) ═════════ -->
      <div class="wb-actions">
        <span class="wb-avatar">{{ initials() }}</span>
        <button type="button" class="wb-share" (click)="share()"><lucide-icon [img]="Share2" size="14" />Share</button>
        <div class="wb-ctl">
          <button type="button" class="wb-icon-btn" aria-label="More" (click)="toggleMenu('top')"><lucide-icon [img]="Ellipsis" size="16" /></button>
          @if (menu() === 'top') {
            <div class="wb-drop wb-drop--down wb-drop--right" role="menu">
              <button type="button" (click)="zoomFit(); closeMenu()">Zoom to fit</button>
              <button type="button" (click)="resetZoom(); closeMenu()">Reset zoom to 100%</button>
              <hr />
              <button type="button" class="wb-danger" (click)="clearAll(); closeMenu()">Clear canvas</button>
            </div>
          }
        </div>
        <button type="button" class="wb-icon-btn" aria-label="Fullscreen" (click)="toggleFullscreen()">
          <lucide-icon [img]="fullscreen() ? MinimizeIcon : MaximizeIcon" size="15" />
        </button>
        <button type="button" class="wb-icon-btn" aria-label="Close" (click)="close()"><lucide-icon [img]="XIcon" size="16" /></button>
      </div>

      <!-- ═════════ Zoom (bottom-left) ═════════ -->
      <div class="wb-zoom">
        <button type="button" class="wb-icon-btn" aria-label="Zoom to fit" (click)="zoomFit()"><lucide-icon [img]="ChevronsUp" size="15" /></button>
        <span class="wb-zoom__sep"></span>
        <button type="button" class="wb-icon-btn" aria-label="Zoom out" (click)="zoomBy(1 / 1.2)"><lucide-icon [img]="Minus" size="15" /></button>
        <button type="button" class="wb-zoom__pct" aria-label="Reset zoom" (click)="resetZoom()">{{ zoomPct() }}%</button>
        <button type="button" class="wb-icon-btn" aria-label="Zoom in" (click)="zoomBy(1.2)"><lucide-icon [img]="Plus" size="15" /></button>
      </div>

      @if (menu()) { <div class="wb-backdrop" (click)="closeMenu()"></div> }

      <!-- ═════════ Floating format bar (selection) ═════════ -->
      @if (showFormat()) {
        <div class="wb-panel wb-fmt" [style.left.px]="fmtPos().x" [style.top.px]="fmtPos().y" (pointerdown)="$event.stopPropagation()">
          @if (subject() === 'shape') {
            <div class="wb-ctl">
              <button type="button" class="wb-chip" aria-label="Shape" (click)="toggleMenu('f:kinds')">
                <svg viewBox="0 0 20 20" width="18" height="18"><path [attr.d]="kindPreview(sty().kind)" transform="translate(2 2)" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg>
                <lucide-icon [img]="Chevron" size="12" />
              </button>
              @if (menu() === 'f:kinds') {
                <div class="wb-drop wb-drop--down wb-drop--kinds">
                  @for (k of allKinds; track k) {
                    <button type="button" class="wb-kind" [class.on]="sty().kind === k" (click)="applyStyle({ kind: k }); closeMenu()">
                      <svg viewBox="0 0 20 20" width="22" height="22"><path [attr.d]="kindPreview(k)" transform="translate(2 2)" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg>
                    </button>
                  }
                </div>
              }
            </div>
          }
          @if (subject() === 'shape' || subject() === 'note' || subject() === 'text') {
            <button type="button" class="wb-chip wb-chip--task" (click)="convertToTask()"><lucide-icon [img]="TaskIcon" size="14" />Task</button>
            <span class="wb-sep"></span>
          }
          <ng-container [ngTemplateOutlet]="ctrls" [ngTemplateOutletContext]="{ $implicit: 'f' }" />
          <span class="wb-sep"></span>
          <div class="wb-ctl">
            <button type="button" class="wb-icon-btn" aria-label="More options" (click)="toggleMenu('f:more')"><lucide-icon [img]="Ellipsis" size="16" /></button>
            @if (menu() === 'f:more') {
              <div class="wb-drop wb-drop--down wb-drop--right" role="menu">
                <button type="button" (click)="duplicate(); closeMenu()"><lucide-icon [img]="CopyIcon" size="14" />Duplicate</button>
                <button type="button" (click)="reorder('front'); closeMenu()"><lucide-icon [img]="ToFront" size="14" />Bring to front</button>
                <button type="button" (click)="reorder('back'); closeMenu()"><lucide-icon [img]="ToBack" size="14" />Send to back</button>
                <hr />
                <button type="button" class="wb-danger" (click)="deleteSelected(); closeMenu()"><lucide-icon [img]="Trash2" size="14" />Delete</button>
              </div>
            }
          </div>
        </div>
      }

      <!-- ═════════ Dock ═════════ -->
      <div class="wb-dock" (pointerdown)="$event.stopPropagation()">

        @if (taskOpen()) {
          <div class="wb-picker" role="dialog" aria-label="Add a task or doc">
            <div class="wb-picker__tabs">
              <button type="button" [class.on]="taskTab() === 'tasks'" (click)="taskTab.set('tasks')"><lucide-icon [img]="TaskIcon" size="14" />Tasks</button>
              <button type="button" [class.on]="taskTab() === 'docs'" (click)="taskTab.set('docs')"><lucide-icon [img]="DocIcon" size="14" />Docs</button>
            </div>
            <label class="wb-picker__search">
              <lucide-icon [img]="SearchIcon" size="16" />
              <input #pickerInput [value]="taskQuery()" (input)="taskQuery.set($any($event.target).value)"
                     [placeholder]="taskTab() === 'tasks' ? 'Search for task name, ID, or URL' : 'Search docs'" />
            </label>
            <div class="wb-picker__head"><span>Recent</span><button type="button" (click)="showToast('Browsing tasks is available once tasks are connected')">Browse {{ taskTab() }}</button></div>
            <div class="wb-picker__list">
              @if (taskTab() === 'tasks') {
                @for (t of filteredTasks(); track t.title) {
                  <button type="button" class="wb-picker__row" (click)="insertTask(t)">
                    <span class="wb-radio" [style.borderColor]="statusColor(t.status)"><i [style.background]="t.status === 'TO DO' ? 'transparent' : statusColor(t.status)"></i></span>
                    <span class="wb-picker__title">{{ t.title }}</span>
                    <span class="wb-avatar wb-avatar--sm">{{ initials() }}</span>
                  </button>
                } @empty { <p class="wb-picker__empty">No matching tasks</p> }
              } @else {
                @for (d of filteredDocs(); track d) {
                  <button type="button" class="wb-picker__row" (click)="insertDoc(d)">
                    <lucide-icon [img]="DocIcon" size="16" /><span class="wb-picker__title">{{ d }}</span>
                  </button>
                } @empty { <p class="wb-picker__empty">No matching docs</p> }
              }
            </div>
            <button type="button" class="wb-picker__new" (click)="createTaskCard()"><lucide-icon [img]="Plus" size="16" />Create new</button>
          </div>
        }

        @if (tplOpen()) {
          <div class="wb-drop wb-drop--up wb-drop--tpl" role="menu">
            <b>Templates</b>
            <button type="button" (click)="applyTemplate('brainstorm')">Brainstorm</button>
            <button type="button" (click)="applyTemplate('flow')">Flowchart</button>
            <button type="button" (click)="applyTemplate('kanban')">Kanban</button>
          </div>
        }

        @if (showDockPanel()) {
          <div class="wb-panel wb-dockpanel">
            @if (tool() === 'shape') {
              <div class="wb-kinds">
                @for (k of mainKinds; track k) {
                  <button type="button" class="wb-kind" [class.on]="sty().kind === k" [attr.aria-label]="k" (click)="applyStyle({ kind: k })">
                    <svg viewBox="0 0 20 20" width="22" height="22"><path [attr.d]="kindPreview(k)" transform="translate(2 2)" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg>
                  </button>
                }
                <div class="wb-ctl">
                  <button type="button" class="wb-chip" (click)="toggleMenu('d:kinds')">More shapes</button>
                  @if (menu() === 'd:kinds') {
                    <div class="wb-drop wb-drop--up wb-drop--kinds">
                      @for (k of moreKinds; track k) {
                        <button type="button" class="wb-kind" [class.on]="sty().kind === k" (click)="applyStyle({ kind: k }); closeMenu()">
                          <svg viewBox="0 0 20 20" width="22" height="22"><path [attr.d]="kindPreview(k)" transform="translate(2 2)" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg>
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
              <span class="wb-sep"></span>
            }
            <ng-container [ngTemplateOutlet]="ctrls" [ngTemplateOutletContext]="{ $implicit: 'd' }" />
          </div>
        }

        <div class="wb-toolbar" role="toolbar" aria-label="Whiteboard tools">
          <div class="wb-tool wb-tool--small">
            <span class="wb-tool__key">V</span>
            <button type="button" class="wb-sbtn" [class.on]="tool() === 'select'" aria-label="Select (V)" title="Select (V)" (click)="setTool('select')"><lucide-icon [img]="Pointer" size="20" /></button>
          </div>
          <div class="wb-tool wb-tool--small">
            <span class="wb-tool__key">H</span>
            <button type="button" class="wb-sbtn" [class.on]="tool() === 'hand'" aria-label="Pan (H)" title="Pan (H)" (click)="setTool('hand')"><lucide-icon [img]="HandIcon" size="20" /></button>
          </div>

          <div class="wb-tool wb-tool--wide">
            <span class="wb-tool__key">⇧ T</span>
            <button type="button" class="wb-tile" [class.on]="taskOpen()" aria-label="Task card (Shift+T)" title="Task card (Shift+T)" (click)="toggleTask()">
              <span class="wb-art-task"><span class="wb-art-task__t"><lucide-icon [img]="TaskIcon" size="11" />Task</span><i class="a"></i><i class="b"></i></span>
            </button>
          </div>
          <div class="wb-tool">
            <span class="wb-tool__key">D</span>
            <button type="button" class="wb-tile" [class.on]="tool() === 'pen'" aria-label="Draw (D)" title="Draw (D)" (click)="setTool('pen')">
              <svg class="wb-art" width="30" height="64" viewBox="0 0 30 64"><path d="M15 2 L24 30 V64 H6 V30 Z" fill="#f2f2f2"/><path d="M15 2 L19 15 H11 Z" fill="#111"/><path d="M6 36 H24" stroke="#bbb" stroke-width="2"/></svg>
            </button>
          </div>
          <div class="wb-tool">
            <span class="wb-tool__key">R</span>
            <button type="button" class="wb-tile" [class.on]="tool() === 'shape'" aria-label="Shapes (R)" title="Shapes (R)" (click)="setTool('shape')">
              <span class="wb-art-rect"></span>
            </button>
          </div>
          <div class="wb-tool">
            <span class="wb-tool__key">A</span>
            <button type="button" class="wb-tile" [class.on]="tool() === 'arrow'" aria-label="Arrow (A)" title="Arrow (A)" (click)="setTool('arrow')">
              <svg class="wb-art" width="34" height="64" viewBox="0 0 34 64"><path d="M17 62 V6 M6 20 L17 4 L28 20" fill="none" stroke="#f2f2f2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <div class="wb-tool">
            <span class="wb-tool__key">N</span>
            <button type="button" class="wb-tile" [class.on]="tool() === 'note'" aria-label="Sticky note (N)" title="Sticky note (N)" (click)="setTool('note')">
              <span class="wb-art-note"></span>
            </button>
          </div>
          <div class="wb-tool">
            <span class="wb-tool__key">T</span>
            <button type="button" class="wb-tile" [class.on]="tool() === 'text'" aria-label="Text (T)" title="Text (T)" (click)="setTool('text')">
              <span class="wb-art-text">T</span>
            </button>
          </div>
          <div class="wb-tool">
            <span class="wb-tool__key">F</span>
            <button type="button" class="wb-tile" [class.on]="tool() === 'frame'" aria-label="Frame (F)" title="Frame (F)" (click)="setTool('frame')">
              <span class="wb-art-frame"></span>
            </button>
          </div>
          <div class="wb-tool">
            <span class="wb-tool__key">&nbsp;</span>
            <button type="button" class="wb-tile" aria-label="Image" title="Image" (click)="pickImage()">
              <span class="wb-art-img"></span>
            </button>
          </div>
          <div class="wb-tool wb-tool--wide">
            <span class="wb-tool__key">&nbsp;</span>
            <button type="button" class="wb-tile" [class.on]="tplOpen()" aria-label="Templates" title="Templates" (click)="toggleTpl()">
              <svg class="wb-art" width="76" height="64" viewBox="0 0 76 64" fill="none" stroke="#9aa0b8" stroke-width="1.6">
                <path d="M8 14 L18 6 H64 L70 14 V64 H8 Z" fill="#1d1f2b"/>
                <rect x="16" y="26" width="9" height="9" rx="2" fill="#7b68ee" stroke="none"/><rect x="34" y="20" width="14" height="8" rx="3" fill="#ff7bac" stroke="none"/>
                <rect x="34" y="34" width="14" height="8" rx="3" fill="#43d17a" stroke="none"/><path d="M26 30 H34 M26 31 L34 24 M26 31 L34 38"/>
                <rect x="54" y="28" width="9" height="9" rx="4.5" fill="#4c8dff" stroke="none"/><path d="M48 24 H58 V28 M48 38 H58 V37"/>
              </svg>
            </button>
          </div>
          <div class="wb-tool">
            <span class="wb-tool__key">&nbsp;</span>
            <button type="button" class="wb-tile" aria-label="Generate with AI" title="Generate with AI" (click)="showToast('AI whiteboards are coming soon')">
              <span class="wb-art-ai"><lucide-icon [img]="SparkIcon" size="22" /></span>
            </button>
          </div>

          <div class="wb-history">
            <button type="button" class="wb-icon-btn" aria-label="Undo" [disabled]="!canUndo()" (click)="undo()"><lucide-icon [img]="Undo" size="16" /></button>
            <button type="button" class="wb-icon-btn" aria-label="Redo" [disabled]="!canRedo()" (click)="redo()"><lucide-icon [img]="Redo" size="16" /></button>
          </div>
        </div>
      </div>

      <input #fileInput type="file" accept="image/*" hidden (change)="onImagePicked($event)" />
      @if (toast()) { <div class="wb-toast" role="status">{{ toast() }}</div> }
    </div>

    <!-- ═════════ Shared style controls (format bar + dock panel) ═════════ -->
    <ng-template #ctrls let-p>
      @if (can().text) {
        <div class="wb-ctl">
          <button type="button" class="wb-chip" aria-label="Font" (click)="toggleMenu(p + ':font')"><span class="wb-aa">Aa</span><lucide-icon [img]="Chevron" size="12" /></button>
          @if (menu() === p + ':font') {
            <div class="wb-drop" [class.wb-drop--down]="p === 'f'" [class.wb-drop--up]="p === 'd'">
              @for (f of fonts; track f) {
                <button type="button" [class.on]="sty().ff === f" [style.fontFamily]="ffByKey(f)" (click)="applyStyle({ ff: f }); closeMenu()">{{ ffLabel[f] }}</button>
              }
            </div>
          }
        </div>
        <div class="wb-ctl">
          <button type="button" class="wb-chip" aria-label="Size" (click)="toggleMenu(p + ':size')">{{ fsLabel[sty().fs] }}<lucide-icon [img]="Chevron" size="12" /></button>
          @if (menu() === p + ':size') {
            <div class="wb-drop" [class.wb-drop--down]="p === 'f'" [class.wb-drop--up]="p === 'd'">
              @for (s of sizes; track s) {
                <button type="button" [class.on]="sty().fs === s" (click)="applyStyle({ fs: s }); closeMenu()">{{ fsLabel[s] }}</button>
              }
            </div>
          }
        </div>
        <button type="button" class="wb-sq" [class.on]="sty().bold" aria-label="Bold" (click)="applyStyle({ bold: !sty().bold })"><lucide-icon [img]="BoldIcon" size="15" /></button>
        <button type="button" class="wb-sq" [class.on]="sty().italic" aria-label="Italic" (click)="applyStyle({ italic: !sty().italic })"><lucide-icon [img]="ItalicIcon" size="15" /></button>
        <button type="button" class="wb-sq" aria-label="Text alignment" (click)="cycleAlign()">
          <lucide-icon [img]="sty().align === 'left' ? AlignL : sty().align === 'right' ? AlignR : AlignC" size="15" />
        </button>
      }
      @if (can().tcolor) {
        <div class="wb-ctl">
          <button type="button" class="wb-chip" aria-label="Text color" (click)="toggleMenu(p + ':tcolor')">
            <span class="wb-dot" [style.background]="col(sty().stroke)"></span><lucide-icon [img]="Chevron" size="12" />
          </button>
          @if (menu() === p + ':tcolor') {
            <div class="wb-drop wb-drop--colors" [class.wb-drop--down]="p === 'f'" [class.wb-drop--up]="p === 'd'">
              <ng-container [ngTemplateOutlet]="swatches" [ngTemplateOutletContext]="{ $implicit: 'stroke' }" />
            </div>
          }
        </div>
      }
      @if (can().fill) {
        <div class="wb-ctl">
          <button type="button" class="wb-chip" aria-label="Fill color" (click)="toggleMenu(p + ':fill')">
            <span class="wb-dot" [class.wb-dot--none]="sty().fill === 'none'" [style.background]="sty().fill === 'none' ? null : col(sty().fill)"></span><lucide-icon [img]="Chevron" size="12" />
          </button>
          @if (menu() === p + ':fill') {
            <div class="wb-drop wb-drop--colors" [class.wb-drop--down]="p === 'f'" [class.wb-drop--up]="p === 'd'">
              <ng-container [ngTemplateOutlet]="swatches" [ngTemplateOutletContext]="{ $implicit: 'fill' }" />
            </div>
          }
        </div>
      }
      @if (can().line) {
        <div class="wb-ctl">
          <button type="button" class="wb-chip" aria-label="Line style" (click)="toggleMenu(p + ':line')">
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 15 L15 3" [attr.stroke]="col(sty().stroke)" stroke-width="2.2" stroke-linecap="round" [attr.stroke-dasharray]="sty().dash === 'dashed' ? '4 3' : sty().dash === 'dotted' ? '0.1 4' : null"/></svg>
            <lucide-icon [img]="Chevron" size="12" />
          </button>
          @if (menu() === p + ':line') {
            <div class="wb-drop wb-drop--line" [class.wb-drop--down]="p === 'f'" [class.wb-drop--up]="p === 'd'">
              <small>Color</small>
              <div class="wb-swatches"><ng-container [ngTemplateOutlet]="swatches" [ngTemplateOutletContext]="{ $implicit: 'stroke' }" /></div>
              <small>Style</small>
              <div class="wb-row">
                @for (d of dashes; track d) {
                  <button type="button" class="wb-opt" [class.on]="sty().dash === d" (click)="applyStyle({ dash: d })">
                    <svg width="34" height="10" viewBox="0 0 34 10"><path d="M2 5 H32" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" [attr.stroke-dasharray]="d === 'dashed' ? '7 5' : d === 'dotted' ? '0.1 6' : null"/></svg>
                  </button>
                }
              </div>
              <small>Thickness</small>
              <div class="wb-row">
                @for (w of widths(); track w) {
                  <button type="button" class="wb-opt" [class.on]="sty().sw === w" (click)="applyStyle({ sw: w })">
                    <svg width="34" height="16" viewBox="0 0 34 16"><path d="M2 8 H32" stroke="currentColor" [attr.stroke-width]="w" stroke-linecap="round"/></svg>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
      @if (can().cur) {
        <div class="wb-ctl">
          <button type="button" class="wb-chip" aria-label="Connector type" (click)="toggleMenu(p + ':cur')">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              @if (sty().cur === 'curve') { <path d="M3 14 Q4 4 15 4"/> } @else if (sty().cur === 'elbow') { <path d="M3 14 H9 V4 H15"/> } @else { <path d="M3 14 L15 4"/> }
            </svg><lucide-icon [img]="Chevron" size="12" />
          </button>
          @if (menu() === p + ':cur') {
            <div class="wb-drop" [class.wb-drop--down]="p === 'f'" [class.wb-drop--up]="p === 'd'">
              @for (c of curves; track c) { <button type="button" [class.on]="sty().cur === c" (click)="applyStyle({ cur: c }); closeMenu()">{{ curLabel[c] }}</button> }
            </div>
          }
        </div>
        <button type="button" class="wb-sq" [class.on]="sty().head" aria-label="Arrow head" title="Arrow head" (click)="applyStyle({ head: !sty().head })">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8 H13 M9 4 L13 8 L9 12"/></svg>
        </button>
      }
      @if (can().noteColor) {
        @for (c of notePalette; track c) {
          <button type="button" class="wb-swatch" [class.on]="sty().fill === c" [style.background]="c" [attr.aria-label]="'Color ' + c" (click)="applyStyle({ fill: c })"></button>
        }
      }
    </ng-template>

    <ng-template #swatches let-target>
      <div class="wb-swatches">
        @if (target === 'fill' && subject() !== 'note') {
          <button type="button" class="wb-swatch wb-swatch--none" [class.on]="sty().fill === 'none'" aria-label="No fill" (click)="applyStyle({ fill: 'none' })"></button>
        }
        @for (c of palette; track c) {
          <button type="button" class="wb-swatch" [class.wb-swatch--ink]="c === 'ink'" [class.on]="target === 'fill' ? sty().fill === c : sty().stroke === c"
                  [style.background]="c === 'ink' ? null : c" [attr.aria-label]="'Color ' + c" (click)="applyStyle(target === 'fill' ? { fill: c } : { stroke: c })"></button>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; height: 100%; padding: 0 .5rem .5rem; box-sizing: border-box; }
    .wb {
      position: relative; height: 100%; overflow: clip; color: var(--color-text-primary);
      background: var(--color-canvas); border: 1px solid var(--panel-border, var(--color-border)); border-radius: .875rem;
      font-size: .8125rem; user-select: none; -webkit-user-select: none;
    }
    button { font: inherit; }
    lucide-icon { display: inline-flex; }

    /* ── Canvas ── */
    .wb-canvas {
      position: absolute; inset: 0; overflow: hidden; touch-action: none; outline: none;
      background-image: radial-gradient(circle, var(--color-border-strong) 1.1px, transparent 1.3px); background-size: 24px 24px;
    }
    .wb-cursor-select { cursor: default; } .wb-cursor-hand { cursor: grab; } .wb--dragging .wb-cursor-hand { cursor: grabbing; }
    .wb-cursor-draw { cursor: crosshair; }
    .wb-world { position: absolute; left: 0; top: 0; width: 0; height: 0; transform-origin: 0 0; }
    .wb-svg { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
    .wb-shape, .wb-hit { pointer-events: all; cursor: move; }
    .wb-frame { pointer-events: stroke; cursor: move; }
    .wb-stroke { pointer-events: none; }
    .wb-cursor-draw .wb-shape, .wb-cursor-draw .wb-hit, .wb-cursor-draw .wb-item, .wb-cursor-draw .wb-frame,
    .wb-cursor-hand .wb-shape, .wb-cursor-hand .wb-hit, .wb-cursor-hand .wb-item, .wb-cursor-hand .wb-frame { cursor: inherit; }

    /* ── Items ── */
    .wb-item { position: absolute; box-sizing: border-box; cursor: move; line-height: 1.25; }
    .wb-item--shape, .wb-item--frame { display: flex; align-items: center; justify-content: center; padding: .4rem .6rem; pointer-events: none; }
    .wb-item--shape.is-editing { pointer-events: auto; }
    .wb-item--frame { justify-content: flex-start; align-items: flex-end; padding: 0 .2rem .15rem; pointer-events: auto; font-size: 14px; color: var(--color-text-secondary); }
    .wb-item--note { padding: .85rem 1rem; border-radius: 6px; box-shadow: 0 6px 16px rgba(0, 0, 0, .35); }
    .wb-item--text { padding: .1rem .25rem; }
    .wb-item--text, .wb-item--note { display: block; }
    .wb-item--text .wb-text { overflow: visible; }
    .wb-item--image { border-radius: 6px; overflow: hidden; box-shadow: 0 4px 14px rgba(0, 0, 0, .35); }
    .wb-img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
    .wb-item--task { overflow: visible; }
    .wb-text, .wb-edit {
      margin: 0; padding: 0; border: 0; outline: none; background: transparent; color: inherit; font: inherit; line-height: inherit;
      text-align: inherit; white-space: pre-wrap; word-break: break-word; resize: none; width: 100%;
    }
    .wb-item--note .wb-text, .wb-item--note .wb-edit { height: 100%; overflow: hidden; }
    .wb-item--shape .wb-edit, .wb-item--text .wb-edit { field-sizing: content; min-height: 1.3em; max-height: 100%; overflow: hidden; }
    .wb-item--frame .wb-edit { height: 1.5em; }
    .wb-edit { user-select: text; -webkit-user-select: text; cursor: text; }
    .wb-edit::placeholder { color: inherit; opacity: .4; }

    /* task card */
    .wb-card {
      width: 100%; height: 100%; box-sizing: border-box; padding: .65rem .8rem; display: flex; flex-direction: column; gap: .15rem;
      background: var(--color-surface-1); border: 1px solid var(--color-border); border-radius: 10px; box-shadow: 0 4px 14px rgba(0, 0, 0, .3);
      font-family: var(--font-sans, Inter, system-ui, sans-serif); color: var(--color-text-primary); text-align: left;
    }
    .wb-card__crumb { display: flex; gap: .55rem; font-size: 11px; font-weight: 500; color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; }
    .wb-card__title { font-size: 15px; font-weight: 600; line-height: 1.3; padding: 0; width: 100%; min-height: 1.3em; word-break: break-word; }
    textarea.wb-card__title { field-sizing: content; }
    .wb-card__row { margin-top: auto; display: flex; align-items: center; gap: .55rem; }
    .wb-card__flag { color: var(--color-text-secondary); display: inline-flex; }
    .wb-card__row .wb-avatar { margin-left: auto; }
    .wb-pill { border: 0; border-radius: 4px; padding: .22rem .5rem; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: .02em; cursor: pointer; filter: none; transition: filter .12s; }
    .wb-pill:hover { filter: brightness(1.15); }
    .wb-avatar { width: 1.6rem; height: 1.6rem; display: inline-grid; place-items: center; flex: none; border-radius: 50%; background: var(--color-surface-3); color: var(--color-text-secondary); font-size: .65rem; font-weight: 700; }
    .wb-avatar--sm { width: 1.5rem; height: 1.5rem; font-size: .6rem; }

    /* selection */
    .wb-sel { position: absolute; pointer-events: none; box-sizing: border-box; outline: calc(1.6px / var(--z, 1)) solid #3b82f6; }
    .wb-handle { position: absolute; pointer-events: all; width: 10px; height: 10px; background: #fff; border: 2px solid #3b82f6; border-radius: 2px; transform: scale(calc(1 / var(--z, 1))); }
    .wb-handle--nw { left: -5px; top: -5px; cursor: nwse-resize; transform-origin: center; }
    .wb-handle--ne { right: -5px; top: -5px; cursor: nesw-resize; }
    .wb-handle--sw { left: -5px; bottom: -5px; cursor: nesw-resize; }
    .wb-handle--se { right: -5px; bottom: -5px; cursor: nwse-resize; }
    .wb-anchor { position: absolute; pointer-events: all; width: 12px; height: 12px; border-radius: 50%; background: #2563eb; cursor: crosshair; transform: translate(-50%, -50%) scale(calc(1 / var(--z, 1))); transition: background .12s; }
    .wb-anchor:hover { background: #60a5fa; }
    .wb-anchor--n { left: 50%; top: calc(-14px / var(--z, 1)); } .wb-anchor--s { left: 50%; top: calc(100% + 14px / var(--z, 1)); }
    .wb-anchor--w { left: calc(-14px / var(--z, 1)); top: 50%; } .wb-anchor--e { left: calc(100% + 14px / var(--z, 1)); top: 50%; }
    .wb-end { position: absolute; width: 12px; height: 12px; margin: -6px 0 0 -6px; border-radius: 50%; background: #fff; border: 2px solid #3b82f6; cursor: grab; box-sizing: border-box; transform: scale(calc(1 / var(--z, 1))); }
    .wb-marquee { position: absolute; pointer-events: none; border: calc(1px / var(--z, 1)) solid #3b82f6; background: rgba(59, 130, 246, .12); }

    /* ── Hints ── */
    .wb-hints { position: absolute; inset: 0; pointer-events: none; color: var(--color-text-secondary); font-family: 'Caveat', 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive; font-size: 1.35rem; line-height: 1.15; }
    .wb-hint { position: absolute; display: flex; gap: .35rem; align-items: center; font-weight: 600; }
    .wb-hint--rename { left: 4.2rem; top: 3.8rem; align-items: flex-start; } .wb-hint--rename span { margin-top: 1.6rem; transform: rotate(6deg); }
    .wb-hint--share { right: 2.5rem; top: 3.5rem; align-items: flex-end; } .wb-hint--share svg { order: 2; margin-bottom: 1rem; } .wb-hint--share span { margin-top: 3rem; }
    .wb-hint--add { left: 50%; bottom: 7.4rem; transform: translateX(-50%); flex-direction: column; text-align: center; gap: .1rem; }
    .wb-hint--tpl { left: 50%; bottom: 7.4rem; margin-left: 13rem; flex-direction: column; align-items: flex-start; gap: .1rem; color: #f5b740; } .wb-hint--tpl span { white-space: nowrap; } .wb-hint--tpl svg { margin-left: 3.2rem; }
    .wb-hint--zoom { left: 1.6rem; bottom: 4.2rem; align-items: flex-end; } .wb-hint--zoom span { margin-bottom: 2rem; }
    .wb-hint__chip { display: inline-grid; place-items: center; vertical-align: middle; width: 1.5rem; height: 1.5rem; border-radius: .45rem; color: #fff; background: #ab4aba; }
    .wb-hint u { text-decoration: none; color: #c36ad0; } .wb-hint__star { color: #ffd666; font-style: normal; }
    .wb-hero { position: absolute; left: 50%; top: 44%; transform: translate(-50%, -50%); text-align: center; }
    .wb-hero__card { position: relative; width: 15rem; height: 5rem; margin: 0 auto; border-radius: .5rem; box-sizing: border-box; }
    .wb-hero__card--back { position: absolute; left: 50%; top: .5rem; margin-left: -8.2rem; background: var(--color-surface-3); border: 1px solid var(--color-border-strong); transform: translate(-.4rem, .4rem); }
    .wb-hero__card--front { background: #e9ecff; border: 2px solid #4a5be8; display: grid; place-items: center; color: #f76808; }
    .wb-hero__card--front b { font-size: 2.1rem; font-weight: 700; transform: rotate(-2deg); }
    .wb-hero__h { position: absolute; width: .6rem; height: .6rem; background: #fff; border: 2px solid #4a5be8; border-radius: 2px; }
    .wb-hero__h--tl { left: -.35rem; top: -.35rem; } .wb-hero__h--tr { right: -.35rem; top: -.35rem; } .wb-hero__h--bl { left: -.35rem; bottom: -.35rem; } .wb-hero__h--br { right: -.35rem; bottom: -.35rem; }
    .wb-hero p { margin: 2.1rem 0 0; font-size: 1.45rem; line-height: 1.55; font-weight: 600; } .wb-hero svg { vertical-align: middle; margin: 0 .2rem; }

    /* ── Floating chrome ── */
    .wb-title, .wb-actions, .wb-zoom, .wb-panel, .wb-toolbar { background: var(--color-surface-1); border: 1px solid var(--color-border); box-shadow: 0 4px 16px rgba(0, 0, 0, .28); }
    .wb-title { position: absolute; left: .75rem; top: .75rem; z-index: 3; display: flex; align-items: center; gap: .35rem; height: 2.4rem; padding: 0 .35rem 0 .6rem; border-radius: .6rem; }
    .wb-title__icon { width: 1.3rem; height: 1.3rem; display: grid; place-items: center; border-radius: .35rem; background: #f5a524; color: #1a1205; flex: none; }
    .wb-title__input { min-width: 4ch; max-width: 22rem; padding: .15rem .3rem; border: 0; border-radius: .3rem; outline: none; background: transparent; color: inherit; font: inherit; font-weight: 600; font-size: .85rem; user-select: text; -webkit-user-select: text; }
    .wb-title__input:hover { background: var(--color-surface-3); } .wb-title__input:focus { background: var(--color-surface-2); box-shadow: 0 0 0 1.5px var(--color-accent, #7b68ee); }
    .wb-actions { position: absolute; right: .75rem; top: .75rem; z-index: 3; display: flex; align-items: center; gap: .2rem; height: 2.4rem; padding: 0 .4rem; border-radius: .6rem; }
    .wb-actions .wb-avatar { margin-right: .2rem; }
    .wb-share { display: inline-flex; align-items: center; gap: .4rem; height: 1.9rem; padding: 0 .6rem; border: 0; border-radius: .45rem; background: transparent; color: inherit; font-weight: 600; cursor: pointer; }
    .wb-share:hover { background: var(--color-surface-3); }
    .wb-icon-btn { width: 1.9rem; height: 1.9rem; display: inline-grid; place-items: center; border: 0; border-radius: .45rem; background: transparent; color: var(--color-text-secondary); cursor: pointer; flex: none; }
    .wb-icon-btn:hover:not(:disabled) { background: var(--color-surface-3); color: var(--color-text-primary); }
    .wb-icon-btn:disabled { opacity: .35; cursor: default; }
    .wb-icon-btn--on { color: #f5b740; } .wb-icon-btn--on lucide-icon { fill: currentColor; }
    .wb-zoom { position: absolute; left: .75rem; bottom: .75rem; z-index: 3; display: flex; align-items: center; gap: .1rem; height: 2.4rem; padding: 0 .3rem; border-radius: .6rem; }
    .wb-zoom__sep { width: 1px; height: 1.1rem; margin: 0 .15rem; background: var(--color-border-strong); }
    .wb-zoom__pct { min-width: 3.2rem; height: 1.9rem; border: 0; border-radius: .45rem; background: transparent; color: var(--color-text-secondary); font-size: .75rem; cursor: pointer; }
    .wb-zoom__pct:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

    /* ── Panels & controls ── */
    .wb-panel { display: flex; align-items: center; gap: .15rem; padding: .3rem .4rem; border-radius: .7rem; }
    .wb-fmt { position: absolute; z-index: 5; transform: translateX(-50%); white-space: nowrap; }
    .wb-dockpanel { max-width: 100%; flex-wrap: wrap; justify-content: center; }
    .wb-sep { width: 1px; height: 1.3rem; margin: 0 .3rem; background: var(--color-border-strong); flex: none; }
    .wb-ctl { position: relative; display: inline-flex; }
    .wb-chip { display: inline-flex; align-items: center; gap: .3rem; height: 2rem; padding: 0 .55rem; border: 0; border-radius: .5rem; background: transparent; color: var(--color-text-primary); font-size: .8rem; font-weight: 500; cursor: pointer; white-space: nowrap; }
    .wb-chip:hover { background: var(--color-surface-3); }
    .wb-chip--task { color: var(--color-accent-bright, var(--color-accent)); }
    .wb-chip lucide-icon { color: var(--color-text-secondary); }
    .wb-aa { font-weight: 700; font-size: .85rem; }
    .wb-sq { width: 2rem; height: 2rem; display: inline-grid; place-items: center; border: 0; border-radius: .5rem; background: transparent; color: var(--color-text-secondary); cursor: pointer; }
    .wb-sq:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .wb-sq.on { background: var(--color-surface-3); color: var(--color-text-primary); box-shadow: inset 0 0 0 1.5px var(--color-accent, #7b68ee); }
    .wb-dot { width: 1.15rem; height: 1.15rem; border-radius: 50%; border: 1px solid var(--color-border-strong); background: var(--color-text-primary); }
    .wb-dot--none, .wb-swatch--none { background: linear-gradient(135deg, transparent 46%, #ef4444 46%, #ef4444 54%, transparent 54%), var(--color-surface-2); }
    .wb-kinds { display: flex; align-items: center; gap: .05rem; }
    .wb-kind { width: 2.1rem; height: 2.1rem; display: grid; place-items: center; border: 0; border-radius: .5rem; background: transparent; color: var(--color-text-secondary); cursor: pointer; }
    .wb-kind:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
    .wb-kind.on { background: var(--tint-soft, var(--color-surface-3)); color: var(--color-accent-bright, var(--color-accent)); box-shadow: inset 0 0 0 1.5px var(--color-accent, #7b68ee); }

    .wb-backdrop { position: fixed; inset: 0; z-index: 4; }
    .wb-drop { position: absolute; z-index: 8; display: flex; flex-direction: column; gap: .1rem; min-width: 10rem; padding: .35rem; border-radius: .65rem; background: var(--color-surface-1); border: 1px solid var(--color-border); box-shadow: 0 10px 28px rgba(0, 0, 0, .45); left: 0; }
    .wb-drop--down { top: calc(100% + .45rem); } .wb-drop--up { bottom: calc(100% + .55rem); } .wb-drop--right { left: auto; right: 0; }
    .wb-drop > button { display: flex; align-items: center; gap: .55rem; text-align: left; padding: .5rem .65rem; border: 0; border-radius: .4rem; background: transparent; color: var(--color-text-primary); cursor: pointer; white-space: nowrap; }
    .wb-drop > button:hover { background: var(--color-surface-3); } .wb-drop > button.on { color: var(--color-accent-bright, var(--color-accent)); }
    .wb-drop > button lucide-icon { color: var(--color-text-secondary); }
    .wb-drop hr { height: 1px; margin: .25rem .2rem; border: 0; background: var(--color-border); }
    .wb-drop b { padding: .35rem .65rem; font-size: .7rem; letter-spacing: .02em; color: var(--color-text-secondary); }
    .wb-drop small { padding: .3rem .4rem 0; font-size: .68rem; color: var(--color-text-secondary); }
    .wb-danger { color: var(--cu-red, #e5484d) !important; }
    .wb-drop--kinds { flex-direction: row; flex-wrap: wrap; width: 10.5rem; } .wb-drop--colors, .wb-drop--line { min-width: 12.5rem; padding: .5rem; }
    .wb-swatches { display: flex; flex-wrap: wrap; gap: .4rem; padding: .15rem; }
    .wb-swatch { width: 1.35rem; height: 1.35rem; border-radius: 50%; border: 1px solid var(--color-border-strong); padding: 0; cursor: pointer; transition: transform .1s; flex: none; }
    .wb-swatch:hover { transform: scale(1.15); } .wb-swatch--ink { background: var(--color-text-primary); }
    .wb-swatch.on { box-shadow: 0 0 0 2px var(--color-surface-1), 0 0 0 4px var(--color-accent, #7b68ee); }
    .wb-row { display: flex; gap: .3rem; padding: .15rem; }
    .wb-opt { width: 2.6rem; height: 1.9rem; display: grid; place-items: center; border: 1px solid transparent; border-radius: .4rem; background: transparent; color: var(--color-text-secondary); cursor: pointer; }
    .wb-opt:hover { background: var(--color-surface-3); } .wb-opt.on { color: var(--color-text-primary); border-color: var(--color-accent, #7b68ee); background: var(--color-surface-3); }
    .wb-drop--tpl { left: auto; right: 1rem; }

    /* ── Dock ── */
    .wb-dock { position: absolute; left: 50%; bottom: 0; z-index: 5; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: .55rem; width: max-content; max-width: calc(100% - 1rem); }
    .wb-toolbar { position: relative; display: flex; align-items: flex-end; gap: .35rem; height: 3.9rem; padding: 0 .65rem; border-radius: 1rem 1rem 0 0; border-bottom: 0; clip-path: inset(-80px -3px 0 -3px); }
    .wb-tool { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; position: relative; }
    .wb-tool__key { position: absolute; top: .3rem; font-size: .62rem; line-height: 1; color: var(--color-text-secondary); opacity: .85; white-space: nowrap; pointer-events: none; }
    .wb-tool--small { width: 2.2rem; }
    .wb-sbtn { width: 2.1rem; height: 2.1rem; margin-bottom: .45rem; display: grid; place-items: center; border: 0; border-radius: .5rem; background: transparent; color: var(--color-text-secondary); cursor: pointer; transition: background .12s, color .12s; }
    .wb-sbtn:hover { background: var(--color-surface-3); color: var(--color-text-primary); } .wb-sbtn.on { background: var(--color-surface-3); color: var(--color-text-primary); }
    .wb-tile {
      width: 3.3rem; height: 4rem; margin-bottom: -1.15rem; display: flex; justify-content: center; align-items: flex-start; padding: .15rem 0 0; box-sizing: border-box;
      border: 0; border-radius: .6rem .6rem 0 0; background: transparent; cursor: pointer; transition: transform .14s ease, background .12s;
    }
    .wb-tool--wide .wb-tile { width: 5.4rem; }
    .wb-tile:hover { transform: translateY(-.7rem); background: var(--color-surface-3); }
    .wb-tile.on { transform: translateY(-.7rem); background: var(--color-surface-3); box-shadow: inset 0 2px 0 var(--color-accent, #7b68ee); }
    .wb-tile > * { margin-top: .6rem; flex: none; }
    .wb-art { margin-top: .45rem; }
    .wb-art-task { width: 4.4rem; height: 3.1rem; border-radius: .45rem; background: #1f212b; border: 1px solid var(--color-border-strong); padding: .35rem .4rem; box-sizing: border-box; display: flex; flex-direction: column; gap: .25rem; margin-top: .55rem; }
    .wb-art-task__t { display: inline-flex; align-items: center; gap: .25rem; font-size: .62rem; font-weight: 600; color: var(--color-text-secondary); }
    .wb-art-task i { display: block; height: .3rem; border-radius: 2px; background: #e5e7eb; } .wb-art-task i.a { width: 80%; } .wb-art-task i.b { width: 60%; background: #1a73e8; }
    .wb-art-rect { width: 2.9rem; height: 2.9rem; border-radius: .2rem; background: #f4f4f5; margin-top: .55rem; }
    .wb-art-note { width: 2.9rem; height: 2.9rem; border-radius: .3rem .3rem .9rem .3rem; background: #232531; border: 1.5px solid #3d4052; margin-top: .55rem; }
    .wb-art-text { width: 2.9rem; height: 2.9rem; display: grid; place-items: center; border-radius: .3rem; background: #f4f4f5; color: #111; font-weight: 800; font-size: 1.5rem; margin-top: .55rem; }
    .wb-art-frame { width: 3rem; height: 2.8rem; border-radius: .4rem; background: #23252f; border: 1.5px solid #3d4052; position: relative; margin-top: .55rem; }
    .wb-art-frame::before { content: ''; position: absolute; left: .3rem; top: -.45rem; width: 1rem; height: .4rem; border-radius: 3px 3px 0 0; background: #3d4052; }
    .wb-art-img { width: 3rem; height: 2.8rem; border-radius: .3rem; margin-top: .55rem; background: radial-gradient(circle at 70% 30%, #ffd666 0 14%, transparent 15%), linear-gradient(#7cc4ff, #b9e3ff 55%, #f0b27a 56%, #e08a4b); }
    .wb-art-ai { width: 3rem; height: 2.9rem; display: grid; place-items: center; color: #fff; border-radius: .7rem; margin-top: .55rem; background: conic-gradient(from 200deg, #ff5ca8, #7b68ee, #28c7fa, #43d17a, #ffd666, #ff5ca8); }
    .wb-history { display: flex; flex-direction: column; justify-content: center; align-self: center; gap: .1rem; margin-left: .25rem; }
    .wb-history .wb-icon-btn { height: 1.6rem; }

    /* ── Task picker ── */
    .wb-picker { width: min(48rem, calc(100vw - 6rem)); border-radius: .8rem; background: var(--color-surface-1); border: 1px solid var(--color-border); box-shadow: 0 14px 40px rgba(0, 0, 0, .5); overflow: hidden; margin-bottom: -.55rem; }
    .wb-picker__tabs { display: flex; padding: 0 .5rem; border-bottom: 1px solid var(--color-border); }
    .wb-picker__tabs button { display: inline-flex; align-items: center; gap: .4rem; padding: .7rem .65rem; border: 0; border-bottom: 2px solid transparent; margin-bottom: -1px; background: transparent; color: var(--color-text-secondary); font-weight: 600; cursor: pointer; }
    .wb-picker__tabs button.on { color: var(--color-text-primary); border-bottom-color: var(--color-accent, #ff6a00); }
    .wb-picker__search { display: flex; align-items: center; gap: .6rem; padding: .7rem 1rem; border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary); }
    .wb-picker__search input { flex: 1; border: 0; outline: none; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .9rem; user-select: text; -webkit-user-select: text; }
    .wb-picker__head { display: flex; justify-content: space-between; padding: .55rem 1rem .25rem; font-size: .72rem; color: var(--color-text-secondary); }
    .wb-picker__head button { border: 0; background: transparent; color: var(--color-accent-bright, var(--color-accent)); font-size: .72rem; font-weight: 600; cursor: pointer; }
    .wb-picker__list { max-height: 11.5rem; overflow: auto; padding: 0 .5rem .4rem; }
    .wb-picker__row { width: 100%; display: flex; align-items: center; gap: .65rem; padding: .5rem .5rem; border: 0; border-radius: .45rem; background: transparent; color: var(--color-text-primary); text-align: left; cursor: pointer; }
    .wb-picker__row:hover { background: var(--color-surface-3); } .wb-picker__title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .wb-picker__empty { margin: 1rem; text-align: center; color: var(--color-text-secondary); }
    .wb-radio { width: .9rem; height: .9rem; display: grid; place-items: center; flex: none; border: 2px solid; border-radius: 50%; box-sizing: border-box; } .wb-radio i { width: .35rem; height: .35rem; border-radius: 50%; }
    .wb-picker__new { width: 100%; display: flex; align-items: center; gap: .6rem; padding: .75rem 1rem; border: 0; border-top: 1px solid var(--color-border); background: transparent; color: var(--color-text-primary); font-weight: 600; cursor: pointer; }
    .wb-picker__new:hover { background: var(--color-surface-3); }

    .wb-toast { position: absolute; left: 50%; top: 4rem; z-index: 9; transform: translateX(-50%); padding: .5rem .9rem; border-radius: .6rem; background: var(--color-surface-3); border: 1px solid var(--color-border-strong); box-shadow: 0 6px 18px rgba(0, 0, 0, .4); font-weight: 500; }

    @media (max-width: 900px) {
      .wb-hints { display: none; } .wb-toolbar { overflow-x: auto; max-width: 100%; } .wb-zoom { bottom: 5.2rem; }
    }
  `],
})
export class WhiteboardEditorComponent {
  private readonly location = inject(Location);
  private readonly injector = inject(Injector);
  private readonly session = inject(AuthSessionStore);
  private readonly spaceCtx = inject(SpaceContextService);
  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  /* icons */
  readonly Pointer = MousePointer2; readonly HandIcon = Hand; readonly TaskIcon = SquareCheckBig; readonly DocIcon = FileText;
  readonly SearchIcon = Search; readonly Star = Star; readonly Share2 = Share2; readonly Ellipsis = Ellipsis; readonly User = User;
  readonly MaximizeIcon = Maximize2; readonly MinimizeIcon = Minimize2; readonly XIcon = X; readonly Minus = Minus; readonly Plus = Plus;
  readonly ChevronsUp = ChevronsUp; readonly Trash2 = Trash2; readonly PenLine = PenLine; readonly Undo = Undo2; readonly Redo = Redo2;
  readonly Chevron = ChevronDown; readonly BoldIcon = Bold; readonly ItalicIcon = Italic; readonly AlignL = AlignLeft; readonly AlignC = AlignCenter;
  readonly AlignR = AlignRight; readonly CopyIcon = Copy; readonly ToFront = ArrowUpToLine; readonly ToBack = ArrowDownToLine;
  readonly Flag = Flag; readonly SparkIcon = Sparkles; readonly ImgIcon = ImageIcon; readonly FlowIcon = Workflow;

  /* constants for the template */
  readonly palette = PALETTE; readonly notePalette = NOTE_PALETTE; readonly mainKinds = MAIN_KINDS; readonly moreKinds = MORE_KINDS;
  readonly allKinds: Kind[] = [...MAIN_KINDS, ...MORE_KINDS];
  readonly fonts: Font[] = ['sans', 'hand', 'mono']; readonly sizes: FontSize[] = ['S', 'M', 'L', 'XL'];
  readonly dashes: Dash[] = ['solid', 'dashed', 'dotted']; readonly curves: Curve[] = ['straight', 'curve', 'elbow'];
  readonly fsLabel = FS_LABEL; readonly ffLabel = FF_LABEL; readonly curLabel: Record<Curve, string> = { straight: 'Straight', curve: 'Curved', elbow: 'Elbow' };

  /* state */
  readonly title = signal('Untitled whiteboard');
  readonly starred = signal(false);
  readonly items = signal<Item[]>([]);
  readonly view = signal<View>({ x: 0, y: 0, z: 1 });
  readonly tool = signal<Tool>('select');
  readonly sel = signal<number[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly marquee = signal<Box | null>(null);
  readonly menu = signal<string | null>(null);
  readonly tplOpen = signal(false);
  readonly taskOpen = signal(false);
  readonly taskTab = signal<'tasks' | 'docs'>('tasks');
  readonly taskQuery = signal('');
  readonly fullscreen = signal(false);
  readonly toast = signal('');
  readonly dragging = signal(false);
  readonly hintsDismissed = signal(false);
  readonly size = signal({ w: 1100, h: 700 });
  readonly defs = signal<Record<string, Partial<Style>>>({
    shape: {}, note: { fill: '#ffd666', align: 'left', fs: 'M' }, text: { align: 'left', fs: 'L' }, pen: { sw: 5 }, arrow: {}, frame: {},
  });

  private undoStack: string[] = []; private redoStack: string[] = [];
  readonly historyTick = signal(0);
  readonly canUndo = computed(() => (this.historyTick(), this.undoStack.length > 0));
  readonly canRedo = computed(() => (this.historyTick(), this.redoStack.length > 0));
  private drag: Drag | null = null; private pending: string | null = null;
  private spaceDown = false; private nextId = 1;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  /* derived */
  readonly initials = computed(() => {
    const n = this.session.current()?.user.fullName?.trim() ?? '';
    return n ? n.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() : 'ME';
  });
  readonly svgItems = computed(() => {
    const l = this.items().filter(i => i.type === 'frame' || i.type === 'shape' || i.type === 'arrow' || i.type === 'pen');
    return [...l.filter(i => i.type === 'frame'), ...l.filter(i => i.type !== 'frame')];
  });
  readonly htmlItems = computed(() => {
    const editing = this.editingId();
    return this.items().filter(i => ['note', 'task', 'text', 'image', 'frame'].includes(i.type) || (i.type === 'shape' && (!!i.text || i.id === editing)));
  });
  readonly selItems = computed(() => { const s = this.sel(); return this.items().filter(i => s.includes(i.id)); });
  readonly primary = computed(() => this.selItems()[0] ?? null);
  readonly singleArrow = computed(() => { const s = this.selItems(); return s.length === 1 && s[0].type === 'arrow' ? s[0] : null; });
  readonly selBox = computed<Box | null>(() => {
    const l = this.selItems(); if (!l.length) return null;
    const b = l.map(i => this.box(i));
    const x1 = Math.min(...b.map(i => i.x)), y1 = Math.min(...b.map(i => i.y));
    return { x: x1, y: y1, w: Math.max(...b.map(i => i.x + i.w)) - x1, h: Math.max(...b.map(i => i.y + i.h)) - y1 };
  });
  readonly canResize = computed(() => { const l = this.selItems(); return l.length === 1 && !['arrow', 'pen'].includes(l[0].type); });
  readonly canAnchor = computed(() => { const l = this.selItems(); return l.length === 1 && ['shape', 'note', 'task', 'text', 'frame', 'image'].includes(l[0].type) && this.editingId() === null; });
  readonly zoomPct = computed(() => Math.round(this.view().z * 100));
  readonly gridSize = computed(() => { const g = 24 * this.view().z; return `${g}px ${g}px`; });
  readonly titleWidth = computed(() => Math.max(this.title().length, 4) + 1);
  readonly worldTransform = computed(() => { const v = this.view(); return `translate(${v.x}px, ${v.y}px) scale(${v.z})`; });
  readonly showHints = computed(() => !this.hintsDismissed() && this.items().length === 0);
  readonly cursor = computed(() => (this.tool() === 'hand' || this.spaceDown ? 'hand' : this.tool() === 'select' ? 'select' : 'draw'));

  /** What the style controls currently describe: the selection, or the active tool. */
  readonly subject = computed<string>(() => {
    const p = this.primary();
    if (p && this.tool() === 'select') return p.type;
    return this.tool() === 'select' || this.tool() === 'hand' ? '' : this.tool();
  });
  readonly sty = computed<Style>(() => {
    const p = this.primary();
    if (p && this.tool() === 'select') return p;
    return { ...BASE, ...this.defs()[keyOfType(this.tool())] };
  });
  readonly can = computed(() => {
    const s = this.subject();
    return {
      text: s === 'shape' || s === 'note' || s === 'text',
      tcolor: s === 'text',
      fill: s === 'shape' || s === 'frame',
      noteColor: s === 'note',
      line: s === 'shape' || s === 'arrow' || s === 'pen' || s === 'frame',
      cur: s === 'arrow',
    };
  });
  readonly widths = computed(() => (this.subject() === 'pen' ? PEN_WIDTHS : WIDTHS));
  readonly showFormat = computed(() => this.tool() === 'select' && !!this.primary() && this.editingId() === null && !this.dragging() && ['shape', 'note', 'text', 'arrow', 'pen', 'frame'].includes(this.primary()!.type));
  readonly showDockPanel = computed(() => ['shape', 'arrow', 'pen', 'text', 'note', 'frame'].includes(this.tool()) && !this.taskOpen());
  readonly fmtPos = computed(() => {
    const b = this.selBox(); const v = this.view(); const sz = this.size();
    if (!b) return { x: 0, y: 0 };
    let y = b.y * v.z + v.y - 58;
    if (y < 56) y = Math.min((b.y + b.h) * v.z + v.y + 26, sz.h - 150);
    const x = Math.min(Math.max((b.x + b.w / 2) * v.z + v.x, 300), Math.max(300, sz.w - 300));
    return { x, y: Math.max(y, 56) };
  });
  readonly filteredTasks = computed(() => { const q = this.taskQuery().trim().toLowerCase(); return RECENT_TASKS.filter(t => !q || t.title.toLowerCase().includes(q)); });
  readonly filteredDocs = computed(() => { const q = this.taskQuery().trim().toLowerCase(); return RECENT_DOCS.filter(d => !q || d.toLowerCase().includes(q)); });

  constructor() {
    this.load();
    effect(() => {
      const items = this.items().filter(i => !(i.type === 'image' && i.src.length > 400_000));
      const data = JSON.stringify({ title: this.title(), starred: this.starred(), items, view: this.view(), defs: this.defs() });
      try { localStorage.setItem(STORAGE_KEY, data); } catch { /* storage unavailable or full */ }
    });
    afterNextRender(() => this.measure(), { injector: this.injector });
  }

  /* ───────── persistence ───────── */
  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.title === 'string') this.title.set(d.title);
      this.starred.set(!!d.starred);
      if (Array.isArray(d.items)) { this.items.set(d.items); this.nextId = d.items.reduce((m: number, i: Item) => Math.max(m, i.id), 0) + 1; }
      if (d.view && typeof d.view.z === 'number') this.view.set(d.view);
      if (d.defs) this.defs.set({ ...this.defs(), ...d.defs });
    } catch { /* ignore corrupt state */ }
  }
  @HostListener('window:resize') measure(): void {
    const r = this.canvas().nativeElement.getBoundingClientRect(); this.size.set({ w: r.width, h: r.height });
  }

  /* ───────── history ───────── */
  private pushHistory(snap: string): void { this.undoStack.push(snap); if (this.undoStack.length > 100) this.undoStack.shift(); this.redoStack = []; this.historyTick.update(n => n + 1); }
  private snapshot(): void { this.pushHistory(JSON.stringify(this.items())); }
  private flushPending(): void { if (this.pending) { this.pushHistory(this.pending); this.pending = null; } }
  undo(): void { const p = this.undoStack.pop(); if (p === undefined) return; this.redoStack.push(JSON.stringify(this.items())); this.items.set(JSON.parse(p)); this.sel.set([]); this.editingId.set(null); this.historyTick.update(n => n + 1); }
  redo(): void { const n = this.redoStack.pop(); if (n === undefined) return; this.undoStack.push(JSON.stringify(this.items())); this.items.set(JSON.parse(n)); this.sel.set([]); this.editingId.set(null); this.historyTick.update(n2 => n2 + 1); }

  /* ───────── template helpers ───────── */
  col(c: string): string { return c === 'ink' ? 'var(--color-text-primary)' : c; }
  fsPx(it: Item): number { return it.type === 'frame' ? 14 : FS_PX[it.fs]; }
  ffCss(it: Item): string { return FF_CSS[it.ff]; }
  ffByKey(f: Font): string { return FF_CSS[f]; }
  kindPath(it: Item): string { return shapeD(it.kind, it.w, it.h); }
  kindPreview(k: Kind): string { return shapeD(k, 16, 16); }
  dashArray(it: Item): string | null {
    const w = Math.max(1, it.sw);
    return it.dash === 'dashed' ? `${w * 3} ${w * 2.2}` : it.dash === 'dotted' ? `0.1 ${w * 2.4}` : null;
  }
  penPath(it: Item): string { return it.pts.length ? 'M' + it.pts.map(p => `${p[0]} ${p[1]}`).join(' L') : ''; }
  arrowPath(it: Item): string {
    const { x, y, x2, y2 } = it;
    if (it.cur === 'elbow') { const mx = (x + x2) / 2; return `M${x} ${y} H${mx} V${y2} H${x2}`; }
    if (it.cur === 'curve') {
      const mx = (x + x2) / 2, my = (y + y2) / 2, dx = x2 - x, dy = y2 - y;
      return `M${x} ${y} Q${mx - dy * 0.22} ${my + dx * 0.22} ${x2} ${y2}`;
    }
    return `M${x} ${y} L${x2} ${y2}`;
  }
  textColor(it: Item): string | null {
    if (it.type === 'note') return '#1d1d1f';
    if (it.type === 'text') return this.col(it.stroke);
    if (it.type === 'shape') return it.fill === 'none' ? 'var(--color-text-primary)' : this.contrast(it.fill);
    return null;
  }
  private contrast(c: string): string {
    if (c === 'ink') return 'var(--color-canvas)';
    const m = /^#([0-9a-f]{6})$/i.exec(c); if (!m) return '#fff';
    const n = parseInt(m[1], 16); const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return l > 0.6 ? '#1d1d1f' : '#fff';
  }
  statusColor(s: string): string { return STATUS_COLOR[s] ?? '#6b7086'; }
  crumbParts(it: Item): string[] { return it.crumb.split('|').filter(Boolean); }
  box(it: Item): Box {
    if (it.type === 'arrow') return { x: Math.min(it.x, it.x2), y: Math.min(it.y, it.y2), w: Math.abs(it.x2 - it.x), h: Math.abs(it.y2 - it.y) };
    return { x: it.x, y: it.y, w: it.w, h: it.h };
  }

  /* ───────── item factory ───────── */
  private blank(type: ItemType, x: number, y: number, w = 0, h = 0, over: Partial<Item> = {}): Item {
    const key = keyOfType(type);
    return {
      ...BASE, ...this.defs()[key], id: this.nextId++, type, x, y, w, h, x2: x, y2: y, pts: [], text: '',
      status: '', crumb: '', assignee: '', src: '', ...over,
    };
  }
  private patch(id: number, fn: (i: Item) => Item): void { this.items.update(l => l.map(i => (i.id === id ? fn(i) : i))); }
  private viewCenter(): { x: number; y: number } {
    const r = this.canvas().nativeElement.getBoundingClientRect(); const v = this.view();
    return { x: (r.width / 2 - v.x) / v.z, y: (r.height / 2 - v.y) / v.z - 40 };
  }
  private crumb(list = 'Whiteboard'): string { return `${this.spaceCtx.spaceName()}|${list}`; }

  /* ───────── tools ───────── */
  setTool(t: Tool): void {
    this.endEdit(); this.closeMenu(); this.tplOpen.set(false); this.taskOpen.set(false);
    this.tool.set(t); if (t !== 'select') this.sel.set([]);
  }
  toggleMenu(k: string): void { this.menu.set(this.menu() === k ? null : k); }
  closeMenu(): void { this.menu.set(null); }
  toggleTpl(): void { this.closeMenu(); this.taskOpen.set(false); this.tplOpen.set(!this.tplOpen()); }
  toggleTask(): void {
    this.closeMenu(); this.tplOpen.set(false); const open = !this.taskOpen(); this.taskOpen.set(open);
    if (open) { this.tool.set('select'); this.taskQuery.set(''); this.taskTab.set('tasks'); setTimeout(() => (document.querySelector('.wb-picker__search input') as HTMLInputElement | null)?.focus({ preventScroll: true }), 30); }
  }

  /** Apply a style change to the selection and remember it as the default for the current tool. */
  applyStyle(patch: Partial<Style>): void {
    const ids = this.sel();
    if (ids.length && this.tool() === 'select') { this.snapshot(); this.items.update(l => l.map(i => (ids.includes(i.id) ? { ...i, ...patch } : i))); }
    const key = keyOfType(this.primary() && this.tool() === 'select' ? this.primary()!.type : this.tool());
    this.defs.update(d => ({ ...d, [key]: { ...d[key], ...patch } }));
  }
  cycleAlign(): void { const o: Align[] = ['left', 'center', 'right']; this.applyStyle({ align: o[(o.indexOf(this.sty().align) + 1) % 3] }); }

  /* ───────── pointer interaction ───────── */
  onPointerDown(e: PointerEvent): void {
    if ((e.target as HTMLElement).closest('textarea')) return;
    this.closeMenu(); this.tplOpen.set(false); this.taskOpen.set(false);
    if (this.editingId() !== null) this.endEdit();
    const el = this.canvas().nativeElement; el.setPointerCapture(e.pointerId); el.focus({ preventScroll: true });
    const w = this.world(e); const t = this.tool(); const target = e.target as Element;
    const base = { cx: e.clientX, cy: e.clientY, wx: w.x, wy: w.y };
    this.dragging.set(true);

    if (e.button === 1 || this.spaceDown || t === 'hand') { this.drag = { ...base, mode: 'pan', view0: this.view() }; return; }

    if (t === 'select') {
      const handle = target.closest('[data-handle]');
      if (handle) { this.beginSnap(); const id = this.sel()[0]; this.drag = { ...base, mode: 'resize', id, handle: handle.getAttribute('data-handle')!, snaps: this.snapMap([id]) }; return; }
      const anchor = target.closest('[data-anchor]');
      if (anchor && this.primary()) { this.startArrowFrom(this.primary()!, anchor.getAttribute('data-anchor')!, base); return; }
      const end = target.closest('[data-end]');
      if (end && this.sel().length) { this.beginSnap(); this.drag = { ...base, mode: 'endpoint', id: this.sel()[0], end: end.getAttribute('data-end')! }; return; }
      const hit = target.closest('[data-id]');
      if (hit) {
        const id = Number(hit.getAttribute('data-id'));
        if (e.shiftKey) this.sel.update(s => (s.includes(id) ? s.filter(i => i !== id) : [...s, id]));
        else if (!this.sel().includes(id)) this.sel.set([id]);
        const moving = new Set(this.sel());
        for (const id2 of [...moving]) { const f = this.items().find(i => i.id === id2); if (f?.type === 'frame') this.itemsInFrame(f).forEach(k => moving.add(k.id)); }
        this.beginSnap(); this.drag = { ...base, mode: 'move', snaps: this.snapMap([...moving]) };
        return;
      }
      if (!e.shiftKey) this.sel.set([]);
      this.drag = { ...base, mode: 'marquee', shift: e.shiftKey, snaps: this.snapMap(this.sel()) };
      return;
    }

    this.hintsDismissed.set(true);
    if (t === 'note' || t === 'text') {
      const dims = t === 'note' ? [190, 190] : [260, 40];
      const it = this.blank(t, w.x - dims[0] / 2, w.y - dims[1] / 2, dims[0], dims[1]);
      this.snapshot(); this.items.update(l => [...l, it]);
      this.tool.set('select'); this.sel.set([it.id]); this.startEdit(it.id, false); this.drag = null; this.dragging.set(false);
      return;
    }
    if (t === 'shape' || t === 'frame') {
      const it = this.blank(t === 'frame' ? 'frame' : 'shape', w.x, w.y, 0, 0, t === 'frame' ? { text: `Frame ${this.items().filter(i => i.type === 'frame').length + 1}`, fill: 'none' } : {});
      this.snapshot(); this.items.update(l => [...l, it]); this.drag = { ...base, mode: 'size', id: it.id }; this.sel.set([it.id]); return;
    }
    if (t === 'arrow') { const it = this.blank('arrow', w.x, w.y); this.snapshot(); this.items.update(l => [...l, it]); this.drag = { ...base, mode: 'arrow', id: it.id }; return; }
    if (t === 'pen') { const it = { ...this.blank('pen', w.x, w.y), pts: [[0, 0]] }; this.snapshot(); this.items.update(l => [...l, it]); this.drag = { ...base, mode: 'pen', id: it.id }; }
  }

  private beginSnap(): void { this.pending = JSON.stringify(this.items()); }
  private snapMap(ids: number[]): Map<number, Item> {
    const m = new Map<number, Item>(); for (const i of this.items()) if (ids.includes(i.id)) m.set(i.id, { ...i }); return m;
  }
  private itemsInFrame(f: Item): Item[] {
    return this.items().filter(i => i.id !== f.id && i.type !== 'frame' && (() => { const b = this.box(i); const cx = b.x + b.w / 2, cy = b.y + b.h / 2; return cx >= f.x && cx <= f.x + f.w && cy >= f.y && cy <= f.y + f.h; })());
  }
  private anchorPoint(it: Item, side: string): { x: number; y: number } {
    const b = this.box(it);
    return side === 'n' ? { x: b.x + b.w / 2, y: b.y } : side === 's' ? { x: b.x + b.w / 2, y: b.y + b.h } : side === 'w' ? { x: b.x, y: b.y + b.h / 2 } : { x: b.x + b.w, y: b.y + b.h / 2 };
  }
  private startArrowFrom(it: Item, side: string, base: { cx: number; cy: number; wx: number; wy: number }): void {
    const p = this.anchorPoint(it, side); const a = this.blank('arrow', p.x, p.y, 0, 0, { x2: p.x, y2: p.y });
    this.snapshot(); this.items.update(l => [...l, a]); this.sel.set([a.id]); this.drag = { ...base, mode: 'arrow', id: a.id };
  }

  onPointerMove(e: PointerEvent): void {
    const d = this.drag; if (!d) return;
    const w = this.world(e); const z = this.view().z;
    if (!d.moved && Math.hypot(e.clientX - d.cx, e.clientY - d.cy) > 3) d.moved = true;
    switch (d.mode) {
      case 'pan': { const v0 = d.view0!; this.view.set({ ...v0, x: v0.x + e.clientX - d.cx, y: v0.y + e.clientY - d.cy }); break; }
      case 'move': {
        if (!d.moved) return; this.flushPending();
        const dx = w.x - d.wx, dy = w.y - d.wy; const snaps = d.snaps!;
        this.items.update(l => l.map(i => { const s = snaps.get(i.id); return s ? { ...i, x: s.x + dx, y: s.y + dy, x2: s.x2 + dx, y2: s.y2 + dy } : i; })); break;
      }
      case 'resize': {
        if (!d.moved) return; this.flushPending();
        const s = d.snaps!.get(d.id!)!; const dx = w.x - d.wx, dy = w.y - d.wy; const h = d.handle!;
        const minW = 30, minH = 24;
        let x = s.x, y = s.y, nw = s.w, nh = s.h;
        if (h.includes('e')) nw = Math.max(minW, s.w + dx);
        if (h.includes('s')) nh = Math.max(minH, s.h + dy);
        if (h.includes('w')) { nw = Math.max(minW, s.w - dx); x = s.x + s.w - nw; }
        if (h.includes('n')) { nh = Math.max(minH, s.h - dy); y = s.y + s.h - nh; }
        this.patch(d.id!, i => ({ ...i, x, y, w: nw, h: nh })); break;
      }
      case 'endpoint': {
        if (!d.moved) return; this.flushPending();
        this.patch(d.id!, i => (d.end === '1' ? { ...i, x: w.x, y: w.y } : { ...i, x2: w.x, y2: w.y })); break;
      }
      case 'size': {
        const x = Math.min(d.wx, w.x), y = Math.min(d.wy, w.y);
        this.patch(d.id!, i => ({ ...i, x, y, w: Math.abs(w.x - d.wx), h: Math.abs(w.y - d.wy) })); break;
      }
      case 'arrow': this.patch(d.id!, i => ({ ...i, x2: w.x, y2: w.y })); break;
      case 'pen': {
        const dist = 2 / z;
        this.patch(d.id!, i => { const last = i.pts[i.pts.length - 1]; const px = w.x - i.x, py = w.y - i.y; return Math.hypot(px - last[0], py - last[1]) < dist ? i : { ...i, pts: [...i.pts, [px, py]] }; }); break;
      }
      case 'marquee': {
        const m: Box = { x: Math.min(d.wx, w.x), y: Math.min(d.wy, w.y), w: Math.abs(w.x - d.wx), h: Math.abs(w.y - d.wy) };
        if (!d.moved) return;
        this.marquee.set(m);
        const keep = d.shift ? [...d.snaps!.keys()] : [];
        const hit = this.items().filter(i => { const b = this.box(i); const inter = b.x < m.x + m.w && b.x + b.w > m.x && b.y < m.y + m.h && b.y + b.h > m.y; return i.type === 'frame' ? (b.x >= m.x && b.y >= m.y && b.x + b.w <= m.x + m.w && b.y + b.h <= m.y + m.h) : inter; }).map(i => i.id);
        this.sel.set([...new Set([...keep, ...hit])]); break;
      }
    }
  }

  onPointerUp(e: PointerEvent): void {
    const d = this.drag; this.drag = null; this.dragging.set(false); this.pending = null; this.marquee.set(null);
    try { this.canvas().nativeElement.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
    if (!d) return;
    if (d.mode === 'size') {
      const it = this.items().find(i => i.id === d.id);
      if (it && it.w < 8 && it.h < 8) this.patch(d.id!, i => ({ ...i, w: i.type === 'frame' ? 420 : 170, h: i.type === 'frame' ? 300 : 120 }));
      this.tool.set('select');
    } else if (d.mode === 'arrow') {
      const it = this.items().find(i => i.id === d.id);
      if (it && Math.hypot(it.x2 - it.x, it.y2 - it.y) < 12) { this.items.update(l => l.filter(i => i.id !== d.id)); this.sel.set([]); }
      else this.sel.set([d.id!]);
      this.tool.set('select');
    } else if (d.mode === 'pen') {
      this.patch(d.id!, i => {
        const xs = i.pts.map(p => p[0]), ys = i.pts.map(p => p[1]); const minX = Math.min(...xs), minY = Math.min(...ys);
        return { ...i, x: i.x + minX, y: i.y + minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY, pts: i.pts.map(p => [p[0] - minX, p[1] - minY]) };
      });
    }
  }

  onDblClick(e: MouseEvent): void {
    const hit = (e.target as Element).closest('[data-id]');
    if (hit) {
      const id = Number(hit.getAttribute('data-id')); const it = this.items().find(i => i.id === id);
      if (it && ['note', 'task', 'text', 'shape', 'frame'].includes(it.type)) { this.sel.set([id]); this.startEdit(id); }
      return;
    }
    if ((e.target as Element).closest('textarea, [data-handle], [data-anchor], [data-end]')) return;
    const w = this.world(e); const it = this.blank('text', w.x - 20, w.y - 16, 260, 40);
    this.hintsDismissed.set(true); this.snapshot(); this.items.update(l => [...l, it]); this.sel.set([it.id]); this.startEdit(it.id, false);
  }
  onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) { this.zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY); return; }
    this.view.update(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
  }
  private world(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const r = this.canvas().nativeElement.getBoundingClientRect(); const v = this.view();
    return { x: (e.clientX - r.left - v.x) / v.z, y: (e.clientY - r.top - v.y) / v.z };
  }

  /* ───────── text editing ───────── */
  startEdit(id: number, snap = true): void {
    if (snap) this.snapshot();
    this.editingId.set(id);
    afterNextRender(() => {
      const ta = this.canvas().nativeElement.querySelector<HTMLTextAreaElement>('.wb-edit'); ta?.focus({ preventScroll: true }); ta?.setSelectionRange(ta.value.length, ta.value.length);
    }, { injector: this.injector });
  }
  setText(id: number, text: string): void { this.patch(id, i => ({ ...i, text })); }
  endEdit(): void {
    const id = this.editingId(); if (id === null) return;
    this.editingId.set(null);
    const it = this.items().find(i => i.id === id); if (!it || it.text.trim()) return;
    if (it.type === 'note' || it.type === 'text') { this.items.update(l => l.filter(i => i.id !== id)); this.sel.update(s => s.filter(i => i !== id)); }
    else if (it.type === 'task') this.patch(id, i => ({ ...i, text: 'Untitled task' }));
  }

  /* ───────── actions on selection ───────── */
  deleteSelected(): void {
    const ids = this.sel(); if (!ids.length) return;
    this.snapshot(); this.items.update(l => l.filter(i => !ids.includes(i.id))); this.sel.set([]);
  }
  duplicate(): void {
    const src = this.selItems(); if (!src.length) return; this.snapshot();
    const copies = src.map(i => ({ ...i, id: this.nextId++, x: i.x + 28, y: i.y + 28, x2: i.x2 + 28, y2: i.y2 + 28, pts: i.pts.map(p => [...p]) }));
    this.items.update(l => [...l, ...copies]); this.sel.set(copies.map(c => c.id));
  }
  reorder(dir: 'front' | 'back'): void {
    const ids = this.sel(); if (!ids.length) return; this.snapshot();
    this.items.update(l => { const s = l.filter(i => ids.includes(i.id)); const r = l.filter(i => !ids.includes(i.id)); return dir === 'front' ? [...r, ...s] : [...s, ...r]; });
  }
  convertToTask(): void {
    const ids = this.sel(); if (!ids.length) return; this.snapshot();
    this.items.update(l => l.map(i => (ids.includes(i.id) && ['shape', 'note', 'text'].includes(i.type)
      ? { ...i, type: 'task' as ItemType, w: 262, h: 104, text: i.text || 'New task', status: 'TO DO', crumb: this.crumb() } : i)));
  }
  cycleStatus(id: number): void {
    this.snapshot(); this.patch(id, i => ({ ...i, status: STATUSES[(STATUSES.indexOf(i.status) + 1) % STATUSES.length] }));
  }
  clearAll(): void { if (!this.items().length) return; this.snapshot(); this.items.set([]); this.sel.set([]); }

  /* ───────── tasks, docs, images ───────── */
  private addCard(over: Partial<Item>): Item {
    const c = this.viewCenter(); const n = this.items().filter(i => i.type === 'task').length;
    const it = this.blank('task', c.x - 131 + (n % 5) * 18, c.y - 52 + (n % 5) * 18, 262, 104, over);
    this.hintsDismissed.set(true); this.snapshot(); this.items.update(l => [...l, it]); this.sel.set([it.id]); return it;
  }
  insertTask(t: TaskRef): void { this.taskOpen.set(false); this.addCard({ text: t.title, status: t.status, crumb: this.crumb(t.list) }); }
  insertDoc(name: string): void { this.taskOpen.set(false); this.addCard({ text: name, status: '', crumb: `${this.spaceCtx.spaceName()}|Docs`, h: 84 }); }
  createTaskCard(): void { this.taskOpen.set(false); const it = this.addCard({ text: '', status: 'TO DO', crumb: this.crumb() }); this.startEdit(it.id, false); }

  pickImage(): void { this.fileInput()?.nativeElement.click(); }
  onImagePicked(ev: Event): void {
    const input = ev.target as HTMLInputElement; const file = input.files?.[0]; input.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result); const img = new window.Image();
      img.onload = () => {
        const s = Math.min(1, 420 / Math.max(img.width, img.height)); const c = this.viewCenter();
        const it = this.blank('image', c.x - (img.width * s) / 2, c.y - (img.height * s) / 2, img.width * s, img.height * s, { src });
        this.hintsDismissed.set(true); this.snapshot(); this.items.update(l => [...l, it]); this.sel.set([it.id]); this.tool.set('select');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  /* ───────── zoom ───────── */
  private zoomAt(factor: number, cx: number, cy: number): void {
    const r = this.canvas().nativeElement.getBoundingClientRect(); const px = cx - r.left, py = cy - r.top;
    this.view.update(v => { const z = Math.min(4, Math.max(0.1, v.z * factor)); const k = z / v.z; return { z, x: px - (px - v.x) * k, y: py - (py - v.y) * k }; });
  }
  zoomBy(f: number): void { const r = this.canvas().nativeElement.getBoundingClientRect(); this.zoomAt(f, r.left + r.width / 2, r.top + r.height / 2); }
  resetZoom(): void { const r = this.canvas().nativeElement.getBoundingClientRect(); this.zoomAt(1 / this.view().z, r.left + r.width / 2, r.top + r.height / 2); }
  zoomFit(): void {
    const list = this.items(); const r = this.canvas().nativeElement.getBoundingClientRect();
    if (!list.length) { this.view.set({ x: 0, y: 0, z: 1 }); return; }
    const b = list.map(i => this.box(i));
    const x1 = Math.min(...b.map(i => i.x)), y1 = Math.min(...b.map(i => i.y)), x2 = Math.max(...b.map(i => i.x + i.w)), y2 = Math.max(...b.map(i => i.y + i.h));
    const pad = 140; const z = Math.min(2, Math.max(0.1, Math.min((r.width - pad) / Math.max(1, x2 - x1), (r.height - pad * 1.6) / Math.max(1, y2 - y1))));
    this.view.set({ z, x: (r.width - (x2 - x1) * z) / 2 - x1 * z, y: (r.height - (y2 - y1) * z) / 2 - y1 * z - 30 });
  }

  /* ───────── templates ───────── */
  applyTemplate(name: 'brainstorm' | 'flow' | 'kanban'): void {
    this.tplOpen.set(false); this.hintsDismissed.set(true); this.snapshot();
    const c = this.viewCenter(); const add: Item[] = [];
    const note = (x: number, y: number, text: string, fill: string) => add.push(this.blank('note', c.x + x, c.y + y, 170, 150, { text, fill, align: 'left' }));
    const shape = (x: number, y: number, w: number, h: number, text: string, kind: Kind = 'rect') => add.push(this.blank('shape', c.x + x, c.y + y, w, h, { text, kind }));
    const label = (x: number, y: number, text: string) => add.push(this.blank('text', c.x + x, c.y + y, 220, 40, { text, fs: 'L', align: 'left' }));
    const arrow = (x1: number, y1: number, x2: number, y2: number, cur: Curve = 'straight') => add.push(this.blank('arrow', c.x + x1, c.y + y1, 0, 0, { x2: c.x + x2, y2: c.y + y2, cur }));
    if (name === 'brainstorm') {
      note(-85, -75, 'Main idea', '#ffd666'); note(-330, -230, 'Idea 1', '#ff9ec7'); note(160, -230, 'Idea 2', '#8ec5ff'); note(-330, 100, 'Idea 3', '#8fe3a7'); note(160, 100, 'Idea 4', '#c4a7ff');
      arrow(-160, -80, -90, -40); arrow(160, -80, 90, -40); arrow(-160, 110, -90, 50); arrow(160, 110, 90, 50);
    } else if (name === 'flow') {
      shape(-440, -40, 170, 80, 'Start', 'ellipse'); shape(-130, -40, 170, 80, 'Do the work'); shape(160, -50, 190, 100, 'Approved?', 'diamond'); shape(440, -40, 170, 80, 'Done', 'ellipse');
      arrow(-270, 0, -132, 0); arrow(40, 0, 160, 0); arrow(350, 0, 440, 0);
    } else {
      label(-400, -230, 'To do'); label(-90, -230, 'In progress'); label(220, -230, 'Done');
      for (const x of [-410, -100, 210]) add.push(this.blank('frame', c.x + x, c.y - 180, 270, 340, { text: '' }));
      note(-380, -140, 'Task A', '#ffd666'); note(-380, 40, 'Task B', '#ff9ec7'); note(-70, -140, 'Task C', '#8ec5ff');
    }
    this.items.update(l => [...l, ...add]); this.sel.set([]);
  }

  /* ───────── chrome ───────── */
  share(): void {
    try { void navigator.clipboard?.writeText(location.href); } catch { /* clipboard blocked */ }
    this.showToast('Link copied to clipboard');
  }
  showToast(msg: string): void { this.toast.set(msg); clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.toast.set(''), 2400); }
  close(): void { this.location.back(); }
  toggleFullscreen(): void {
    if (document.fullscreenElement) { void document.exitFullscreen(); this.fullscreen.set(false); }
    else { void document.documentElement.requestFullscreen?.(); this.fullscreen.set(true); }
  }

  /* ───────── keyboard ───────── */
  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent): void { if (e.code === 'Space') this.spaceDown = false; }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    const el = e.target as HTMLElement | null;
    if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable)) return;
    if (this.editingId() !== null) return;
    const mod = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
    if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); this.redo(); return; }
    if (mod && k === 'd') { e.preventDefault(); this.duplicate(); return; }
    if (mod && k === 'a') { e.preventDefault(); this.setTool('select'); this.sel.set(this.items().map(i => i.id)); return; }
    if (mod) return;
    if (e.code === 'Space') { this.spaceDown = true; e.preventDefault(); return; }
    if (k === 'delete' || k === 'backspace') { this.deleteSelected(); return; }
    if (k === 'escape') { this.closeMenu(); this.taskOpen.set(false); this.tplOpen.set(false); this.setTool('select'); this.sel.set([]); return; }
    if (k === '+' || k === '=') { this.zoomBy(1.2); return; }
    if (k === '-') { this.zoomBy(1 / 1.2); return; }
    if (k === 't' && e.shiftKey) { this.toggleTask(); return; }
    if (e.shiftKey) return;
    const map: Record<string, Tool> = { v: 'select', h: 'hand', d: 'pen', r: 'shape', a: 'arrow', n: 'note', t: 'text', f: 'frame' };
    if (map[k]) this.setTool(map[k]);
  }
}
