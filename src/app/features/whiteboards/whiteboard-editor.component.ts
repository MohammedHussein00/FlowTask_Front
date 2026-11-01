import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, Injector, afterNextRender, computed, effect, inject, signal, viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import {
  LucideAngularModule,
  ChevronsUp, Ellipsis, Hand, LayoutTemplate, Maximize2, Minimize2, Minus, MousePointer2, MoveUpRight,
  Pencil, PenLine, Plus, Redo2, Share2, Square, SquareCheckBig, Star, StickyNote, Trash2, Type, Undo2, User, X, Circle,
} from 'lucide-angular';

type Tool = 'select' | 'hand' | 'task' | 'pen' | 'rect' | 'ellipse' | 'arrow' | 'note' | 'text';
type ItemType = 'note' | 'task' | 'text' | 'rect' | 'ellipse' | 'arrow' | 'pen';

interface Item {
  id: number;
  type: ItemType;
  x: number; y: number; w: number; h: number;
  x2: number; y2: number;          // arrow end point (world)
  pts: number[][];                 // pen points, relative to x/y
  text: string;
  color: string;
}
interface View { x: number; y: number; z: number; }
interface Drag {
  mode: 'pan' | 'move' | 'resize' | 'size' | 'arrow' | 'pen';
  cx: number; cy: number;          // pointer start (client)
  wx: number; wy: number;          // pointer start (world)
  id?: number; snap?: Item; view0?: View; moved?: boolean;
}

const STORAGE_KEY = 'flowtask.whiteboard.v1';
const PALETTE = ['ink', '#ffffff', '#ffd666', '#ff9ec7', '#8ec5ff', '#8fe3a7', '#c4a7ff', '#ffb27a'];
const TOOLS: { id: Tool; key: string; label: string }[] = [
  { id: 'select',  key: 'V',   label: 'Select' },
  { id: 'hand',    key: 'H',   label: 'Pan' },
  { id: 'task',    key: '⇧T',  label: 'Task card' },
  { id: 'pen',     key: 'D',   label: 'Draw' },
  { id: 'rect',    key: 'R',   label: 'Rectangle' },
  { id: 'ellipse', key: 'O',   label: 'Ellipse' },
  { id: 'arrow',   key: 'A',   label: 'Arrow' },
  { id: 'note',    key: 'N',   label: 'Sticky note' },
  { id: 'text',    key: 'T',   label: 'Text' },
];

@Component({
  selector: 'app-whiteboard-editor',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wb" [class.wb--dragging]="dragging()">

      <!-- ── Canvas ── -->
      <div #canvas class="wb-canvas" [class]="'wb-canvas wb-cursor-' + cursor()"
           [style.background-size]="gridSize()"
           [style.background-position]="view().x + 'px ' + view().y + 'px'"
           (pointerdown)="onPointerDown($event)" (pointermove)="onPointerMove($event)"
           (pointerup)="onPointerUp($event)" (pointercancel)="onPointerUp($event)"
           (dblclick)="onDblClick($event)" (wheel)="onWheel($event)">

        <div class="wb-world" [style.transform]="worldTransform()" [style.--z]="view().z">
          <svg class="wb-svg" width="1" height="1">
            @for (it of items(); track it.id) {
              @switch (it.type) {
                @case ('rect') {
                  <rect class="wb-shape" [attr.data-id]="it.id" [attr.x]="it.x" [attr.y]="it.y" [attr.width]="it.w" [attr.height]="it.h"
                        rx="8" [attr.fill]="fill(it.color)" stroke="var(--color-border-strong)" stroke-width="1.5" />
                }
                @case ('ellipse') {
                  <ellipse class="wb-shape" [attr.data-id]="it.id" [attr.cx]="it.x + it.w / 2" [attr.cy]="it.y + it.h / 2"
                           [attr.rx]="it.w / 2" [attr.ry]="it.h / 2" [attr.fill]="fill(it.color)"
                           stroke="var(--color-border-strong)" stroke-width="1.5" />
                }
                @case ('arrow') {
                  <g [style.color]="fill(it.color)">
                    <line class="wb-hit" [attr.data-id]="it.id" [attr.x1]="it.x" [attr.y1]="it.y" [attr.x2]="it.x2" [attr.y2]="it.y2" stroke="transparent" stroke-width="18" />
                    <line class="wb-stroke" [attr.x1]="it.x" [attr.y1]="it.y" [attr.x2]="it.x2" [attr.y2]="it.y2" stroke="currentColor" stroke-width="3" stroke-linecap="round" marker-end="url(#wb-head)" />
                  </g>
                }
                @case ('pen') {
                  <g [attr.transform]="'translate(' + it.x + ' ' + it.y + ')'" [style.color]="fill(it.color)">
                    <path class="wb-hit" [attr.data-id]="it.id" [attr.d]="penPath(it)" fill="none" stroke="transparent" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
                    <path class="wb-stroke" [attr.d]="penPath(it)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                }
              }
            }
            <defs>
              <marker id="wb-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M1 1 L9 5 L1 9" fill="none" stroke="context-stroke" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </marker>
            </defs>
          </svg>

          @for (it of htmlItems(); track it.id) {
            <div class="wb-item" [attr.data-id]="it.id"
                 [class.wb-item--note]="it.type === 'note'" [class.wb-item--task]="it.type === 'task'" [class.wb-item--text]="it.type === 'text'"
                 [style.left.px]="it.x" [style.top.px]="it.y" [style.width.px]="it.w" [style.height.px]="it.h"
                 [style.background]="it.type === 'note' ? fill(it.color) : null"
                 [style.color]="it.type === 'text' ? fill(it.color) : null"
                 [style.font-size.px]="it.type === 'text' ? 26 : null">
              @if (it.type === 'task') { <span class="wb-task-check"><lucide-icon [img]="TaskIcon" size="16" /></span> }
              @if (editingId() === it.id) {
                <textarea class="wb-edit" [value]="it.text" placeholder="{{ it.type === 'task' ? 'Task name' : 'Type something' }}"
                          (input)="setText(it.id, $any($event.target).value)" (blur)="endEdit()" (keydown.escape)="endEdit()"
                          (pointerdown)="$event.stopPropagation()"></textarea>
              } @else {
                <div class="wb-text">{{ it.text }}</div>
              }
            </div>
          }

          @if (selected(); as s) {
            <div class="wb-sel" [style.left.px]="box(s).x - 5" [style.top.px]="box(s).y - 5"
                 [style.width.px]="box(s).w + 10" [style.height.px]="box(s).h + 10">
              @if (resizable(s)) { <span class="wb-handle" [attr.data-handle]="s.id"></span> }
            </div>
          }
        </div>

        <!-- ── Onboarding hints ── -->
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

      <!-- ── Title (top-left) ── -->
      <div class="wb-title">
        <span class="wb-title__icon"><lucide-icon [img]="PenLine" size="13" /></span>
        <input class="wb-title__input" aria-label="Whiteboard name" [value]="title()" [style.width.ch]="titleWidth()"
               (input)="title.set($any($event.target).value)" (keydown.enter)="$any($event.target).blur()" />
        <button type="button" class="wb-icon-btn" [class.wb-icon-btn--on]="starred()" aria-label="Favorite" (click)="starred.set(!starred())">
          <lucide-icon [img]="Star" size="15" />
        </button>
      </div>

      <!-- ── Actions (top-right) ── -->
      <div class="wb-actions">
        <span class="wb-avatar"><lucide-icon [img]="User" size="13" /></span>
        <button type="button" class="wb-share" (click)="share()"><lucide-icon [img]="Share2" size="14" />Share</button>
        <div class="wb-menu-wrap">
          <button type="button" class="wb-icon-btn" aria-label="More" (click)="menuOpen.set(!menuOpen())"><lucide-icon [img]="Ellipsis" size="16" /></button>
          @if (menuOpen()) {
            <div class="wb-backdrop" (click)="menuOpen.set(false)"></div>
            <div class="wb-pop wb-pop--menu" role="menu">
              <button type="button" (click)="zoomFit(); menuOpen.set(false)">Zoom to fit</button>
              <button type="button" (click)="resetZoom(); menuOpen.set(false)">Reset zoom to 100%</button>
              <hr />
              <button type="button" class="wb-danger" (click)="clearAll(); menuOpen.set(false)">Clear canvas</button>
            </div>
          }
        </div>
        <button type="button" class="wb-icon-btn" aria-label="Fullscreen" (click)="toggleFullscreen()">
          <lucide-icon [img]="fullscreen() ? MinimizeIcon : MaximizeIcon" size="15" />
        </button>
        <button type="button" class="wb-icon-btn" aria-label="Close" (click)="close()"><lucide-icon [img]="XIcon" size="16" /></button>
      </div>

      <!-- ── Zoom controls (bottom-left) ── -->
      <div class="wb-zoom">
        <button type="button" class="wb-icon-btn" aria-label="Zoom to fit" (click)="zoomFit()"><lucide-icon [img]="ChevronsUp" size="15" /></button>
        <span class="wb-zoom__sep"></span>
        <button type="button" class="wb-icon-btn" aria-label="Zoom out" (click)="zoomBy(1 / 1.2)"><lucide-icon [img]="Minus" size="15" /></button>
        <button type="button" class="wb-zoom__pct" aria-label="Reset zoom" (click)="resetZoom()">{{ zoomPct() }}%</button>
        <button type="button" class="wb-icon-btn" aria-label="Zoom in" (click)="zoomBy(1.2)"><lucide-icon [img]="Plus" size="15" /></button>
      </div>

      <!-- ── Bottom toolbar ── -->
      <div class="wb-dock">
        @if (showColors()) {
          <div class="wb-colors" role="group" aria-label="Color">
            @for (c of palette; track c) {
              <button type="button" class="wb-swatch" [class.wb-swatch--on]="activeColor() === c" [class.wb-swatch--ink]="c === 'ink'"
                      [style.background]="c === 'ink' ? null : c" [attr.aria-label]="'Color ' + c" (click)="pickColor(c)"></button>
            }
            @if (selected()) {
              <span class="wb-colors__sep"></span>
              <button type="button" class="wb-icon-btn" aria-label="Delete" (click)="deleteSelected()"><lucide-icon [img]="Trash2" size="15" /></button>
            }
          </div>
        }
        @if (tplOpen()) {
          <div class="wb-backdrop" (click)="tplOpen.set(false)"></div>
          <div class="wb-pop wb-pop--tpl" role="menu">
            <b>Templates</b>
            <button type="button" (click)="applyTemplate('brainstorm')">Brainstorm</button>
            <button type="button" (click)="applyTemplate('flow')">Flowchart</button>
            <button type="button" (click)="applyTemplate('kanban')">Kanban</button>
          </div>
        }

        <div class="wb-toolbar" role="toolbar" aria-label="Whiteboard tools">
          @for (t of tools; track t.id) {
            <div class="wb-tool">
              <span class="wb-tool__key">{{ t.key }}</span>
              <button type="button" class="wb-tool__btn" [class.wb-tool__btn--on]="tool() === t.id" [attr.aria-label]="t.label" [attr.title]="t.label + ' (' + t.key + ')'" (click)="setTool(t.id)">
                @switch (t.id) {
                  @case ('select')  { <lucide-icon [img]="Pointer" size="20" /> }
                  @case ('hand')    { <lucide-icon [img]="HandIcon" size="20" /> }
                  @case ('task')    { <lucide-icon [img]="TaskIcon" size="20" /> }
                  @case ('pen')     { <lucide-icon [img]="PencilIcon" size="20" /> }
                  @case ('rect')    { <lucide-icon [img]="SquareIcon" size="20" /> }
                  @case ('ellipse') { <lucide-icon [img]="CircleIcon" size="20" /> }
                  @case ('arrow')   { <lucide-icon [img]="ArrowIcon" size="20" /> }
                  @case ('note')    { <lucide-icon [img]="NoteIcon" size="20" /> }
                  @case ('text')    { <lucide-icon [img]="TypeIcon" size="20" /> }
                }
              </button>
            </div>
          }
          <span class="wb-toolbar__sep"></span>
          <div class="wb-tool">
            <span class="wb-tool__key">&nbsp;</span>
            <button type="button" class="wb-tool__btn" [class.wb-tool__btn--on]="tplOpen()" aria-label="Templates" title="Templates" (click)="tplOpen.set(!tplOpen())">
              <lucide-icon [img]="TemplateIcon" size="20" />
            </button>
          </div>
          <span class="wb-toolbar__sep"></span>
          <div class="wb-history">
            <button type="button" class="wb-icon-btn" aria-label="Undo" [disabled]="!canUndo()" (click)="undo()"><lucide-icon [img]="Undo" size="15" /></button>
            <button type="button" class="wb-icon-btn" aria-label="Redo" [disabled]="!canRedo()" (click)="redo()"><lucide-icon [img]="Redo" size="15" /></button>
          </div>
        </div>
      </div>

      @if (toast()) { <div class="wb-toast" role="status">{{ toast() }}</div> }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; padding: 0 .75rem .75rem; box-sizing: border-box; }
    .wb {
      position: relative; height: 100%; overflow: hidden;
      background: var(--color-canvas); color: var(--color-text-primary);
      border: 1px solid var(--panel-border, var(--color-border)); border-radius: .875rem;
      font-size: .8125rem; user-select: none; -webkit-user-select: none;
    }

    /* Canvas + dot grid */
    .wb-canvas {
      position: absolute; inset: 0; overflow: hidden; touch-action: none; outline: none;
      background-image: radial-gradient(circle, var(--color-border-strong) 1.1px, transparent 1.3px);
      background-size: 24px 24px;
    }
    .wb-cursor-select { cursor: default; }
    .wb-cursor-hand { cursor: grab; }
    .wb--dragging .wb-cursor-hand { cursor: grabbing; }
    .wb-cursor-draw { cursor: crosshair; }
    .wb-world { position: absolute; left: 0; top: 0; width: 0; height: 0; transform-origin: 0 0; }
    .wb-svg { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
    .wb-shape, .wb-hit { pointer-events: all; cursor: move; }
    .wb-stroke { pointer-events: none; }
    .wb-cursor-draw .wb-shape, .wb-cursor-draw .wb-hit, .wb-cursor-draw .wb-item,
    .wb-cursor-hand .wb-shape, .wb-cursor-hand .wb-hit, .wb-cursor-hand .wb-item { cursor: inherit; }

    /* HTML items */
    .wb-item {
      position: absolute; box-sizing: border-box; cursor: move;
      font-family: 'Caveat', 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive;
    }
    .wb-item--note {
      padding: .9rem 1rem; border-radius: 6px; color: #1d1d1f; font-size: 22px; line-height: 1.2;
      box-shadow: 0 6px 16px rgba(0, 0, 0, .35);
    }
    .wb-item--task {
      display: flex; align-items: center; gap: .6rem; padding: 0 .9rem; border-radius: 10px;
      background: var(--color-surface-2); border: 1px solid var(--color-border-strong);
      font-family: inherit; font-family: var(--font-sans, Inter, system-ui, sans-serif); font-size: 15px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, .25);
    }
    .wb-item--text { padding: .15rem .25rem; line-height: 1.2; }
    .wb-task-check { flex: none; width: 1.4rem; height: 1.4rem; display: grid; place-items: center; border-radius: .4rem; color: #fff; background: var(--cu-plum, #ab4aba); }
    .wb-text, .wb-edit {
      flex: 1; min-width: 0; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; outline: none; resize: none;
      background: transparent; color: inherit; font: inherit; line-height: inherit;
      white-space: pre-wrap; word-break: break-word; overflow: hidden;
    }
    .wb-item--task .wb-text, .wb-item--task .wb-edit { height: auto; }
    .wb-edit { user-select: text; -webkit-user-select: text; cursor: text; }
    .wb-edit::placeholder { color: inherit; opacity: .45; }

    /* Selection */
    .wb-sel {
      position: absolute; pointer-events: none; box-sizing: border-box; border-radius: 6px;
      outline: calc(1.5px / var(--z, 1)) solid var(--color-accent, #7b68ee);
    }
    .wb-handle {
      position: absolute; right: 0; bottom: 0; pointer-events: all; cursor: nwse-resize;
      width: 12px; height: 12px; background: #fff; border: 2px solid var(--color-accent, #7b68ee); border-radius: 3px;
      transform: translate(50%, 50%) scale(calc(1 / var(--z, 1)));
    }

    /* Hints */
    .wb-hints { position: absolute; inset: 0; pointer-events: none; color: var(--color-text-secondary); font-family: 'Caveat', 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive; font-size: 1.35rem; line-height: 1.15; }
    .wb-hint { position: absolute; display: flex; gap: .35rem; align-items: center; font-weight: 600; letter-spacing: .01em; }
    .wb-hint--rename { left: 4.2rem; top: 3.8rem; align-items: flex-start; }
    .wb-hint--rename span { margin-top: 1.6rem; transform: rotate(6deg); }
    .wb-hint--share { right: 2.5rem; top: 3.5rem; align-items: flex-end; }
    .wb-hint--share svg { order: 2; margin-bottom: 1rem; }
    .wb-hint--share span { text-align: left; margin-top: 3rem; }
    .wb-hint--add { left: 50%; bottom: 6.4rem; transform: translateX(-50%); flex-direction: column; text-align: center; gap: .1rem; }
    .wb-hint--tpl { left: 50%; bottom: 6.4rem; margin-left: 12rem; flex-direction: column; align-items: flex-start; gap: .1rem; color: #f5b740; }
    .wb-hint--tpl span { white-space: nowrap; }
    .wb-hint--tpl svg { margin-left: 3.2rem; }
    .wb-hint--zoom { left: 1.6rem; bottom: 4.2rem; align-items: flex-end; }
    .wb-hint--zoom span { margin-bottom: 2rem; }
    .wb-hint__chip { display: inline-grid; place-items: center; vertical-align: middle; width: 1.5rem; height: 1.5rem; border-radius: .45rem; color: #fff; background: var(--cu-plum, #ab4aba); }
    .wb-hint u { text-decoration: none; color: var(--cu-plum, #c36ad0); }
    .wb-hint__star { color: #ffd666; font-style: normal; }
    .wb-hero { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%); text-align: center; }
    .wb-hero__card { position: relative; width: 15rem; height: 5rem; margin: 0 auto; border-radius: .5rem; box-sizing: border-box; }
    .wb-hero__card--back { position: absolute; left: 50%; top: .5rem; margin-left: -8.2rem; background: var(--color-surface-3); border: 1px solid var(--color-border-strong); transform: translate(-.4rem, .4rem); }
    .wb-hero__card--back::after { content: ''; position: absolute; inset: .3rem -.3rem -.3rem .3rem; border-radius: inherit; border: 1px solid var(--color-border); }
    .wb-hero__card--front { background: #e9ecff; border: 2px solid #4a5be8; display: grid; place-items: center; color: #f76808; }
    .wb-hero__card--front b { font-size: 2.1rem; font-weight: 700; transform: rotate(-2deg); }
    .wb-hero__h { position: absolute; width: .6rem; height: .6rem; background: #fff; border: 2px solid #4a5be8; border-radius: 2px; }
    .wb-hero__h--tl { left: -.35rem; top: -.35rem; } .wb-hero__h--tr { right: -.35rem; top: -.35rem; }
    .wb-hero__h--bl { left: -.35rem; bottom: -.35rem; } .wb-hero__h--br { right: -.35rem; bottom: -.35rem; }
    .wb-hero p { margin: 2.1rem 0 0; font-size: 1.45rem; line-height: 1.55; font-weight: 600; }
    .wb-hero svg { vertical-align: middle; margin: 0 .2rem; }

    /* Floating chrome */
    .wb-title, .wb-actions, .wb-zoom, .wb-toolbar, .wb-colors {
      background: var(--color-surface-1); border: 1px solid var(--color-border); box-shadow: 0 4px 16px rgba(0, 0, 0, .28);
    }
    .wb-title { position: absolute; left: .75rem; top: .75rem; display: flex; align-items: center; gap: .35rem; height: 2.4rem; padding: 0 .35rem 0 .6rem; border-radius: .6rem; }
    .wb-title__icon { width: 1.3rem; height: 1.3rem; display: grid; place-items: center; border-radius: .35rem; background: #f5a524; color: #1a1205; flex: none; }
    .wb-title__input { min-width: 4ch; max-width: 22rem; padding: .15rem .3rem; border: 0; border-radius: .3rem; outline: none; background: transparent; color: inherit; font: inherit; font-weight: 600; font-size: .85rem; user-select: text; -webkit-user-select: text; }
    .wb-title__input:hover { background: var(--color-surface-3); }
    .wb-title__input:focus { background: var(--color-surface-2); box-shadow: 0 0 0 1.5px var(--color-accent, #7b68ee); }
    .wb-actions { position: absolute; right: .75rem; top: .75rem; display: flex; align-items: center; gap: .2rem; height: 2.4rem; padding: 0 .4rem; border-radius: .6rem; }
    .wb-avatar { width: 1.6rem; height: 1.6rem; margin-right: .2rem; display: grid; place-items: center; border-radius: 50%; background: var(--color-surface-3); color: var(--color-text-secondary); }
    .wb-share { display: inline-flex; align-items: center; gap: .4rem; height: 1.9rem; padding: 0 .6rem; border: 0; border-radius: .45rem; background: transparent; color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
    .wb-share:hover { background: var(--color-surface-3); }
    .wb-menu-wrap { position: relative; display: flex; }

    .wb-icon-btn { width: 1.9rem; height: 1.9rem; display: inline-grid; place-items: center; border: 0; border-radius: .45rem; background: transparent; color: var(--color-text-secondary); cursor: pointer; flex: none; }
    .wb-icon-btn:hover:not(:disabled) { background: var(--color-surface-3); color: var(--color-text-primary); }
    .wb-icon-btn:disabled { opacity: .35; cursor: default; }
    .wb-icon-btn--on { color: #f5b740; }
    .wb-icon-btn--on lucide-icon { fill: currentColor; }

    .wb-zoom { position: absolute; left: .75rem; bottom: .75rem; display: flex; align-items: center; gap: .1rem; height: 2.4rem; padding: 0 .3rem; border-radius: .6rem; }
    .wb-zoom__sep { width: 1px; height: 1.1rem; margin: 0 .15rem; background: var(--color-border-strong); }
    .wb-zoom__pct { min-width: 3.2rem; height: 1.9rem; border: 0; border-radius: .45rem; background: transparent; color: var(--color-text-secondary); font: inherit; font-size: .75rem; cursor: pointer; }
    .wb-zoom__pct:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

    /* Dock */
    .wb-dock { position: absolute; left: 50%; bottom: .75rem; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: .6rem; max-width: calc(100% - 1.5rem); }
    .wb-toolbar { display: flex; align-items: flex-end; gap: .15rem; padding: .35rem .55rem .45rem; border-radius: 1rem; }
    .wb-toolbar__sep { width: 1px; align-self: stretch; margin: .9rem .35rem .1rem; background: var(--color-border-strong); }
    .wb-tool { display: flex; flex-direction: column; align-items: center; gap: .1rem; }
    .wb-tool__key { height: .8rem; font-size: .625rem; line-height: .8rem; color: var(--color-text-tertiary, var(--color-text-secondary)); opacity: .8; }
    .wb-tool__btn { width: 2.6rem; height: 2.6rem; display: grid; place-items: center; border: 1px solid transparent; border-radius: .7rem; background: transparent; color: var(--color-text-secondary); cursor: pointer; transition: background .12s, color .12s, transform .12s; }
    .wb-tool__btn:hover { background: var(--color-surface-3); color: var(--color-text-primary); transform: translateY(-2px); }
    .wb-tool__btn--on { background: var(--tint-soft, var(--color-surface-3)); color: var(--color-accent-bright, var(--color-accent)); border-color: var(--color-accent, #7b68ee); }
    .wb-history { display: flex; flex-direction: column; justify-content: flex-end; gap: .1rem; padding-bottom: .15rem; }
    .wb-history .wb-icon-btn { height: 1.55rem; }

    .wb-colors { display: flex; align-items: center; gap: .4rem; padding: .4rem .6rem; border-radius: .8rem; }
    .wb-colors__sep { width: 1px; height: 1.2rem; background: var(--color-border-strong); margin: 0 .1rem; }
    .wb-swatch { width: 1.3rem; height: 1.3rem; border-radius: 50%; border: 1px solid var(--color-border-strong); cursor: pointer; padding: 0; transition: transform .1s; }
    .wb-swatch:hover { transform: scale(1.15); }
    .wb-swatch--ink { background: var(--color-text-primary); }
    .wb-swatch--on { box-shadow: 0 0 0 2px var(--color-surface-1), 0 0 0 4px var(--color-accent, #7b68ee); }

    /* Popovers */
    .wb-backdrop { position: fixed; inset: 0; z-index: 4; }
    .wb-pop { position: absolute; z-index: 5; display: flex; flex-direction: column; min-width: 12rem; padding: .35rem; border-radius: .6rem; background: var(--color-surface-1); border: 1px solid var(--color-border); box-shadow: 0 8px 24px rgba(0, 0, 0, .4); }
    .wb-pop--menu { right: 0; top: calc(100% + .5rem); }
    .wb-pop--tpl { bottom: calc(100% + .6rem); right: 2rem; }
    .wb-pop b { padding: .35rem .6rem; font-size: .7rem; font-weight: 600; letter-spacing: .02em; color: var(--color-text-secondary); }
    .wb-pop button { text-align: left; padding: .5rem .6rem; border: 0; border-radius: .4rem; background: transparent; color: var(--color-text-primary); font: inherit; cursor: pointer; }
    .wb-pop button:hover { background: var(--color-surface-3); }
    .wb-pop hr { height: 1px; margin: .3rem .2rem; border: 0; background: var(--color-border); }
    .wb-pop .wb-danger { color: var(--cu-red, #e5484d); }
    .wb-dock { position: absolute; }
    .wb-dock .wb-pop--tpl { position: absolute; }

    .wb-toast { position: absolute; left: 50%; top: 4rem; transform: translateX(-50%); padding: .5rem .9rem; border-radius: .6rem; background: var(--color-surface-3); border: 1px solid var(--color-border-strong); box-shadow: 0 6px 18px rgba(0, 0, 0, .4); font-weight: 500; }

    @media (max-width: 900px) {
      .wb-hints { display: none; }
      .wb-tool__key { display: none; }
      .wb-toolbar { overflow-x: auto; }
      .wb-zoom { bottom: 5.4rem; }
    }
  `],
})
export class WhiteboardEditorComponent {
  private readonly location = inject(Location);
  private readonly injector = inject(Injector);
  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');

  readonly Pointer = MousePointer2; readonly HandIcon = Hand; readonly TaskIcon = SquareCheckBig;
  readonly PencilIcon = Pencil; readonly SquareIcon = Square; readonly CircleIcon = Circle;
  readonly ArrowIcon = MoveUpRight; readonly NoteIcon = StickyNote; readonly TypeIcon = Type;
  readonly TemplateIcon = LayoutTemplate; readonly Undo = Undo2; readonly Redo = Redo2;
  readonly Star = Star; readonly Share2 = Share2; readonly Ellipsis = Ellipsis; readonly User = User;
  readonly MaximizeIcon = Maximize2; readonly MinimizeIcon = Minimize2; readonly XIcon = X;
  readonly Minus = Minus; readonly Plus = Plus; readonly ChevronsUp = ChevronsUp;
  readonly Trash2 = Trash2; readonly PenLine = PenLine;

  readonly tools = TOOLS;
  readonly palette = PALETTE;

  readonly title = signal('Untitled whiteboard');
  readonly starred = signal(false);
  readonly items = signal<Item[]>([]);
  readonly view = signal<View>({ x: 0, y: 0, z: 1 });
  readonly tool = signal<Tool>('select');
  readonly selectedId = signal<number | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly activeColor = signal<string>('#ffd666');
  readonly menuOpen = signal(false);
  readonly tplOpen = signal(false);
  readonly fullscreen = signal(false);
  readonly toast = signal('');
  readonly dragging = signal(false);

  private undoStack: string[] = [];
  private redoStack: string[] = [];
  readonly historyTick = signal(0);
  readonly canUndo = computed(() => (this.historyTick(), this.undoStack.length > 0));
  readonly canRedo = computed(() => (this.historyTick(), this.redoStack.length > 0));

  private drag: Drag | null = null;
  private pending: string | null = null;
  private spaceDown = false;
  private nextId = 1;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  readonly htmlItems = computed(() => this.items().filter(i => i.type === 'note' || i.type === 'task' || i.type === 'text'));
  readonly selected = computed(() => this.items().find(i => i.id === this.selectedId()) ?? null);
  readonly gridSize = computed(() => { const g = 24 * this.view().z; return `${g}px ${g}px`; });
  readonly zoomPct = computed(() => Math.round(this.view().z * 100));
  readonly titleWidth = computed(() => Math.max(this.title().length, 4) + 1);
  readonly worldTransform = computed(() => { const v = this.view(); return `translate(${v.x}px, ${v.y}px) scale(${v.z})`; });
  readonly hintsDismissed = signal(false);
  readonly showHints = computed(() => !this.hintsDismissed() && this.items().length === 0);
  readonly showColors = computed(() => {
    const t = this.tool();
    return ['note', 'rect', 'ellipse', 'pen', 'arrow', 'text'].includes(t) || (!!this.selected() && this.selected()!.type !== 'task');
  });
  readonly cursor = computed(() => {
    const t = this.tool();
    if (t === 'hand' || this.spaceDown) return 'hand';
    return t === 'select' ? 'select' : 'draw';
  });

  constructor() {
    this.load();
    effect(() => {
      const data = JSON.stringify({ title: this.title(), starred: this.starred(), items: this.items(), view: this.view() });
      try { localStorage.setItem(STORAGE_KEY, data); } catch { /* storage unavailable */ }
    });
  }

  // ── Persistence ──
  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.title === 'string') this.title.set(d.title);
      this.starred.set(!!d.starred);
      if (Array.isArray(d.items)) { this.items.set(d.items); this.nextId = d.items.reduce((m: number, i: Item) => Math.max(m, i.id), 0) + 1; }
      if (d.view && typeof d.view.z === 'number') this.view.set(d.view);
    } catch { /* ignore corrupt state */ }
  }

  // ── History ──
  private pushHistory(snap: string): void {
    this.undoStack.push(snap); if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = []; this.historyTick.update(n => n + 1);
  }
  private snapshot(): void { this.pushHistory(JSON.stringify(this.items())); }
  undo(): void {
    const prev = this.undoStack.pop(); if (prev === undefined) return;
    this.redoStack.push(JSON.stringify(this.items()));
    this.items.set(JSON.parse(prev)); this.selectedId.set(null); this.editingId.set(null);
    this.historyTick.update(n => n + 1);
  }
  redo(): void {
    const next = this.redoStack.pop(); if (next === undefined) return;
    this.undoStack.push(JSON.stringify(this.items()));
    this.items.set(JSON.parse(next)); this.selectedId.set(null); this.editingId.set(null);
    this.historyTick.update(n => n + 1);
  }

  // ── Helpers ──
  fill(c: string): string { return c === 'ink' ? 'var(--color-text-primary)' : c; }
  penPath(it: Item): string { return it.pts.length ? 'M' + it.pts.map(p => `${p[0]} ${p[1]}`).join(' L') : ''; }
  box(it: Item): { x: number; y: number; w: number; h: number } {
    if (it.type === 'arrow') return { x: Math.min(it.x, it.x2), y: Math.min(it.y, it.y2), w: Math.abs(it.x2 - it.x), h: Math.abs(it.y2 - it.y) };
    return { x: it.x, y: it.y, w: it.w, h: it.h };
  }
  resizable(it: Item): boolean { return it.type !== 'arrow' && it.type !== 'pen'; }

  private world(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const r = this.canvas().nativeElement.getBoundingClientRect(); const v = this.view();
    return { x: (e.clientX - r.left - v.x) / v.z, y: (e.clientY - r.top - v.y) / v.z };
  }
  private blank(type: ItemType, x: number, y: number, w = 0, h = 0, color = this.activeColor()): Item {
    return { id: this.nextId++, type, x, y, w, h, x2: x, y2: y, pts: [], text: '', color };
  }
  private patch(id: number, fn: (i: Item) => Item): void { this.items.update(l => l.map(i => (i.id === id ? fn(i) : i))); }

  // ── Tools ──
  setTool(t: Tool): void {
    this.endEdit(); this.tool.set(t); this.tplOpen.set(false);
    if (t !== 'select') this.selectedId.set(null);
    const defaults: Partial<Record<Tool, string>> = { note: '#ffd666', rect: '#ffffff', ellipse: '#ffffff', pen: 'ink', arrow: 'ink', text: 'ink' };
    if (defaults[t]) this.activeColor.set(defaults[t]!);
  }
  pickColor(c: string): void {
    this.activeColor.set(c);
    const s = this.selected();
    if (s) { this.snapshot(); this.patch(s.id, i => ({ ...i, color: c })); }
  }

  // ── Pointer handling ──
  onPointerDown(e: PointerEvent): void {
    if ((e.target as HTMLElement).closest('textarea')) return;
    this.menuOpen.set(false); this.tplOpen.set(false);
    if (this.editingId() !== null) this.endEdit();
    const el = this.canvas().nativeElement; el.setPointerCapture(e.pointerId); el.focus({ preventScroll: true });
    const w = this.world(e); const t = this.tool(); const target = e.target as Element;
    const base = { cx: e.clientX, cy: e.clientY, wx: w.x, wy: w.y };
    this.dragging.set(true);

    if (e.button === 1 || this.spaceDown || t === 'hand') { this.drag = { ...base, mode: 'pan', view0: this.view() }; return; }

    if (t === 'select') {
      const handle = target.closest('[data-handle]');
      if (handle) {
        const id = Number(handle.getAttribute('data-handle')); const snap = this.items().find(i => i.id === id);
        if (snap) { this.pending = JSON.stringify(this.items()); this.drag = { ...base, mode: 'resize', id, snap: { ...snap } }; return; }
      }
      const hit = target.closest('[data-id]');
      if (hit) {
        const id = Number(hit.getAttribute('data-id')); const snap = this.items().find(i => i.id === id);
        this.selectedId.set(id);
        if (snap) { this.activeColor.set(snap.color); this.pending = JSON.stringify(this.items()); this.drag = { ...base, mode: 'move', id, snap: { ...snap, pts: snap.pts.map(p => [...p]) } }; }
        return;
      }
      this.selectedId.set(null);
      this.drag = { ...base, mode: 'pan', view0: this.view() };
      return;
    }

    this.hintsDismissed.set(true);
    if (t === 'note' || t === 'task' || t === 'text') {
      const dims = t === 'note' ? [190, 190] : t === 'task' ? [250, 52] : [260, 40];
      const it = this.blank(t, w.x - dims[0] / 2, w.y - dims[1] / 2, dims[0], dims[1], t === 'task' ? '#ffffff' : this.activeColor());
      this.snapshot(); this.items.update(l => [...l, it]);
      this.tool.set('select'); this.selectedId.set(it.id); this.startEdit(it.id); this.drag = null; this.dragging.set(false);
      return;
    }
    if (t === 'rect' || t === 'ellipse') {
      const it = this.blank(t, w.x, w.y); this.snapshot(); this.items.update(l => [...l, it]);
      this.drag = { ...base, mode: 'size', id: it.id }; this.selectedId.set(it.id); return;
    }
    if (t === 'arrow') {
      const it = this.blank('arrow', w.x, w.y); this.snapshot(); this.items.update(l => [...l, it]);
      this.drag = { ...base, mode: 'arrow', id: it.id }; return;
    }
    if (t === 'pen') {
      const it = { ...this.blank('pen', w.x, w.y), pts: [[0, 0]] }; this.snapshot(); this.items.update(l => [...l, it]);
      this.drag = { ...base, mode: 'pen', id: it.id };
    }
  }

  onPointerMove(e: PointerEvent): void {
    const d = this.drag; if (!d) return;
    const w = this.world(e); const z = this.view().z;
    if (!d.moved && Math.hypot(e.clientX - d.cx, e.clientY - d.cy) > 3) d.moved = true;
    switch (d.mode) {
      case 'pan': {
        const v0 = d.view0!; this.view.set({ ...v0, x: v0.x + e.clientX - d.cx, y: v0.y + e.clientY - d.cy }); break;
      }
      case 'move': {
        if (!d.moved) return;
        this.flushPending();
        const dx = w.x - d.wx, dy = w.y - d.wy; const s = d.snap!;
        this.patch(d.id!, i => ({ ...i, x: s.x + dx, y: s.y + dy, x2: s.x2 + dx, y2: s.y2 + dy })); break;
      }
      case 'resize': {
        if (!d.moved) return;
        this.flushPending();
        const s = d.snap!; const minW = s.type === 'task' ? 120 : 40; const minH = s.type === 'task' ? 40 : 28;
        this.patch(d.id!, i => ({ ...i, w: Math.max(minW, s.w + (w.x - d.wx)), h: Math.max(minH, s.h + (w.y - d.wy)) })); break;
      }
      case 'size': {
        const x = Math.min(d.wx, w.x), y = Math.min(d.wy, w.y);
        this.patch(d.id!, i => ({ ...i, x, y, w: Math.abs(w.x - d.wx), h: Math.abs(w.y - d.wy) })); break;
      }
      case 'arrow': this.patch(d.id!, i => ({ ...i, x2: w.x, y2: w.y })); break;
      case 'pen': {
        const dist = 2 / z;
        this.patch(d.id!, i => {
          const last = i.pts[i.pts.length - 1]; const px = w.x - i.x, py = w.y - i.y;
          return Math.hypot(px - last[0], py - last[1]) < dist ? i : { ...i, pts: [...i.pts, [px, py]] };
        }); break;
      }
    }
  }

  onPointerUp(e: PointerEvent): void {
    const d = this.drag; this.drag = null; this.dragging.set(false); this.pending = null;
    try { this.canvas().nativeElement.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
    if (!d) return;
    if (d.mode === 'size') {
      this.patch(d.id!, i => (i.w < 8 && i.h < 8 ? { ...i, w: 170, h: 120 } : i)); this.tool.set('select');
    } else if (d.mode === 'arrow') {
      const it = this.items().find(i => i.id === d.id);
      if (it && Math.hypot(it.x2 - it.x, it.y2 - it.y) < 12) this.items.update(l => l.filter(i => i.id !== d.id));
      else this.selectedId.set(d.id!);
      this.tool.set('select');
    } else if (d.mode === 'pen') {
      this.patch(d.id!, i => {
        const xs = i.pts.map(p => p[0]), ys = i.pts.map(p => p[1]);
        const minX = Math.min(...xs), minY = Math.min(...ys);
        return { ...i, x: i.x + minX, y: i.y + minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY, pts: i.pts.map(p => [p[0] - minX, p[1] - minY]) };
      });
    }
  }
  private flushPending(): void { if (this.pending) { this.pushHistory(this.pending); this.pending = null; } }

  onDblClick(e: MouseEvent): void {
    const hit = (e.target as Element).closest('[data-id]');
    if (hit) {
      const id = Number(hit.getAttribute('data-id')); const it = this.items().find(i => i.id === id);
      if (it && (it.type === 'note' || it.type === 'task' || it.type === 'text')) { this.selectedId.set(id); this.startEdit(id); }
      return;
    }
    if ((e.target as Element).closest('textarea')) return;
    const w = this.world(e); const it = this.blank('text', w.x - 20, w.y - 16, 260, 40, 'ink');
    this.hintsDismissed.set(true); this.snapshot(); this.items.update(l => [...l, it]); this.selectedId.set(it.id); this.startEdit(it.id);
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) { this.zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY); return; }
    this.view.update(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
  }

  // ── Text editing ──
  startEdit(id: number): void {
    this.snapshot(); this.editingId.set(id);
    afterNextRender(() => {
      const ta = this.canvas().nativeElement.querySelector<HTMLTextAreaElement>('.wb-edit');
      ta?.focus(); ta?.setSelectionRange(ta.value.length, ta.value.length);
    }, { injector: this.injector });
  }
  setText(id: number, text: string): void { this.patch(id, i => ({ ...i, text })); }
  endEdit(): void {
    const id = this.editingId(); if (id === null) return;
    this.editingId.set(null);
    const it = this.items().find(i => i.id === id);
    if (it && !it.text.trim()) this.items.update(l => l.filter(i => i.id !== id));
    if (this.selectedId() === id && !this.items().some(i => i.id === id)) this.selectedId.set(null);
  }

  deleteSelected(): void {
    const id = this.selectedId(); if (id === null) return;
    this.snapshot(); this.items.update(l => l.filter(i => i.id !== id)); this.selectedId.set(null);
  }
  clearAll(): void { if (!this.items().length) return; this.snapshot(); this.items.set([]); this.selectedId.set(null); }

  // ── Zoom ──
  private zoomAt(factor: number, cx: number, cy: number): void {
    const r = this.canvas().nativeElement.getBoundingClientRect(); const px = cx - r.left, py = cy - r.top;
    this.view.update(v => {
      const z = Math.min(4, Math.max(0.1, v.z * factor)); const k = z / v.z;
      return { z, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
    });
  }
  zoomBy(f: number): void { const r = this.canvas().nativeElement.getBoundingClientRect(); this.zoomAt(f, r.left + r.width / 2, r.top + r.height / 2); }
  resetZoom(): void { const r = this.canvas().nativeElement.getBoundingClientRect(); this.zoomAt(1 / this.view().z, r.left + r.width / 2, r.top + r.height / 2); }
  zoomFit(): void {
    const list = this.items(); const r = this.canvas().nativeElement.getBoundingClientRect();
    if (!list.length) { this.view.set({ x: 0, y: 0, z: 1 }); return; }
    const boxes = list.map(i => this.box(i));
    const x1 = Math.min(...boxes.map(b => b.x)), y1 = Math.min(...boxes.map(b => b.y));
    const x2 = Math.max(...boxes.map(b => b.x + b.w)), y2 = Math.max(...boxes.map(b => b.y + b.h));
    const pad = 120; const z = Math.min(2, Math.max(0.1, Math.min((r.width - pad) / Math.max(1, x2 - x1), (r.height - pad * 1.5) / Math.max(1, y2 - y1))));
    this.view.set({ z, x: (r.width - (x2 - x1) * z) / 2 - x1 * z, y: (r.height - (y2 - y1) * z) / 2 - y1 * z - 20 });
  }

  // ── Templates ──
  applyTemplate(name: 'brainstorm' | 'flow' | 'kanban'): void {
    this.tplOpen.set(false); this.hintsDismissed.set(true); this.snapshot();
    const r = this.canvas().nativeElement.getBoundingClientRect(); const v = this.view();
    const cx = (r.width / 2 - v.x) / v.z, cy = (r.height / 2 - v.y) / v.z - 40;
    const add: Item[] = [];
    const note = (x: number, y: number, text: string, color: string) => { const i = this.blank('note', cx + x, cy + y, 170, 150, color); i.text = text; add.push(i); };
    const rect = (x: number, y: number, w: number, h: number) => { const i = this.blank('rect', cx + x, cy + y, w, h, '#ffffff'); add.push(i); };
    const label = (x: number, y: number, text: string, w = 200) => { const i = this.blank('text', cx + x, cy + y, w, 40, 'ink'); i.text = text; add.push(i); };
    const arrow = (x1: number, y1: number, x2: number, y2: number) => { const i = this.blank('arrow', cx + x1, cy + y1, 0, 0, 'ink'); i.x2 = cx + x2; i.y2 = cy + y2; add.push(i); };
    if (name === 'brainstorm') {
      note(-85, -75, 'Main idea', '#ffd666');
      note(-330, -230, 'Idea 1', '#ff9ec7'); note(160, -230, 'Idea 2', '#8ec5ff');
      note(-330, 100, 'Idea 3', '#8fe3a7'); note(160, 100, 'Idea 4', '#c4a7ff');
      arrow(-160, -80, -110, -50); arrow(160, -80, 100, -50); arrow(-160, 110, -100, 60); arrow(160, 110, 100, 60);
    } else if (name === 'flow') {
      rect(-420, -40, 170, 80); label(-410, -20, 'Start', 150);
      rect(-130, -40, 170, 80); label(-120, -20, 'Do the work', 150);
      rect(160, -40, 170, 80); label(170, -20, 'Review', 150);
      arrow(-250, 0, -132, 0); arrow(40, 0, 158, 0);
    } else {
      label(-400, -210, 'To do', 200); label(-90, -210, 'In progress', 200); label(220, -210, 'Done', 200);
      for (const x of [-410, -100, 210]) rect(x, -160, 270, 330);
      note(-380, -130, 'Task A', '#ffd666'); note(-380, 50, 'Task B', '#ff9ec7'); note(-70, -130, 'Task C', '#8ec5ff');
    }
    this.items.update(l => [...l, ...add]); this.selectedId.set(null);
  }

  // ── Chrome ──
  share(): void {
    const url = typeof location !== 'undefined' ? location.href : '';
    try { void navigator.clipboard?.writeText(url); } catch { /* clipboard blocked */ }
    this.showToast('Link copied to clipboard');
  }
  private showToast(msg: string): void { this.toast.set(msg); clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.toast.set(''), 2200); }
  close(): void { this.location.back(); }
  toggleFullscreen(): void {
    const doc = document;
    if (doc.fullscreenElement) { void doc.exitFullscreen(); this.fullscreen.set(false); }
    else { void doc.documentElement.requestFullscreen?.(); this.fullscreen.set(true); }
  }

  // ── Keyboard ──
  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent): void { if (e.code === 'Space') { this.spaceDown = false; } }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    const el = e.target as HTMLElement | null;
    if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable)) return;
    if (this.editingId() !== null) return;
    const mod = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
    if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); this.redo(); return; }
    if (mod) return;
    if (e.code === 'Space') { this.spaceDown = true; e.preventDefault(); return; }
    if (k === 'delete' || k === 'backspace') { this.deleteSelected(); return; }
    if (k === 'escape') { this.setTool('select'); this.selectedId.set(null); this.menuOpen.set(false); this.tplOpen.set(false); return; }
    if (k === '+' || k === '=') { this.zoomBy(1.2); return; }
    if (k === '-') { this.zoomBy(1 / 1.2); return; }
    if (k === 't' && e.shiftKey) { this.setTool('task'); return; }
    const map: Record<string, Tool> = { v: 'select', h: 'hand', d: 'pen', r: 'rect', o: 'ellipse', a: 'arrow', n: 'note', t: 'text' };
    if (map[k] && !e.shiftKey) this.setTool(map[k]);
  }
}
