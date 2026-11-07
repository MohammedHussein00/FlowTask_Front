// src/app/features/admin/notifications/triggers/trigger-preview/trigger-preview.component.ts
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Bell, CircleCheck, CircleX, Info, LucideAngularModule, Wand2 } from 'lucide-angular';
import { AnI18n, AnTPipe } from '../../utils/an-i18n';
import { evaluateConditions, extractTokens, parseSample, renderTemplate, type PreviewContext } from '../../utils/template-engine';
import { TriggerFormValue } from '../trigger-form/trigger-form.model';

/** Sticky side card: edit a sample row, see whether the trigger would fire and what the notification would say. */
@Component({
  selector: 'an-trigger-preview',
  standalone: true,
  imports: [LucideAngularModule, AnTPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trigger-preview.component.html',
  styleUrl: './trigger-preview.component.scss',
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
