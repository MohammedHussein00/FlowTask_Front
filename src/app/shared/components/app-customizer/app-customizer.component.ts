/** ClickUp reference fidelity: the "Customize" panel — Navigation / Home / Sections / Themes tabs. */
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { LucideAngularModule, Check, GripVertical, Plus, X } from 'lucide-angular';
import { NotificationService } from '../../../core/errors/notification.service';
import { AccentName, ThemeService } from '../../../core/theme/theme.service';
import { WorkspaceCustomizationService } from '../../../core/theme/workspace-customization.service';

type CustomizerTab = 'navigation' | 'home' | 'sections' | 'themes';

const ACCENT_SWATCHES: { id: AccentName; label: string }[] = [
  { id: 'black', label: 'Black' }, { id: 'purple', label: 'Purple' }, { id: 'blue', label: 'Blue' },
  { id: 'pink', label: 'Pink' }, { id: 'violet', label: 'Violet' }, { id: 'indigo', label: 'Indigo' },
  { id: 'orange', label: 'Orange' }, { id: 'teal', label: 'Teal' }, { id: 'bronze', label: 'Bronze' },
  { id: 'mint', label: 'Mint' },
];

@Component({ selector: 'app-customizer', standalone: true, imports: [LucideAngularModule], changeDetection: ChangeDetectionStrategy.OnPush, template: `
  <div class="customizer-backdrop" (click)="close.emit()">
    <section class="customizer" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-label="Customize appearance">
      <header><div><h2>Customize</h2><p>Personalize and organize your Flowspace interface</p></div><button type="button" aria-label="Close customize panel" (click)="close.emit()"><lucide-icon [img]="X" size="18" /></button></header>

      <div class="customizer-tabs">
        <button type="button" [class.selected]="tab() === 'navigation'" (click)="tab.set('navigation')">Navigation</button>
        <button type="button" [class.selected]="tab() === 'home'" (click)="tab.set('home')">Home</button>
        <button type="button" [class.selected]="tab() === 'sections'" (click)="tab.set('sections')">Sections</button>
        <button type="button" [class.selected]="tab() === 'themes'" (click)="tab.set('themes')">Themes</button>
      </div>

      <div class="customizer-body">
        @switch (tab()) {
          @case ('navigation') {
            <div class="check-list">
              @for (item of workspace.railItems(); track item.id) {
                <button type="button" class="check-row" [class.disabled]="item.locked" (click)="workspace.toggleRailItem(item.id)">
                  <span class="checkbox" [class.checked]="item.checked">
                    @if (item.checked) {
                      <lucide-icon [img]="Check" size="10" />
                    }
                  </span>
                  <span class="check-row__body"><strong>{{ item.label }}</strong>@if (item.hint) { <small>{{ item.hint }}</small> }</span>
                </button>
              }
            </div>
            <p class="customizer-label">Appearance</p>
            <div class="density-options">
              <button type="button" [class.selected]="workspace.navDensity() === 'icons'" (click)="workspace.setNavDensity('icons')">
                <span class="density-preview density-preview--icons">
                  <i></i><i></i><i></i>
                </span>
                Icons only
              </button>
              <button type="button" [class.selected]="workspace.navDensity() === 'icons-labels'" (click)="workspace.setNavDensity('icons-labels')">
                <span class="density-preview density-preview--labels">
                  <i></i><b></b><i></i><b></b>
                </span>
                Icons &amp; Labels
              </button>
            </div>
          }
          @case ('home') {
            <div class="check-list check-list--tall">
              @for (item of workspace.homeItems(); track item.id) {
                <button type="button" class="check-row" (click)="workspace.toggleHomeItem(item.id)">
                  <span class="checkbox" [class.checked]="item.checked">
                    @if (item.checked) {
                      <lucide-icon [img]="Check" size="10" />
                    }
                  </span>
                  <strong>{{ item.label }}</strong>
                </button>
              }
            </div>
          }
          @case ('sections') {
            <div class="section-list">
              @for (section of workspace.sections(); track section.id; let i = $index) {
                <div class="section-row" draggable="true" (dragstart)="dragIndex.set(i)" (dragover)="$event.preventDefault()" (drop)="onDrop(i)"><lucide-icon [img]="GripVertical" size="15" />{{ section.label }}</div>
              }
              <button type="button" class="section-create"><lucide-icon [img]="Plus" size="15" />Create section</button>
            </div>
            <p class="customizer-label">Hidden sections</p>
            <p class="section-hint">All sections shown</p>
          }
          @case ('themes') {
            <p class="customizer-label">Appearance</p>
            <div class="appearance-options">
              <button type="button" [class.selected]="theme.preference().mode === 'light'" (click)="setMode('light')"><span class="appearance-preview appearance-preview--light"><i></i><b></b><em></em></span><strong>Light</strong></button>
              <button type="button" [class.selected]="theme.preference().mode === 'dark'" (click)="setMode('dark')"><span class="appearance-preview appearance-preview--dark"><i></i><b></b><em></em></span><strong>Dark</strong></button>
              <button type="button" [class.selected]="theme.preference().mode === 'system'" (click)="setMode('system')"><span class="appearance-preview appearance-preview--auto"><i></i><b></b><em></em></span><strong>Auto</strong></button>
            </div>
            <p class="customizer-label theme-label">Flowspace theme</p>
            <div class="accent-grid">
              @for (accent of accents; track accent.id) {
                <button type="button" [class.selected]="theme.preference().accent === accent.id" (click)="setAccent(accent.id)"><i [class]="'accent-dot accent-dot--' + accent.id"></i>{{ accent.label }}</button>
              }
            </div>
          }
        }
      </div>
    </section>
  </div>
`,
  styles: [`
    :host { display: contents; }
    .customizer-backdrop { position: fixed; z-index: 50; inset: 0; display: grid; place-items: center; padding: 1rem; background: rgb(0 0 0 / .6); }
    .customizer { width: min(27rem, 100%); max-height: min(38rem, calc(100vh - 3rem)); overflow-y: auto; border: 1px solid var(--color-border-strong); border-radius: .9rem; color: var(--color-text-primary); background: var(--color-surface-1); box-shadow: var(--shadow-lg); }
    .customizer header { position: sticky; inset-block-start: 0; z-index: 2; display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; padding: 1.05rem 1.05rem .55rem; background: var(--color-surface-1); }
    .customizer header h2 { margin: 0 0 .2rem; font-size: 1rem; }
    .customizer header p { margin: 0; color: var(--color-text-secondary); font-size: .83rem; }
    .customizer header > button { width: 1.9rem; height: 1.9rem; display: grid; place-items: center; border: 0; border-radius: .4rem; color: var(--color-text-secondary); background: transparent; cursor: pointer; }
    .customizer header > button:hover { color: var(--color-text-primary); background: var(--color-surface-3); }
    .customizer-tabs { display: flex; gap: .2rem; padding: 0 1.05rem .65rem; border-bottom: 1px solid var(--color-border); }
    .customizer-tabs button { min-height: 1.9rem; padding: 0 .65rem; border: 0; border-radius: .4rem; color: var(--color-text-secondary); background: transparent; font: inherit; font-size: .83rem; font-weight: 700; cursor: pointer; }
    .customizer-tabs button:hover { color: var(--color-text-primary); }
    .customizer-tabs button.selected { color: var(--color-surface-1); background: var(--color-text-primary); }
    :root[data-theme="dark"] .customizer-tabs button.selected { color: #191919; }
    .customizer-body { padding: .8rem 1.05rem 1.3rem; }
    .customizer-label { margin: .35rem 0 .6rem; color: var(--color-text-secondary); font-size: .74rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
    .theme-label { margin-top: 1.1rem; }
    .check-list { display: grid; gap: .1rem; max-height: 20rem; overflow-y: auto; }
    .check-list--tall { max-height: 26rem; }
    .check-row { width: 100%; display: flex; align-items: center; gap: .6rem; padding: .45rem .35rem; border: 0; border-radius: .4rem; background: transparent; font: inherit; text-align: start; cursor: pointer; }
    .check-row:hover { background: var(--color-surface-2); }
    .check-row.disabled { cursor: default; }
    .check-row__body { display: flex; flex-direction: column; gap: .1rem; }
    .check-row strong { color: var(--color-text-primary); font-size: .87rem; font-weight: 650; }
    .check-row small { color: var(--color-text-muted); font-size: .71rem; }

    /* ── Checkbox: centered checkmark, theme-accurate colors ── */
    .checkbox {
      flex: none;
      width: 1.1rem; height: 1.1rem;
      display: grid; place-items: center;        /* centers the lucide-icon */
      border: 1.5px solid var(--color-border-strong);
      border-radius: .3rem;
      color: transparent;                        /* icon hidden when unchecked */
      background: transparent;
      transition: background .12s, border-color .12s;
    }
    .checkbox.checked {
      border-color: var(--color-accent);
      background: var(--color-accent);
      color: #fff;                               /* white checkmark on accent bg */
    }
    /* Ensure lucide-icon inside checkbox is truly centered */
    .checkbox lucide-icon { display: flex; align-items: center; justify-content: center; }

    /* ── Density options: icon dots use accent color, labels use border color ── */
    .density-options { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; }
    .density-options button {
      display: grid; justify-items: center; gap: .5rem; padding: .8rem .5rem;
      border: 1.5px solid var(--color-border); border-radius: .55rem;
      color: var(--color-text-secondary); background: var(--color-surface-2);
      font: inherit; font-size: .78rem; font-weight: 650; cursor: pointer;
    }
    .density-options button:hover { border-color: var(--color-border-strong); color: var(--color-text-primary); }
    .density-options button.selected {
      color: var(--color-accent);
      border-color: var(--color-accent);
      border-width: 2px;
      background: var(--color-accent-soft);
    }
    .density-preview { display: flex; align-items: center; gap: .22rem; height: 1.6rem; }
    /* Dot icons in density preview use theme accent */
    .density-preview i {
      width: .48rem; height: .48rem; border-radius: 50%;
      background: var(--color-accent);
    }
    /* Label bars use muted text color */
    .density-preview--labels b {
      width: 1.05rem; height: .28rem; border-radius: .12rem;
      background: var(--color-text-muted);
      opacity: .6;
    }

    .section-list { display: grid; gap: .3rem; }
    .section-row { display: flex; align-items: center; gap: .55rem; min-height: 2.15rem; padding: 0 .6rem; border: 1px solid var(--color-border); border-radius: .5rem; color: var(--color-text-primary); background: var(--color-surface-2); font-size: .85rem; font-weight: 650; cursor: grab; }
    .section-row lucide-icon { color: var(--color-text-muted); }
    .section-create { display: flex; align-items: center; gap: .5rem; min-height: 2.15rem; padding: 0 .6rem; border: 1px dashed var(--color-border-strong); border-radius: .5rem; color: var(--color-text-secondary); background: transparent; font: inherit; font-size: .85rem; font-weight: 650; cursor: pointer; }
    .section-create:hover { color: var(--color-text-primary); border-color: var(--color-accent); }
    .section-hint { margin: 0; color: var(--color-text-muted); font-size: .78rem; }
    .appearance-options { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: .6rem; }
    .appearance-options button { display: grid; justify-items: center; gap: .5rem; padding: .5rem; border: 2px solid transparent; border-radius: .6rem; background: transparent; font: inherit; cursor: pointer; }
    .appearance-options button.selected { border-color: var(--color-accent); }
    .appearance-options strong { color: var(--color-text-primary); font-size: .78rem; font-weight: 650; }
    .appearance-preview { position: relative; display: block; width: 100%; height: 3.6rem; overflow: hidden; border-radius: .4rem; border: 1px solid var(--color-border); }
    .appearance-preview i, .appearance-preview b, .appearance-preview em { position: absolute; border-radius: .12rem; }
    .appearance-preview--light { background: #f0f1f5; }
    .appearance-preview--light i { inset-inline-start: 0; inset-block: 0; width: 28%; background: #fff; border-inline-end: 1px solid #e2e4ea; }
    .appearance-preview--light b { inset-inline-start: 38%; inset-block-start: .4rem; width: 50%; height: .18rem; background: #cfd2db; }
    .appearance-preview--light em { inset-inline-start: 38%; inset-block-start: .8rem; width: 30%; height: .18rem; background: var(--color-accent); }
    .appearance-preview--dark { background: #191919; }
    .appearance-preview--dark i { inset-inline-start: 0; inset-block: 0; width: 28%; background: #202226; border-inline-end: 1px solid #2b2d32; }
    .appearance-preview--dark b { inset-inline-start: 38%; inset-block-start: .4rem; width: 50%; height: .18rem; background: #3a3c42; }
    .appearance-preview--dark em { inset-inline-start: 38%; inset-block-start: .8rem; width: 30%; height: .18rem; background: var(--color-accent); }
    .appearance-preview--auto { background: linear-gradient(90deg, #f0f1f5 50%, #191919 50%); }
    .appearance-preview--auto i { inset-inline-start: 0; inset-block: 0; width: 28%; background: #fff; border-inline-end: 1px solid #e2e4ea; }
    .appearance-preview--auto b { inset-inline-start: 38%; inset-block-start: .4rem; width: 25%; height: .18rem; background: #cfd2db; }
    .appearance-preview--auto em { inset-inline-start: 66%; inset-block-start: .8rem; width: 20%; height: .18rem; background: var(--color-accent); }
    .accent-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: .5rem; }
    .accent-grid button { display: flex; align-items: center; gap: .5rem; min-height: 2.35rem; padding: 0 .65rem; border: 1.5px solid var(--color-border); border-radius: .5rem; color: var(--color-text-primary); background: var(--color-surface-2); font: inherit; font-size: .80rem; font-weight: 650; cursor: pointer; }
    .accent-grid button.selected { border-color: var(--color-accent); background: var(--color-accent-soft); }
    .accent-dot { flex: none; width: 1.05rem; height: 1.05rem; border-radius: 50%; }
    .accent-dot--black { background: #5b5f68; } .accent-dot--purple { background: #7b68ee; } .accent-dot--blue { background: #2f8fe0; }
    .accent-dot--pink { background: #e0447e; } .accent-dot--violet { background: #9750e0; } .accent-dot--indigo { background: #4a5fd9; }
    .accent-dot--orange { background: #e2762e; } .accent-dot--teal { background: #1fa89a; } .accent-dot--bronze { background: #a97c62; } .accent-dot--mint { background: #33c48a; }
  `],
})
export class AppCustomizerComponent {
  readonly theme = inject(ThemeService);
  readonly workspace = inject(WorkspaceCustomizationService);
  private readonly notifications = inject(NotificationService);

  readonly close = output<void>();
  readonly tab = signal<CustomizerTab>('navigation');
  readonly accents = ACCENT_SWATCHES;
  readonly dragIndex = signal<number | null>(null);

  readonly Check = Check; readonly GripVertical = GripVertical; readonly Plus = Plus; readonly X = X;

  setMode(mode: 'light' | 'dark' | 'system'): void {
    this.theme.setMode(mode);
    this.notifications.success('Success!');
  }

  setAccent(accent: AccentName): void {
    this.theme.setAccent(accent);
    this.notifications.success('Success!');
  }

  onDrop(toIndex: number): void {
    const fromIndex = this.dragIndex();
    if (fromIndex === null || fromIndex === toIndex) return;
    this.workspace.reorderSections(fromIndex, toIndex);
    this.dragIndex.set(null);
  }
}
