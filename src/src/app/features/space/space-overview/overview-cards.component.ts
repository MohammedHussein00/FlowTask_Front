import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Bookmark, FileText, Folder, RefreshCw,
  Maximize2, Plus, MoreHorizontal, GripVertical,
  ArrowUpFromLine, List,
} from 'lucide-angular';

@Component({
  selector: 'app-overview-cards',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- ── Row 1: Recent | Docs | Bookmarks ── -->
    <div class="ovc-grid ovc-grid--3">
      <article class="ovc-card">
        <h2 class="ovc-title">Recent</h2>
        <div class="ovc-empty">
          <div class="ovc-glyph ovc-glyph--recent">
            <lucide-icon [img]="RefreshCw" size="26" />
          </div>
          <p>Your recently opened items will appear here.</p>
          <button class="ovc-outline-btn" type="button">Learn more</button>
        </div>
      </article>

      <article class="ovc-card">
        <h2 class="ovc-title">Docs</h2>
        <div class="ovc-empty">
          <lucide-icon [img]="FileText" size="46" strokeWidth="1.2" />
          <p>There are no Docs in this location yet.</p>
          <button class="ovc-outline-btn" type="button">Add a Doc</button>
        </div>
      </article>

      <article class="ovc-card">
        <h2 class="ovc-title">Bookmarks</h2>
        <div class="ovc-empty">
          <div class="ovc-glyph ovc-glyph--bookmark">
            <lucide-icon [img]="Bookmark" size="25" />
            <b>+</b>
          </div>
          <p>Bookmarks make it easy to save ClickUp items or any URL from around the web.</p>
          <button class="ovc-outline-btn" type="button">Add Bookmark</button>
        </div>
      </article>
    </div>

    <!-- ── Folders ── -->
    <article class="ovc-section">
      <div class="ovc-section__hdr">
        <lucide-icon class="ovc-grip" [img]="GripVertical" size="15" />
        <h2 class="ovc-section__title">Folders</h2>
        <div class="ovc-section__acts">
          <button class="ovc-icon-btn" type="button"><lucide-icon [img]="Maximize2" size="13" /></button>
          <button class="ovc-icon-btn" type="button"><lucide-icon [img]="Plus" size="13" /></button>
          <button class="ovc-icon-btn" type="button"><lucide-icon [img]="MoreHorizontal" size="13" /></button>
        </div>
      </div>
      <div class="ovc-section__empty">
        <lucide-icon [img]="Folder" size="50" strokeWidth="1.2" />
        <p>Add new Folder to your Space</p>
        <button class="ovc-outline-btn" type="button">Add Folder</button>
      </div>
    </article>

    <!-- ── Lists ── -->
    <article class="ovc-section">
      <div class="ovc-section__hdr">
        <lucide-icon class="ovc-grip" [img]="GripVertical" size="15" />
        <h2 class="ovc-section__title">Lists</h2>
        <div class="ovc-section__acts">
          <button class="ovc-icon-btn" type="button"><lucide-icon [img]="Maximize2" size="13" /></button>
          <button class="ovc-icon-btn" type="button"><lucide-icon [img]="MoreHorizontal" size="13" /></button>
        </div>
      </div>
      <div class="ovc-section__empty">
        <lucide-icon [img]="List" size="50" strokeWidth="1.2" />
        <p>Add a new List to your Space</p>
        <button class="ovc-outline-btn" type="button">Add List</button>
      </div>
    </article>

    <!-- ── Resources | Workload ── -->
    <div class="ovc-grid ovc-grid--2">
      <article class="ovc-card ovc-card--tall">
        <h2 class="ovc-title">Resources</h2>
        <div class="ovc-dropzone">
          <lucide-icon [img]="ArrowUpFromLine" size="16" />
          Drop files here or <a href="#" (click)="$event.preventDefault()">attach</a>
        </div>
      </article>
      <article class="ovc-card ovc-card--tall">
        <h2 class="ovc-title">Workload by Status</h2>
        <div class="ovc-empty ovc-empty--sm">
          <p class="ovc-noresults">No Results</p>
        </div>
      </article>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    /* Grid helpers */
    .ovc-grid {
      display: grid; gap: .7rem;
      padding: .75rem .75rem 0;
    }
    .ovc-grid--3 { grid-template-columns: repeat(3, minmax(0,1fr)); }
    .ovc-grid--2 { grid-template-columns: repeat(2, minmax(0,1fr)); padding-bottom: .75rem; }

    /* Card */
    .ovc-card {
      min-height: 18rem; display: flex; flex-direction: column;
      border: 1px solid var(--color-border); border-radius: .7rem;
      background: var(--color-surface-1); overflow: hidden;
    }
    .ovc-card--tall { min-height: 15rem; }
    .ovc-title {
      margin: .9rem 1rem .05rem;
      font-size: .73rem; font-weight: 600; color: var(--color-text-primary);
    }

    /* Empty state */
    .ovc-empty {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: .5rem; padding: 1rem 1.5rem; text-align: center;
      color: var(--color-text-muted);
    }
    .ovc-empty--sm { gap: .3rem; }
    .ovc-empty > lucide-icon { opacity: .7; }
    .ovc-empty p {
      margin: 0; max-width: 14rem;
      color: var(--color-text-secondary); font-size: .64rem; line-height: 1.5;
    }
    .ovc-noresults { margin: 0; color: var(--color-text-muted); font-size: .72rem; }

    /* Glyphs */
    .ovc-glyph {
      display: grid; place-items: center;
      border: 1px solid var(--color-border-strong);
      border-radius: .9rem; color: var(--color-text-muted);
    }
    .ovc-glyph--recent { width: 2.9rem; height: 2.9rem; }
    .ovc-glyph--bookmark { position: relative; width: 3.1rem; height: 3.5rem; }
    .ovc-glyph--bookmark b {
      position: absolute; inset-inline-end: -.5rem; inset-block-end: -.3rem;
      width: 1.1rem; height: 1.1rem; display: grid; place-items: center;
      border-radius: 50%; background: var(--color-text-muted); color: #fff; font-size: .72rem;
    }

    /* Outline button */
    .ovc-outline-btn {
      display: inline-flex; align-items: center; justify-content: center;
      min-height: 1.85rem; padding: 0 .9rem;
      border: 1px solid var(--color-border-strong); border-radius: .38rem;
      background: var(--color-surface-2); color: var(--color-text-primary);
      font: inherit; font-size: .68rem; font-weight: 600; cursor: pointer;
    }
    .ovc-outline-btn:hover { background: var(--color-surface-3); }

    /* Section card (Folders / Lists) */
    .ovc-section {
      margin: .7rem .75rem 0;
      border: 1px solid var(--color-border); border-radius: .7rem;
      background: var(--color-surface-1); overflow: hidden;
    }
    .ovc-section__hdr {
      display: flex; align-items: center; gap: .4rem;
      padding: .6rem .75rem;
      border-bottom: 1px solid var(--color-border);
    }
    .ovc-grip { color: var(--color-text-muted); opacity: .55; cursor: grab; }
    .ovc-section__title { flex: 1; margin: 0; font-size: .73rem; font-weight: 600; color: var(--color-text-primary); }
    .ovc-section__acts { display: flex; align-items: center; gap: .1rem; }
    .ovc-icon-btn {
      display: grid; place-items: center; width: 1.6rem; height: 1.6rem;
      border: 0; border-radius: .32rem; background: transparent;
      color: var(--color-text-muted); cursor: pointer;
    }
    .ovc-icon-btn:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

    .ovc-section__empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: .55rem; padding: 2.5rem 1rem; text-align: center; color: var(--color-text-muted);
    }
    .ovc-section__empty > lucide-icon { opacity: .65; }
    .ovc-section__empty p { margin: 0; color: var(--color-text-secondary); font-size: .68rem; }

    /* Dropzone */
    .ovc-dropzone {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: .4rem;
      margin: .75rem; border: 1px dashed var(--color-border-strong); border-radius: .5rem;
      background: var(--color-surface-2); color: var(--color-text-muted); font-size: .7rem;
      min-height: 10rem;
    }
    .ovc-dropzone a { color: var(--color-accent-bright, var(--color-accent)); text-decoration: underline; }

    /* Responsive */
    @media (max-width: 900px) {
      .ovc-grid--3 { grid-template-columns: 1fr 1fr; }
      .ovc-grid--3 .ovc-card:last-child { grid-column: span 2; }
    }
    @media (max-width: 600px) {
      .ovc-grid--3, .ovc-grid--2 { grid-template-columns: 1fr; }
      .ovc-grid--3 .ovc-card:last-child { grid-column: auto; }
    }
  `],
})
export class OverviewCardsComponent {
  readonly RefreshCw = RefreshCw;
  readonly FileText = FileText;
  readonly Bookmark = Bookmark;
  readonly Folder = Folder;
  readonly GripVertical = GripVertical;
  readonly Maximize2 = Maximize2;
  readonly Plus = Plus;
  readonly MoreHorizontal = MoreHorizontal;
  readonly List = List;
  readonly ArrowUpFromLine = ArrowUpFromLine;
}
