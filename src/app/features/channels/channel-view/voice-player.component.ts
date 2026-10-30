/**
 * VoicePlayerComponent
 * ────────────────────
 * WhatsApp-style voice-note player used both in the composer (pending note,
 * deletable) and in the message list (sent note).
 *
 *  - The waveform is drawn from the *real* amplitude samples captured while
 *    recording (`peaks`, values 0..1), resampled to a fixed number of bars.
 *  - Bars already played are highlighted; progress is driven by
 *    requestAnimationFrame so it moves smoothly. Click / drag-free click on the
 *    waveform seeks.
 *  - Speed button cycles 1× → 1.5× → 2×.
 *  - "⋯" menu: Download, Copy link, and (when `deletable`) Delete.
 *  - Only one player plays at a time.
 */
import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener,
  computed, inject, input, output, signal,
} from '@angular/core';
import { LucideAngularModule, Play, Pause, Download, Link2, X, MoreHorizontal, Check } from 'lucide-angular';
import { ComponentTranslatePipe } from '../../../core/i18n/component-translate.pipe';

/** Shared across instances so starting one note pauses whichever was playing. */
let currentlyPlaying: { pause: () => void } | null = null;

const BAR_COUNT = 42;
const SPEEDS = [1, 1.5, 2] as const;

@Component({
  selector: 'app-voice-player',
  standalone: true,
  imports: [LucideAngularModule, ComponentTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vp">
      <button type="button" class="vp__play" (click)="toggle()"
        [attr.aria-label]="(playing() ? 'voicePause' : 'voicePlay') | componentT:'channel-view'">
        <lucide-icon [img]="playing() ? Pause : Play" size="14" />
      </button>

      <div class="vp__wave" role="slider" tabindex="0"
        [attr.aria-valuemin]="0" [attr.aria-valuemax]="100" [attr.aria-valuenow]="progressPct()"
        (click)="seekFromEvent($event)" (keydown.arrowRight)="nudge(5)" (keydown.arrowLeft)="nudge(-5)">
        @for (h of bars(); track $index) {
          <i [style.height.%]="h" [class.vp__bar--on]="($index + 0.5) / bars().length <= progress()"></i>
        }
      </div>

      <time class="vp__time">{{ fmt(shownSeconds()) }}</time>

      <button type="button" class="vp__speed" [class.vp__speed--shown]="menuOpen()" (click)="cycleSpeed()" [attr.aria-label]="'voiceSpeed' | componentT:'channel-view'">
        {{ speed() }}×
      </button>

      <div class="vp__menu-wrap">
        <button type="button" class="vp__more" [class.vp__more--open]="menuOpen()" aria-haspopup="menu"
          [attr.aria-expanded]="menuOpen()" (click)="toggleMenu($event)" [attr.aria-label]="'voiceMore' | componentT:'channel-view'">
          <lucide-icon [img]="MoreHorizontal" size="14" />
        </button>
        @if (menuOpen()) {
          <div class="vp__menu" role="menu" [style.left.px]="menuPos().left" [style.top.px]="menuPos().top" [style.bottom.px]="menuPos().bottom">
            <button type="button" class="vp__item" role="menuitem" (click)="download()">
              <lucide-icon [img]="Download" size="14" />{{ 'voiceDownload' | componentT:'channel-view' }}
            </button>
            <button type="button" class="vp__item" role="menuitem" (click)="copyLink()">
              <lucide-icon [img]="copied() ? Check : Link2" size="14" />
              {{ (copied() ? 'voiceCopied' : 'voiceCopyLink') | componentT:'channel-view' }}
            </button>
            @if (deletable()) {
              <div class="vp__sep"></div>
              <button type="button" class="vp__item" role="menuitem" (click)="remove()">
                <lucide-icon [img]="X" size="14" />{{ 'voiceDelete' | componentT:'channel-view' }}
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: inline-block; width: fit-content; max-width: 100%; }
    .vp { display: inline-flex; max-width: 100%; align-items: center; gap: .6rem; padding: .4rem .6rem; border: 1px solid var(--color-border-strong); border-radius: .6rem; background: var(--color-surface-1); }
    .vp__play { flex: none; width: 1.9rem; height: 1.9rem; display: grid; place-items: center; border: 0; border-radius: 50%; background: var(--color-text-primary); color: var(--color-canvas); cursor: pointer; }
    .vp__wave { flex: none; display: flex; align-items: center; gap: 2px; width: min(10.5rem, 38vw); height: 1.7rem; overflow: hidden; cursor: pointer; }
    .vp__wave:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; border-radius: .25rem; }
    .vp__wave i { flex: 1 1 0; min-width: 0; max-width: 3px; border-radius: 1px; background: var(--color-border-strong); transition: background .1s; }
    .vp__wave i.vp__bar--on { background: var(--color-text-primary); }
    .vp__time { flex: none; min-width: 2.4rem; margin-inline-start: .15rem; font-size: .83rem; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
    .vp__speed, .vp__more { flex: none; height: 1.5rem; min-width: 1.5rem; padding: 0 .35rem; border: 0; border-radius: .35rem; background: transparent; color: var(--color-text-muted); font: inherit; font-size: .80rem; font-weight: 650; cursor: pointer; display: inline-grid; place-items: center; }
    /* Speed is only revealed on hover / keyboard focus (space is reserved so nothing jumps) */
    .vp__speed { opacity: 0; pointer-events: none; transition: opacity .12s; }
    .vp:hover .vp__speed, .vp:focus-within .vp__speed, .vp__speed--shown { opacity: 1; pointer-events: auto; }
    .vp__speed:hover, .vp__more:hover, .vp__more--open { background: var(--color-surface-3); color: var(--color-text-primary); }
    .vp__menu-wrap { flex: none; }
    /* position: fixed so neither the composer nor the scrolling message list can clip it */
    .vp__menu { position: fixed; z-index: 1000; min-width: 13rem; padding: .3rem; background: var(--color-surface-1); border: 1px solid var(--color-border-strong); border-radius: .6rem; box-shadow: 0 10px 28px rgba(0,0,0,.45); }
    .vp__item { display: flex; align-items: center; gap: .6rem; width: 100%; padding: .5rem .6rem; border: 0; border-radius: .4rem; background: transparent; color: var(--color-text-primary); font: inherit; font-size: .90rem; text-align: start; cursor: pointer; }
    .vp__item:hover { background: var(--color-surface-3); }
    .vp__sep { height: 1px; margin: .25rem -.3rem; background: var(--color-border); }
  `],
})
export class VoicePlayerComponent {
  readonly url       = input.required<string>();
  /** Amplitude samples, 0..1, any length (resampled to the bar count). */
  readonly peaks     = input<number[]>([]);
  /** Known duration in seconds (MediaRecorder blobs often report Infinity). */
  readonly duration  = input.required<number>();
  readonly mime      = input('audio/webm');
  readonly deletable = input(false);
  readonly deleted   = output<void>();

  readonly Play = Play; readonly Pause = Pause; readonly Download = Download; readonly Link2 = Link2;
  readonly X = X; readonly MoreHorizontal = MoreHorizontal; readonly Check = Check;

  readonly playing  = signal(false);
  readonly progress = signal(0);            // 0..1
  readonly speed    = signal<number>(1);
  readonly menuOpen = signal(false);
  readonly menuPos  = signal<{ left: number; top: number | null; bottom: number | null }>({ left: 0, top: 0, bottom: null });
  readonly copied   = signal(false);

  private readonly host = inject(ElementRef);
  private audio: HTMLAudioElement | null = null;
  private raf = 0;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly handle = { pause: () => this.pause() };

  /** Bars in percent height, resampled from the real peaks (falls back to a flat pattern). */
  readonly progressPct = computed(() => Math.round(this.progress() * 100));

  readonly bars = computed<number[]>(() => {
    const p = this.peaks();
    if (!p.length) return Array.from({ length: BAR_COUNT }, () => 30);
    const out: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const a = Math.floor((i / BAR_COUNT) * p.length);
      const b = Math.max(a + 1, Math.floor(((i + 1) / BAR_COUNT) * p.length));
      let max = 0;
      for (let j = a; j < b && j < p.length; j++) max = Math.max(max, p[j]);
      out.push(Math.round(14 + Math.min(1, max) * 86));
    }
    return out;
  });

  /** Elapsed time once playback has started, otherwise the full length. */
  readonly shownSeconds = computed(() => {
    const d = this.duration();
    return this.progress() > 0 ? Math.min(d, this.progress() * d) : d;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      cancelAnimationFrame(this.raf);
      this.audio?.pause();
      if (currentlyPlaying === this.handle) currentlyPlaying = null;
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
    });
  }

  fmt(total: number): string {
    const t = Math.max(0, Math.round(total));
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  }

  private ensureAudio(): HTMLAudioElement {
    if (this.audio && this.audio.src === this.url()) return this.audio;
    this.audio?.pause();
    const a = new Audio(this.url());
    a.preload = 'auto';
    a.playbackRate = this.speed();
    a.onended = () => { this.playing.set(false); this.progress.set(0); cancelAnimationFrame(this.raf); a.currentTime = 0; };
    // MediaRecorder WebM has no duration header → Infinity. Force the browser to compute it so seeking works.
    a.onloadedmetadata = () => {
      if (a.duration === Infinity) {
        a.currentTime = 1e101;
        a.ontimeupdate = () => { a.ontimeupdate = null; a.currentTime = 0; };
      }
    };
    this.audio = a;
    return a;
  }

  toggle(): void {
    if (this.playing()) { this.pause(); return; }
    const a = this.ensureAudio();
    if (currentlyPlaying && currentlyPlaying !== this.handle) currentlyPlaying.pause();
    currentlyPlaying = this.handle;
    a.playbackRate = this.speed();
    void a.play().then(() => { this.playing.set(true); this.tick(); }).catch(() => this.playing.set(false));
  }

  pause(): void {
    this.audio?.pause();
    this.playing.set(false);
    cancelAnimationFrame(this.raf);
  }

  private tick = (): void => {
    const a = this.audio;
    if (!a) return;
    const d = this.duration() || (Number.isFinite(a.duration) ? a.duration : 0);
    if (d > 0) this.progress.set(Math.min(1, a.currentTime / d));
    if (this.playing()) this.raf = requestAnimationFrame(this.tick);
  };

  /** Opens the ⋯ menu next to the button, flipping upward when there isn't room below. */
  toggleMenu(ev: MouseEvent): void {
    if (this.menuOpen()) { this.menuOpen.set(false); return; }
    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const MENU_W = 208, MENU_H = 130, GAP = 6;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - MENU_W - 8));
    const up = window.innerHeight - r.bottom < MENU_H + GAP && r.top > MENU_H + GAP;
    this.menuPos.set(up
      ? { left, top: null, bottom: window.innerHeight - r.top + GAP }
      : { left, top: r.bottom + GAP, bottom: null });
    this.menuOpen.set(true);
  }

  seekFromEvent(ev: MouseEvent): void {
    const el = ev.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    let ratio = (ev.clientX - rect.left) / rect.width;
    if (getComputedStyle(el).direction === 'rtl') ratio = 1 - ratio;
    this.seekTo(Math.min(1, Math.max(0, ratio)));
  }

  nudge(deltaSeconds: number): void {
    const d = this.duration();
    if (d > 0) this.seekTo(Math.min(1, Math.max(0, this.progress() + deltaSeconds / d)));
  }

  private seekTo(ratio: number): void {
    const a = this.ensureAudio();
    const d = this.duration();
    if (d > 0) { try { a.currentTime = ratio * d; } catch { /* metadata not ready yet */ } }
    this.progress.set(ratio);
  }

  cycleSpeed(): void {
    const next = SPEEDS[(SPEEDS.indexOf(this.speed() as 1) + 1) % SPEEDS.length];
    this.speed.set(next);
    if (this.audio) this.audio.playbackRate = next;
  }

  download(): void {
    const m = this.mime();
    const ext = m.includes('mp4') ? 'm4a' : m.includes('ogg') ? 'ogg' : m.includes('mpeg') ? 'mp3' : 'webm';
    const a = document.createElement('a');
    a.href = this.url();
    a.download = `voice-note-${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.menuOpen.set(false);
  }

  async copyLink(): Promise<void> {
    try { await navigator.clipboard.writeText(this.url()); } catch { /* clipboard blocked */ }
    this.copied.set(true);
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => { this.copied.set(false); this.menuOpen.set(false); }, 1200);
  }

  remove(): void {
    this.pause();
    this.menuOpen.set(false);
    this.deleted.emit();
  }

  @HostListener('window:resize')
  @HostListener('document:scroll')
  onViewportChange(): void { if (this.menuOpen()) this.menuOpen.set(false); }

  @HostListener('document:mousedown', ['$event'])
  onOutside(ev: MouseEvent): void {
    if (this.menuOpen() && !(this.host.nativeElement as HTMLElement).contains(ev.target as Node)) this.menuOpen.set(false);
  }
}
