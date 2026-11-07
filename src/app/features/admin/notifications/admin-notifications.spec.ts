// src/app/features/admin/notifications/admin-notifications.spec.ts
// Render + behaviour tests for the notification admin pages. Assertions use translation KEYS (the i18n service is stubbed),
// and only describe/it/expect, so they run unchanged under Vitest or Jasmine/Karma.
import { TestBed } from '@angular/core/testing';
import { hasAdminRole, rolesFromToken } from '../../../core/auth/admin.guard';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentI18nService } from '../../../core/i18n/component-i18n.service';
import { LocaleService } from '../../../core/i18n/locale.service';
import { NotificationService } from '../../../core/errors/notification.service';
import { TriggerListComponent } from './triggers/trigger-list/trigger-list.component';
import { TriggerFormComponent } from './triggers/trigger-form/trigger-form.component';
import { NotificationsOverviewComponent } from './overview/notifications-overview.component';
import { NotificationsGuideComponent } from './guide/notifications-guide.component';
import { ConfirmService } from './ui/confirm.service';
import { AnConfirmHostComponent } from './ui/an-confirm-host/an-confirm-host.component';

const toasts: string[] = [];
const expectMatch = (actual: Record<string, unknown>, expected: Record<string, unknown>) => { for (const [k, v] of Object.entries(expected)) expect(actual[k]).toEqual(v); };
beforeAll(() => { Element.prototype.scrollIntoView = () => undefined; });
function setup(extra: any[] = []) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: ComponentI18nService, useValue: { load() {}, t: (_s: string, k: string) => k } },
      { provide: LocaleService, useValue: { current: 'en' } },
      { provide: NotificationService, useValue: { success: (m: string) => toasts.push('ok:' + m), error: (m: string) => toasts.push('err:' + m) } },
      ...extra,
    ],
  });
  return TestBed.inject(HttpTestingController);
}
const trigger = (o: Record<string, unknown> = {}) => ({
  id: 1, name: 'New code', description: 'desc', triggerType: 'DatabaseAction', tableName: 'codes', triggerOperation: 'INSERT', conditions: null,
  recurrenceType: null, cronExpression: null, scheduledTime: null, scheduleStartDate: null, scheduleEndDate: null, nextRunTime: null, lastRunTime: null,
  notificationType: 'CodeCreated', titleTemplate: 'T {{Name}}', bodyTemplate: 'B', titleTemplateAr: null, bodyTemplateAr: null, iconName: 'bell', priority: 'Medium',
  redirectData: '{}', dataMapping: null, hasFileTemplate: null, fileUrlTemplate: null, fileContentTypeTemplate: null, targetUsersQuery: null, allowedRoles: 'Admin',
  connectionStateFilter: 'Both', targetHubName: 'NotificationHub', sendToNotificationTable: true, sendPushNotification: false, sendEmail: false, sendSms: false,
  pushTarget: 'Both', isActive: true, createdAt: '2026-01-01T00:00:00', updatedAt: null, executionCount: 3, lastExecutedAt: '2026-11-01T10:00:00', ...o,
});
const flush = async (f: any) => { f.detectChanges(); await f.whenStable(); f.detectChanges(); };
const q = (f: any, sel: string) => f.nativeElement.querySelector(sel) as HTMLElement | null;
const qa = (f: any, sel: string) => Array.from(f.nativeElement.querySelectorAll(sel)) as HTMLElement[];
const typeInto = (el: HTMLInputElement | HTMLTextAreaElement, v: string) => { el.value = v; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('blur')); };

describe('Overview', () => {
  it('renders stats, mix and attention', async () => {
    const http = setup();
    const f = TestBed.createComponent(NotificationsOverviewComponent);
    f.detectChanges();
    http.expectOne(r => r.url.endsWith('/notification-triggers/statistics')).flush({ total: 3, active: 2, inactive: 1, totalExecutions: 42 });
    http.expectOne(r => r.url.includes('/notification-triggers') && r.params.get('pageSize') === '100').flush({ items: [
      trigger(), trigger({ id: 2, triggerType: 'Scheduled', triggerOperation: null, tableName: null, recurrenceType: 'Daily', scheduledTime: '09:00:00', nextRunTime: null, allowedRoles: 'Admin' }),
      trigger({ id: 3, isActive: false, allowedRoles: null }),
    ], total: 3, page: 1, pageSize: 100 });
    await flush(f);
    expect(qa(f, '.stat').length).toBe(4);
    expect(q(f, '.stat__value')!.textContent).toContain('3');
    expect(f.nativeElement.textContent).toContain('42');
    expect(f.nativeElement.textContent).toContain('overview.reason.noNextRun');
    expect(qa(f, '.bar').length).toBeGreaterThan(5);
    http.verify();
  });
  it('shows an error state with retry', async () => {
    const http = setup();
    const f = TestBed.createComponent(NotificationsOverviewComponent);
    f.detectChanges();
    http.expectOne(r => r.url.endsWith('/statistics')).flush({ error: 'boom' }, { status: 500, statusText: 'x' });
    await flush(f);
    expect(f.nativeElement.textContent).toContain('list.errorTitle');
  });
});

describe('Trigger list', () => {
  it('renders rows, toggles optimistically and deletes after confirm', async () => {
    const http = setup();
    const f = TestBed.createComponent(TriggerListComponent);
    f.detectChanges();
    http.expectOne(r => r.method === 'GET' && r.params.get('page') === '1').flush({ items: [trigger(), trigger({ id: 2, name: 'Second', isActive: false })], total: 2, page: 1, pageSize: 10 });
    await flush(f);
    expect(qa(f, 'tbody tr').length).toBe(2);
    expect(f.nativeElement.textContent).toContain('New code');

    // toggle second (paused → active)
    (qa(f, '.sw')[1] as HTMLButtonElement).click();
    await flush(f);
    const t = http.expectOne(r => r.url.endsWith('/2/toggle'));
    expect(t.request.method).toBe('POST');
    t.flush({ isActive: true });
    await flush(f);
    expect(qa(f, '.status__txt--on').length).toBe(2);

    // delete first → confirm dialog service
    const confirm = TestBed.inject(ConfirmService);
    (qa(f, '.icon-btn--danger')[0] as HTMLButtonElement).click();
    expect(confirm.pending()).not.toBeNull();
    confirm.answer(true);
    await flush(f);
    http.expectOne(r => r.method === 'DELETE' && r.url.endsWith('/1')).flush(null);
    await flush(f);
    http.expectOne(r => r.method === 'GET').flush({ items: [trigger({ id: 2 })], total: 1, page: 1, pageSize: 10 });
    await flush(f);
    expect(qa(f, 'tbody tr').length).toBe(1);
  });
  it('shows the empty state', async () => {
    const http = setup();
    const f = TestBed.createComponent(TriggerListComponent);
    f.detectChanges();
    http.expectOne(r => r.method === 'GET').flush({ items: [], total: 0, page: 1, pageSize: 10 });
    await flush(f);
    expect(f.nativeElement.textContent).toContain('list.emptyTitle');
  });
});

describe('Trigger form', () => {
  it('blocks submit with an empty form and shows localised errors, no request sent', async () => {
    const http = setup();
    const f = TestBed.createComponent(TriggerFormComponent);
    await flush(f);
    (q(f, 'button[type=submit]') as HTMLButtonElement).click();
    await flush(f);
    http.expectNone(r => r.method === 'POST');
    const text = f.nativeElement.textContent as string;
    expect(text).toContain('v.required');
    expect(qa(f, '.field__error').length).toBeGreaterThanOrEqual(4); // name, table, type, title, body, roles
    expect(toasts.at(-1)).toContain('form.fixErrors');
  });

  it('validates in place: bad table, bad conditions, bad json, bad template', async () => {
    setup();
    const f = TestBed.createComponent(TriggerFormComponent);
    await flush(f);
    typeInto(q(f, '#f-table') as HTMLInputElement, 'user table;');
    typeInto(q(f, '#f-cond') as HTMLTextAreaElement, '{{Status}} == 1 OR {{X}} == 2');
    typeInto(q(f, '#f-title') as HTMLInputElement, 'Hello {{Name}');
    await flush(f);
    const text = f.nativeElement.textContent as string;
    expect(text).toContain('v.badTable');
    expect(text).toContain('v.conditionsOr');
    expect(text).toContain('v.badTemplate');
  });

  it('creates a DB trigger with the right payload', async () => {
    const http = setup();
    const f = TestBed.createComponent(TriggerFormComponent);
    await flush(f);
    typeInto(q(f, '#f-name') as HTMLInputElement, '  Code created ');
    typeInto(q(f, '#f-table') as HTMLInputElement, 'codes');
    typeInto(q(f, '#f-type') as HTMLInputElement, 'CodeCreated');
    typeInto(q(f, '#f-title') as HTMLInputElement, 'New code: {{Name}}');
    typeInto(q(f, '#f-body') as HTMLTextAreaElement, 'Added {{Name}}');
    typeInto(q(f, '#f-roles') as HTMLInputElement, 'Admin, Dispatcher');
    await flush(f);
    (q(f, 'button[type=submit]') as HTMLButtonElement).click();
    await flush(f);
    const req = http.expectOne(r => r.method === 'POST' && r.url.endsWith('/notification-triggers'));
    expectMatch(req.request.body, {
      name: 'Code created', triggerType: 'DatabaseAction', tableName: 'codes', triggerOperation: 'INSERT', recurrenceType: null,
      notificationType: 'CodeCreated', titleTemplate: 'New code: {{Name}}', allowedRoles: 'Admin, Dispatcher', targetUsersQuery: null,
      sendToNotificationTable: true, sendPushNotification: false, sendSms: false, isActive: true, connectionStateFilter: 'Both',
    });
    req.flush(trigger({ name: 'Code created' }));
    await flush(f);
    expect(toasts.at(-1)).toContain('toast.created');
  });

  it('scheduled + cron: validates cron and shows the live preview verdict', async () => {
    setup();
    const f = TestBed.createComponent(TriggerFormComponent);
    await flush(f);
    (qa(f, '.seg--cards .seg__item')[1] as HTMLButtonElement).click();   // Scheduled
    await flush(f);
    expect(q(f, '#f-table')).toBeNull();
    const cron = qa(f, '.seg__item').find(b => b.textContent!.trim() === 'rec.cronShort') as HTMLButtonElement;
    cron.click();
    await flush(f);
    typeInto(q(f, '#f-cron') as HTMLInputElement, '* * * * *');
    await flush(f);
    expect(f.nativeElement.textContent).toContain('v.badCron.fields');
    typeInto(q(f, '#f-cron') as HTMLInputElement, '0 0 9 ? * MON-FRI');
    await flush(f);
    expect(f.nativeElement.textContent).not.toContain('v.badCron.fields');
    expect(f.nativeElement.textContent).toContain('sum.cron');
    expect(f.nativeElement.textContent).toContain('preview.scheduledNa');
  });

  it('live preview renders sample data and evaluates conditions', async () => {
    setup();
    const f = TestBed.createComponent(TriggerFormComponent);
    await flush(f);
    typeInto(q(f, '#f-title') as HTMLInputElement, 'Hi {{Name}}');
    typeInto(q(f, '#f-cond') as HTMLTextAreaElement, "{{Status}} == 'Approved'");
    await flush(f);
    typeInto(q(f, '#an-sample') as HTMLTextAreaElement, '{"Name":"Sara","Status":"Draft"}');
    await flush(f);
    expect(q(f, '.notif__title')!.textContent).toContain('Hi Sara');
    expect(f.nativeElement.textContent).toContain('preview.wouldNot');
    typeInto(q(f, '#an-sample') as HTMLTextAreaElement, '{"Name":"Sara","Status":"Approved"}');
    await flush(f);
    expect(f.nativeElement.textContent).toContain('preview.wouldFire');
  });

  it('edit mode loads the trigger, applies server field errors on 400', async () => {
    const { ActivatedRoute } = await import('@angular/router');
    const { of } = await import('rxjs');
    const http = setup([{ provide: ActivatedRoute, useValue: { paramMap: of({ get: (k: string) => (k === 'id' ? '7' : null) }), queryParamMap: of({ get: () => null }), snapshot: { queryParamMap: { get: () => null } } } }]);
    const f = TestBed.createComponent(TriggerFormComponent);
    f.detectChanges();
    http.expectOne(r => r.method === 'GET' && r.url.endsWith('/notification-triggers/7')).flush(trigger({ id: 7, name: 'Edit me' }));
    await flush(f);
    expect((q(f, '#f-name') as HTMLInputElement).value).toBe('Edit me');
    expect(f.nativeElement.textContent).toContain('form.editTitle');
    typeInto(q(f, '#f-name') as HTMLInputElement, 'Edited');
    (q(f, 'button[type=submit]') as HTMLButtonElement).click();
    await flush(f);
    const put = http.expectOne(r => r.method === 'PUT' && r.url.endsWith('/7'));
    expect(put.request.body.name).toBe('Edited');
    put.flush({ errors: { TableName: ['Table does not exist.'] }, title: 'One or more validation errors occurred.' }, { status: 400, statusText: 'Bad Request' });
    await flush(f);
    expect(f.nativeElement.textContent).toContain('Table does not exist.');
    expect(q(f, '.banner--error')).not.toBeNull();
  });
});

describe('Guide + confirm host', () => {
  it('renders all guide sections', async () => {
    setup();
    const f = TestBed.createComponent(NotificationsGuideComponent);
    await flush(f);
    expect(qa(f, '.card').length).toBe(6);
    expect(f.nativeElement.textContent).toContain('guide.templates.title');
  });
  it('confirm dialog resolves on button click and Escape', async () => {
    setup();
    const f = TestBed.createComponent(AnConfirmHostComponent);
    const svc = TestBed.inject(ConfirmService);
    const p = svc.ask({ title: 'T', message: 'M', confirmLabel: 'Yes', cancelLabel: 'No', tone: 'danger' });
    await flush(f);
    expect(q(f, '[role=alertdialog]')).not.toBeNull();
    (qa(f, '.btn')[1] as HTMLButtonElement).click();
    expect(await p).toBe(true);
    const p2 = svc.ask({ title: 'T', message: 'M', confirmLabel: 'Yes', cancelLabel: 'No' });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(await p2).toBe(false);
  });
});

const b64 = (o: unknown) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o)))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (payload: unknown) => `${b64({ alg: 'HS256' })}.${b64(payload)}.sig`;
describe('admin guard helpers', () => {
  it('reads role / roles / MS claim, string or array, case-insensitive', () => {
    expect(hasAdminRole(jwt({ role: 'Admin' }))).toBe(true);
    expect(hasAdminRole(jwt({ roles: ['User', 'admin'] }))).toBe(true);
    expect(hasAdminRole(jwt({ 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': ['Admin'] }))).toBe(true);
    expect(hasAdminRole(jwt({ role: 'User' }))).toBe(false);
    expect(hasAdminRole(jwt({ sub: '1' }))).toBe(false);
  });
  it('is safe on garbage', () => {
    expect(hasAdminRole(null)).toBe(false);
    expect(hasAdminRole('not.a.jwt')).toBe(false);
    expect(rolesFromToken('')).toEqual([]);
  });
  it('handles unicode payloads', () => { expect(hasAdminRole(jwt({ name: 'سارة', role: 'Admin' }))).toBe(true); });
});
