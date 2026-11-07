// src/app/features/admin/notifications/triggers/trigger-form/trigger-preview.component.ts
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Bell, CircleCheck, CircleX, Info, LucideAngularModule, Wand2 } from 'lucide-angular';
import { AnI18n, AnTPipe } from '../../utils/an-i18n';
import { evaluateConditions, extractTokens, parseSample, renderTemplate, type PreviewContext } from '../../utils/template-engine';
import { TriggerFormValue } from './trigger-form.model';

/** Sticky side card: edit a sample row, see whether the trigger would fire and what the notification would say. */
@Component({
  selector: 'an-trigger-preview',
  standalone: true,
  imports: [LucideAngularModule, AnTPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card">
      <header class="card__head">
        <h2>{{ 'preview.title' | anT }}</h2>
        <div class="lang" role="group" [attr.aria-label]="'preview.language' | anT">
          <button type="button" [class.on]="lang() === 'en'" (click)="lang.set('en')">EN</button>
          <button type="button" [class.on]="lang() === 'ar'" (click)="lang.set('ar')">AR</button>
        </div>
      </header>

      <div class="notif" [dir]="lang() === 'ar' ? 'rtl' : 'ltr'">
        <span class="notif__icon"><lucide-icon [img]="Bell" size="16" /></span>
        <div class="notif__body">
          <p class="notif__title">{{ title() || ('preview.placeholderTitle' | anT) }}</p>
          <p class="notif__text">{{ body() || ('preview.placeholderBody' | anT) }}</p>
          <span class="notif__time">{{ 'preview.now' | anT }}</span>
        </div>
      </div>
      @if (lang() === 'ar' && !value().titleTemplateAr.trim()) {
        <p class="note"><lucide-icon [img]="Info" size="13" /> {{ 'preview.arFallback' | anT }}</p>
      }
      @if (redirect()) { <p class="redirect"><span>{{ 'preview.redirect' | anT }}</span> <code>{{ redirect() }}</code></p> }

      <div class="verdict" [class.verdict--ok]="verdict().state === 'ok'" [class.verdict--no]="verdict().state === 'no'" [class.verdict--na]="verdict().state === 'na'">
        @switch (verdict().state) {
          @case ('ok') { <lucide-icon [img]="CircleCheck" size="16" /> <span>{{ 'preview.wouldFire' | anT }}</span> }
          @case ('no') { <lucide-icon [img]="CircleX" size="16" /> <span>{{ 'preview.wouldNot' | anT }}@if (verdict().failed) { — <code>{{ verdict().failed }}</code> }</span> }
          @default { <lucide-icon [img]="Info" size="16" /> <span>{{ 'preview.scheduledNa' | anT }}</span> }
        }
      </div>

      <div class="sample">
        <div class="sample__head">
          <label for="an-sample">{{ 'preview.sample' | anT }}</label>
          <button type="button" class="link" (click)="generate()"><lucide-icon [img]="Wand2" size="13" /> {{ 'preview.generate' | anT }}</button>
        </div>
        <textarea id="an-sample" rows="6" spellcheck="false" [value]="sampleText()" (input)="sampleText.set($any($event.target).value)"
          [class.invalid]="!parsed()" [placeholder]="sampleHint"></textarea>
        @if (!parsed()) { <p class="err" role="alert">{{ 'v.invalidJson' | anT }}</p> }
        @else if (missing().length) { <p class="note"><lucide-icon [img]="Info" size="13" /> {{ 'preview.missing' | anT: { fields: missing().join(', ') } }}</p> }
        @else { <p class="hint">{{ 'preview.sampleHint' | anT }}</p> }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .card { padding: 1rem 1.05rem 1.1rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-1); }
    .card__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: .8rem; }
    h2 { margin: 0; font-size: .86rem; font-weight: 800; }
    .lang { display: inline-flex; padding: .15rem; border-radius: .5rem; background: var(--color-surface-2); border: 1px solid var(--color-border); }
    .lang button { padding: .2rem .55rem; border-radius: .35rem; font-size: .68rem; font-weight: 800; color: var(--color-text-secondary); }
    .lang button.on { color: #fff; background: var(--color-accent); }

    .notif { display: flex; gap: .7rem; padding: .85rem .9rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); background: var(--color-surface-2); box-shadow: 0 .5rem 1.2rem rgb(0 0 0 / .12); }
    .notif__icon { display: grid; place-items: center; flex: none; width: 2rem; height: 2rem; border-radius: 50%; color: #fff; background: var(--color-accent); }
    .notif__body { min-width: 0; }
    .notif__title { margin: 0; font-size: .82rem; font-weight: 800; line-height: 1.35; word-break: break-word; }
    .notif__text { margin: .2rem 0 0; font-size: .78rem; line-height: 1.5; color: var(--color-text-secondary); word-break: break-word; white-space: pre-line; }
    .notif__time { display: block; margin-top: .35rem; font-size: .66rem; color: var(--color-text-muted); }

    .redirect { margin: .55rem 0 0; font-size: .7rem; color: var(--color-text-muted); word-break: break-all; }
    .redirect span { font-weight: 800; text-transform: uppercase; letter-spacing: .05em; margin-inline-end: .3rem; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .72rem; }

    .verdict { display: flex; align-items: flex-start; gap: .5rem; margin-top: .8rem; padding: .6rem .75rem; border-radius: var(--radius-md); font-size: .76rem; font-weight: 700; line-height: 1.4; }
    .verdict--ok { color: var(--color-success-text); background: var(--color-success-soft); border: 1px solid var(--color-success-border); }
    .verdict--no { color: var(--color-warning-text); background: var(--color-warning-soft); border: 1px solid var(--color-warning-border); }
    .verdict--na { color: var(--color-text-secondary); background: var(--color-surface-2); border: 1px solid var(--color-border); }
    .verdict lucide-icon { margin-top: .05rem; flex: none; }

    .sample { margin-top: 1rem; }
    .sample__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: .35rem; }
    .sample label { font-size: .72rem; font-weight: 800; color: var(--color-text-secondary); }
    .link { display: inline-flex; align-items: center; gap: .3rem; font-size: .7rem; font-weight: 750; color: var(--color-accent-bright); }
    .link:hover { text-decoration: underline; }
    textarea { width: 100%; resize: vertical; padding: .6rem .7rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); color: var(--color-text-primary); background: var(--color-surface-2);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .72rem; line-height: 1.55; direction: ltr; text-align: left; }
    textarea:focus-visible { outline: 0; border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-soft); }
    textarea.invalid { border-color: var(--color-danger); }
    .hint, .note, .err { margin: .4rem 0 0; font-size: .7rem; line-height: 1.45; }
    .hint { color: var(--color-text-muted); }
    .note { display: flex; gap: .35rem; align-items: flex-start; color: var(--color-warning-text); margin-top: .5rem; }
    .err { color: var(--color-danger-text); font-weight: 700; }
  `],
})
export class TriggerPreviewComponent {
  private readonly i18n = inject(AnI18n);

  readonly value = input.required<TriggerFormValue>();
  readonly lang = signal<'en' | 'ar'>('en');
  readonly sampleText = signal('');
  readonly sampleHint = '{\n  "Name": "Main code",\n  "Status": "Approved"\n}';

  readonly Bell = Bell; readonly CircleCheck = CircleCheck; readonly CircleX = CircleX; readonly Info = Info; readonly Wand2 = Wand2;

  readonly parsed = computed(() => parseSample(this.sampleText()));

  private readonly ctx = computed<PreviewContext>(() => {
    const v = this.value();
    const p = this.parsed() ?? { new: {}, old: {} };
    return {
      table: v.triggerType === 'DatabaseAction' ? v.tableName || 'table' : 'scheduler',
      operation: v.triggerType === 'DatabaseAction' ? v.triggerOperation : 'SCHEDULED',
      new: p.new,
      old: p.old,
    };
  });

  readonly title = computed(() => {
    const v = this.value();
    return renderTemplate(this.lang() === 'ar' && v.titleTemplateAr.trim() ? v.titleTemplateAr : v.titleTemplate, this.ctx());
  });
  readonly body = computed(() => {
    const v = this.value();
    return renderTemplate(this.lang() === 'ar' && v.bodyTemplateAr.trim() ? v.bodyTemplateAr : v.bodyTemplate, this.ctx());
  });
  readonly redirect = computed(() => renderTemplate(this.value().redirectData, this.ctx(), true));

  readonly verdict = computed<{ state: 'ok' | 'no' | 'na'; failed?: string }>(() => {
    const v = this.value();
    if (v.triggerType !== 'DatabaseAction') return { state: 'na' };
    const r = evaluateConditions(v.conditions, this.ctx());
    return r.ok ? { state: 'ok' } : { state: 'no', failed: r.failed };
  });

  private readonly tokens = computed(() => {
    const v = this.value();
    return extractTokens(v.titleTemplate, v.bodyTemplate, v.titleTemplateAr, v.bodyTemplateAr, v.conditions,
      v.redirectData, v.dataMapping, v.targetUsersQuery, v.fileUrlTemplate, v.hasFileTemplate);
  });

  readonly missing = computed(() => {
    const p = this.parsed();
    if (!p) return [];
    const have = new Set([...Object.keys(p.new), ...Object.keys(p.old)].map(k => k.toLowerCase()));
    return this.tokens().filter(t => !have.has(t.toLowerCase()));
  });

  /** Builds a sample row from every {{Field}} used in the form so the admin only has to adjust the values. */
  generate(): void {
    const fields = this.tokens();
    const row: Record<string, unknown> = {};
    for (const f of fields) row[f] = /id$/i.test(f) ? 1 : this.i18n.t('preview.sampleValue', { field: f });
    if (this.value().triggerType === 'DatabaseAction' && this.value().triggerOperation === 'UPDATE') {
      row['Old'] = Object.fromEntries(fields.map(f => [f, /id$/i.test(f) ? 1 : this.i18n.t('preview.sampleOld', { field: f })]));
    }
    this.sampleText.set(JSON.stringify(row, null, 2));
  }
}
