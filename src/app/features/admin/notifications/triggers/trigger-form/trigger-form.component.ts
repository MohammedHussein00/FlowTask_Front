// src/app/features/admin/notifications/triggers/trigger-form/trigger-form.component.ts
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ArrowLeft, BellRing, CalendarClock, ChevronDown, Database, Globe, Info, LucideAngularModule, Mail, MessageSquare, Save,
  Smartphone, TriangleAlert, Users, UserRound, ShieldCheck,
} from 'lucide-angular';
import { combineLatest, map, merge, startWith } from 'rxjs';
import { NotificationService } from '../../../../../core/errors/notification.service';
import { LocaleService } from '../../../../../core/i18n/locale.service';
import {
  ConnectionFilter, NotificationTrigger, PushTarget, Recurrence, RECURRENCES, TRIGGER_OPERATIONS, TriggerOperation, TriggerType,
} from '../../models/notification-admin.models';
import { NotificationAdminApiService } from '../../services/notification-admin-api.service';
import { AnFieldComponent } from '../../ui/an-field/an-field.component';
import { AnSegmentedComponent, SegmentOption } from '../../ui/an-segmented/an-segmented.component';
import { AnSwitchComponent } from '../../ui/an-switch/an-switch.component';
import { AnI18n, AnTPipe } from '../../utils/an-i18n';
import { applyServerErrors, toApiProblem } from '../../utils/api-problem';
import { browserTimeZone } from '../../utils/format';
import { extractTokens } from '../../utils/template-engine';
import {
  channelsValidator, conditionsValidator, cronValidator, dateRangeValidator, fileTemplateValidator, futureDateValidator,
  jsonObjectValidator, rolesValidator, tableNameValidator, templateValidator, timeValidator, userTargetsValidator,
} from '../../utils/trigger-validators';
import { HasUnsavedChanges } from '../../utils/unsaved-changes.guard';
import { EMPTY_FORM, TargetMode, TriggerFormValue, formToCreate, formToUpdate, triggerToForm } from './trigger-form.model';
import { TriggerPreviewComponent } from '../trigger-preview/trigger-preview.component';

type TemplateField = 'titleTemplate' | 'bodyTemplate' | 'titleTemplateAr' | 'bodyTemplateAr';

@Component({
  selector: 'app-trigger-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, LucideAngularModule, AnTPipe, AnFieldComponent, AnSwitchComponent, AnSegmentedComponent,
    TriggerPreviewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trigger-form.component.html',
  styleUrl: './trigger-form.component.scss',
})
export class TriggerFormComponent implements HasUnsavedChanges {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(NotificationAdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(NotificationService);
  private readonly i18n = inject(AnI18n);
  private readonly locale = inject(LocaleService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  // ── state ──
  readonly editId = signal<number | null>(null);
  readonly isEdit = computed(() => this.editId() !== null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly duplicatedFrom = signal<string | null>(null);
  readonly msgLang = signal<'en' | 'ar'>('en');
  readonly lastField = signal<{ name: TemplateField; el: HTMLInputElement | HTMLTextAreaElement } | null>(null);
  readonly tz = browserTimeZone();

  // ── form ──
  readonly form = this.fb.group(
    {
      name: this.fb.control(EMPTY_FORM.name),
      description: this.fb.control(EMPTY_FORM.description),
      isActive: this.fb.control(EMPTY_FORM.isActive),
      triggerType: this.fb.control<TriggerType>(EMPTY_FORM.triggerType),
      tableName: this.fb.control(EMPTY_FORM.tableName),
      triggerOperation: this.fb.control<TriggerOperation>(EMPTY_FORM.triggerOperation),
      conditions: this.fb.control(EMPTY_FORM.conditions),
      recurrenceType: this.fb.control<Recurrence>(EMPTY_FORM.recurrenceType),
      cronExpression: this.fb.control(EMPTY_FORM.cronExpression),
      scheduledTime: this.fb.control(EMPTY_FORM.scheduledTime),
      scheduleStartDate: this.fb.control(EMPTY_FORM.scheduleStartDate),
      scheduleEndDate: this.fb.control(EMPTY_FORM.scheduleEndDate),
      notificationType: this.fb.control(EMPTY_FORM.notificationType),
      iconName: this.fb.control(EMPTY_FORM.iconName),
      priority: this.fb.control(EMPTY_FORM.priority),
      titleTemplate: this.fb.control(EMPTY_FORM.titleTemplate),
      bodyTemplate: this.fb.control(EMPTY_FORM.bodyTemplate),
      titleTemplateAr: this.fb.control(EMPTY_FORM.titleTemplateAr),
      bodyTemplateAr: this.fb.control(EMPTY_FORM.bodyTemplateAr),
      redirectData: this.fb.control(EMPTY_FORM.redirectData),
      dataMapping: this.fb.control(EMPTY_FORM.dataMapping),
      hasFileTemplate: this.fb.control(EMPTY_FORM.hasFileTemplate),
      fileUrlTemplate: this.fb.control(EMPTY_FORM.fileUrlTemplate),
      fileContentTypeTemplate: this.fb.control(EMPTY_FORM.fileContentTypeTemplate),
      targetMode: this.fb.control<TargetMode>(EMPTY_FORM.targetMode),
      targetUsersQuery: this.fb.control(EMPTY_FORM.targetUsersQuery),
      allowedRoles: this.fb.control(EMPTY_FORM.allowedRoles),
      connectionStateFilter: this.fb.control<ConnectionFilter>(EMPTY_FORM.connectionStateFilter),
      sendToNotificationTable: this.fb.control(EMPTY_FORM.sendToNotificationTable),
      sendPushNotification: this.fb.control(EMPTY_FORM.sendPushNotification),
      sendEmail: this.fb.control(EMPTY_FORM.sendEmail),
      pushTarget: this.fb.control<PushTarget>(EMPTY_FORM.pushTarget),
    },
    { validators: [dateRangeValidator('scheduleStartDate', 'scheduleEndDate'), channelsValidator(), fileTemplateValidator()] },
  );

  /** Live copy of the form value for computed summaries / preview. */
  readonly value = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue() as TriggerFormValue), startWith(this.form.getRawValue() as TriggerFormValue)),
    { requireSync: true },
  );

  // ── option lists ──
  readonly typeOptions = computed<SegmentOption<TriggerType>[]>(() => [
    { value: 'DatabaseAction', label: this.i18n.t('type.db'), hint: this.i18n.t('type.dbHint'), icon: Database },
    { value: 'Scheduled', label: this.i18n.t('type.scheduled'), hint: this.i18n.t('type.scheduledHint'), icon: CalendarClock },
  ]);
  readonly operationOptions = TRIGGER_OPERATIONS.map(o => ({ value: o, label: o }));
  readonly recurrenceOptions = computed<SegmentOption<Recurrence>[]>(() =>
    RECURRENCES.map(r => ({ value: r, label: this.i18n.t('rec.' + r.toLowerCase() + 'Short') })));
  readonly targetOptions = computed<SegmentOption<TargetMode>[]>(() => [
    { value: 'roles', label: this.i18n.t('target.roles'), hint: this.i18n.t('target.rolesHint'), icon: ShieldCheck },
    { value: 'users', label: this.i18n.t('target.users'), hint: this.i18n.t('target.usersHint'), icon: UserRound },
    { value: 'everyone', label: this.i18n.t('target.everyone'), hint: this.i18n.t('target.everyoneHint'), icon: Users },
  ]);
  readonly pushTargetOptions = computed<SegmentOption<PushTarget>[]>(() => [
    { value: 'Both', label: this.i18n.t('push.both') },
    { value: 'Mobile', label: this.i18n.t('push.mobile') },
    { value: 'Web', label: this.i18n.t('push.web') },
  ]);

  readonly cronPresets = [
    { key: 'cron.daily8', cron: '0 0 8 * * ?' },
    { key: 'cron.weekdays9', cron: '0 0 9 ? * MON-FRI' },
    { key: 'cron.every15', cron: '0 0/15 * * * ?' },
    { key: 'cron.monthly', cron: '0 0 6 1 * ?' },
  ];
  readonly iconPresets = ['bell', 'info', 'alert-triangle', 'check-circle', 'user', 'calendar', 'mail', 'file-text', 'message-square'];
  readonly conditionSnippets = [
    { label: '{{Field}} == \'value\'', text: "{{Field}} == 'value'" },
    { label: '{{Field}} changed', text: '{{Field}} changed' },
    { label: '{{Field}} > 0', text: '{{Field}} > 0' },
    { label: 'AND', text: ' AND ' },
  ];

  /** Placeholders containing literal braces live here — `{{` in a template attribute would be parsed as interpolation. */
  readonly ph = {
    cond: "{{Status}} == 'Approved'",
    redirect: '{"web":"/codes/{{Id}}"}',
    data: '{"id":"{{Id}}"}',
    hasFile: '{{HasAttachment}}',
    fileUrl: 'https://…/{{FileName}}',
    users: '{{OwnerId}}, 5',
  };

  tokenLabel(t: string): string { return '{{' + t + '}}'; }

  readonly tokenChips = computed(() => {
    const v = this.value();
    const used = extractTokens(v.titleTemplate, v.bodyTemplate, v.titleTemplateAr, v.bodyTemplateAr, v.conditions, v.redirectData);
    const reserved = v.triggerType === 'DatabaseAction' ? ['Table', 'Operation', 'Now'] : ['Now'];
    return [...new Set([...used, ...reserved])];
  });

  // ── summaries / warnings ──
  readonly scheduleSummary = computed(() => {
    const v = this.value();
    if (v.triggerType !== 'Scheduled') return '';
    const loc = this.locale.current;
    switch (v.recurrenceType) {
      case 'Once': {
        const d = v.scheduleStartDate ? new Date(v.scheduleStartDate) : null;
        return d && !Number.isNaN(d.getTime())
          ? this.i18n.t('sum.once', { when: new Intl.DateTimeFormat(loc, { dateStyle: 'medium', timeStyle: 'short' }).format(d) }) : '';
      }
      case 'Daily': return v.scheduledTime ? this.i18n.t('sum.daily', { time: v.scheduledTime }) : '';
      case 'Weekly': return v.scheduledTime ? this.i18n.t('sum.weekly', { time: v.scheduledTime, day: this.cairoWeekday(v.scheduleStartDate, loc) }) : '';
      case 'Monthly': return v.scheduledTime ? this.i18n.t('sum.monthly', { time: v.scheduledTime, day: Math.min(this.cairoDay(v.scheduleStartDate), 28) }) : '';
      case 'Cron': return v.cronExpression.trim() ? this.i18n.t('sum.cron', { cron: v.cronExpression.trim() }) : '';
    }
  });

  readonly summaryRows = computed(() => {
    const v = this.value();
    const channels = [
      v.sendToNotificationTable && this.i18n.t('channel.inApp'),
      v.sendPushNotification && this.i18n.t('channel.push'),
      v.sendEmail && this.i18n.t('channel.email'),
    ].filter(Boolean) as string[];
    const when = v.triggerType === 'DatabaseAction'
      ? this.i18n.t('sum.dbWhen', { op: v.triggerOperation, table: v.tableName.trim() || '…' })
      : this.scheduleSummary() || '…';
    const who = v.targetMode === 'everyone' ? this.i18n.t('sum.everyone')
      : v.targetMode === 'users' ? this.i18n.t('sum.users', { list: v.targetUsersQuery.trim() || '…' })
      : this.i18n.t('sum.roles', { list: v.allowedRoles.trim() || '…' });
    return [
      { k: 'sum.when', v: when },
      { k: 'sum.who', v: who },
      { k: 'sum.via', v: channels.join(' · ') || '—' },
    ];
  });

  /** Non-blocking advice. */
  readonly warnings = computed(() => {
    const v = this.value();
    const w: string[] = [];
    if (v.triggerType === 'DatabaseAction' && v.targetMode === 'everyone') w.push('warn.everyoneDb');
    if (v.triggerType === 'DatabaseAction' && v.triggerOperation === 'UPDATE' && !v.conditions.trim()) w.push('warn.updateNoCond');
    if (v.triggerType === 'Scheduled' && v.recurrenceType === 'Once' && this.isEdit() && v.scheduleStartDate && new Date(v.scheduleStartDate) < new Date()) w.push('warn.oncePast');
    if (v.triggerType === 'Scheduled' && v.scheduleEndDate && new Date(v.scheduleEndDate) < new Date()) w.push('warn.endPast');
    if (v.sendEmail) w.push('warn.email');
    return w;
  });

  readonly showPushTarget = computed(() => this.value().sendPushNotification || this.value().sendToNotificationTable);

  // icons
  readonly ArrowLeft = ArrowLeft; readonly Save = Save; readonly Info = Info; readonly TriangleAlert = TriangleAlert;
  readonly BellRing = BellRing; readonly Smartphone = Smartphone; readonly Mail = Mail; readonly MessageSquare = MessageSquare;
  readonly Globe = Globe; readonly ChevronDown = ChevronDown;

  constructor() {
    this.syncValidators();

    // conditional validators follow the controls that decide which rules apply
    merge(
      this.form.controls.triggerType.valueChanges,
      this.form.controls.recurrenceType.valueChanges,
      this.form.controls.targetMode.valueChanges,
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.syncValidators());

    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, query]) => {
        const id = Number(params.get('id'));
        const from = Number(query.get('from'));
        if (id) this.load(id, false);
        else if (from) this.load(from, true);
      });
  }

  hasUnsavedChanges(): boolean { return this.form.dirty && !this.saving(); }

  // ── loading ──
  retry(): void {
    const id = this.editId();
    const from = Number(this.route.snapshot.queryParamMap.get('from'));
    if (id) this.load(id, false); else if (from) this.load(from, true);
  }

  private load(id: number, asCopy: boolean): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.get(id).subscribe({
      next: t => {
        this.editId.set(asCopy ? null : t.id);
        this.populate(t, asCopy);
        this.loading.set(false);
      },
      error: err => {
        const p = toApiProblem(err);
        this.loadError.set(p.status === 404 ? this.i18n.t('form.notFound') : p.message || this.i18n.t('list.errorText'));
        this.loading.set(false);
      },
    });
  }

  private populate(t: NotificationTrigger, asCopy: boolean): void {
    const v = triggerToForm(t);
    if (asCopy) {
      v.name = this.i18n.t('form.copyName', { name: t.name });
      v.isActive = false;                                  // a copy never starts live
      this.duplicatedFrom.set(t.name);
    }
    this.form.reset(v);
    this.syncValidators();
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  // ── validation rules that depend on other fields ──
  private syncValidators(): void {
    const v = this.form.getRawValue();
    const db = v.triggerType === 'DatabaseAction';
    const timed = !db && ['Daily', 'Weekly', 'Monthly'].includes(v.recurrenceType);
    const R = Validators.required;
    const max = (n: number): ValidatorFn => Validators.maxLength(n);
    const set = (name: keyof TriggerFormValue, validators: ValidatorFn[]): void => {
      const c = this.form.controls[name];
      c.setValidators(validators);
      c.updateValueAndValidity({ emitEvent: false });
    };

    set('name', [R, max(100)]);
    set('description', [max(500)]);
    set('notificationType', [R, max(100), Validators.pattern(/^[A-Za-z0-9_.:-]+$/)]);
    set('iconName', [max(100)]);
    set('titleTemplate', [R, max(500), templateValidator()]);
    set('bodyTemplate', [R, templateValidator()]);
    set('titleTemplateAr', [max(500), templateValidator()]);
    set('bodyTemplateAr', [templateValidator()]);
    set('redirectData', [jsonObjectValidator()]);
    set('dataMapping', [max(1000), jsonObjectValidator()]);
    set('hasFileTemplate', [max(500), templateValidator()]);
    set('fileUrlTemplate', [max(1000), templateValidator()]);
    set('fileContentTypeTemplate', [max(500), templateValidator()]);

    set('tableName', db ? [R, max(100), tableNameValidator()] : []);
    set('triggerOperation', db ? [R] : []);
    set('conditions', db ? [max(1000), conditionsValidator()] : []);

    set('recurrenceType', db ? [] : [R]);
    set('cronExpression', !db && v.recurrenceType === 'Cron' ? [R, max(100), cronValidator()] : []);
    set('scheduledTime', timed ? [R, timeValidator()] : []);
    set('scheduleStartDate', !db && v.recurrenceType === 'Once' ? [R, ...(this.isEdit() ? [] : [futureDateValidator()])] : []);

    set('targetUsersQuery', v.targetMode === 'users' ? [R, max(2000), userTargetsValidator()] : []);
    set('allowedRoles', v.targetMode === 'roles' ? [R, max(500), rolesValidator()] : []);
  }

  // ── editor helpers ──
  setCron(cron: string): void {
    const c = this.form.controls.cronExpression;
    c.setValue(cron);
    c.markAsDirty();
  }

  rememberField(name: TemplateField, e: Event): void {
    this.lastField.set({ name, el: e.target as HTMLInputElement | HTMLTextAreaElement });
  }

  /** Inserts text at the caret of an input/textarea and keeps the form control in sync. */
  insert(name: keyof TriggerFormValue, text: string, el: HTMLInputElement | HTMLTextAreaElement): void {
    const control = this.form.controls[name] as FormControl<string>;
    const current = control.value ?? '';
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? start;
    control.setValue(current.slice(0, start) + text + current.slice(end));
    control.markAsDirty();
    queueMicrotask(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  }

  insertToken(token: string): void {
    const target = this.lastField();
    const name: TemplateField = target?.name ?? 'bodyTemplate';
    const el = target?.el ?? (this.host.nativeElement.querySelector('#f-body') as HTMLTextAreaElement | null);
    if (el) this.insert(name, `{{${token}}}`, el);
  }

  insertExample(name: 'redirectData' | 'dataMapping'): void {
    const control = this.form.controls[name];
    control.setValue(name === 'redirectData' ? '{"web":"/path/{{Id}}","mobile":"/path"}' : '{"id":"{{Id}}"}');
    control.markAsDirty();
  }

  arHasError(): boolean {
    return ['titleTemplateAr', 'bodyTemplateAr'].some(n => {
      const c = this.form.get(n);
      return !!c && c.invalid && (c.touched || c.dirty || this.submitted());
    });
  }

  enHasError(): boolean {
    return ['titleTemplate', 'bodyTemplate'].some(n => {
      const c = this.form.get(n);
      return !!c && c.invalid && (c.touched || c.dirty || this.submitted());
    });
  }

  channelError(): boolean { return this.form.hasError('needsChannel') && (this.submitted() || this.form.touched); }

  // ── save ──
  submit(): void {
    this.submitted.set(true);
    this.serverError.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      if (this.arHasError() && !this.enHasError()) this.msgLang.set('ar');
      else if (this.enHasError()) this.msgLang.set('en');
      this.toast.error(this.i18n.t('form.fixErrors'));
      setTimeout(() => this.focusFirstInvalid());
      return;
    }

    const raw = this.form.getRawValue() as TriggerFormValue;
    const id = this.editId();
    this.saving.set(true);

    (id === null ? this.api.create(formToCreate(raw)) : this.api.update(id, formToUpdate(raw))).subscribe({
      next: saved => {
        this.saving.set(false);
        this.form.markAsPristine();
        this.toast.success(this.i18n.t(id === null ? 'toast.created' : 'toast.updated', { name: saved.name }));
        void this.router.navigate(['/admin/notifications/triggers']);
      },
      error: err => {
        this.saving.set(false);
        const problem = toApiProblem(err);
        const applied = applyServerErrors(this.form, problem);
        this.serverError.set(problem.message || (applied ? this.i18n.t('form.fixErrors') : this.i18n.t('form.saveFailed')));
        this.toast.error(this.i18n.t('form.saveFailed'), problem.message || undefined);
        setTimeout(() => this.host.nativeElement.querySelector('.banner--error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      },
    });
  }

  cancel(): void { void this.router.navigate(['/admin/notifications/triggers']); }

  private focusFirstInvalid(): void {
    const el = this.host.nativeElement.querySelector<HTMLElement>(
      '.field--invalid input, .field--invalid textarea, .field--invalid select, .group-error');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
  }

  // Egypt-time helpers for the Weekly / Monthly summary (the server anchors them to Cairo time).
  private cairoWeekday(local: string, loc: string): string {
    const d = local ? new Date(local) : new Date(Date.UTC(2024, 0, 1, 12));   // default: Monday
    return new Intl.DateTimeFormat(loc, { timeZone: 'Africa/Cairo', weekday: 'long' }).format(d);
  }
  private cairoDay(local: string): number {
    if (!local) return 1;
    return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', day: 'numeric' }).format(new Date(local))) || 1;
  }
}
