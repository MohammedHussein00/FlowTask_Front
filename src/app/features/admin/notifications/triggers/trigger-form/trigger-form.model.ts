// src/app/features/admin/notifications/triggers/trigger-form/trigger-form.model.ts
import {
  ConnectionFilter, CreateTriggerRequest, NotificationTrigger, PushTarget, Recurrence, TriggerOperation,
  TriggerType, UpdateTriggerRequest,
} from '../../models/notification-admin.models';
import { toLocalInput, toUtcIso } from '../../utils/format';

export type TargetMode = 'everyone' | 'users' | 'roles';

/** Flat, string-based model bound to the reactive form (empty string = "not set"). */
export interface TriggerFormValue {
  name: string;
  description: string;
  isActive: boolean;
  triggerType: TriggerType;
  // database action
  tableName: string;
  triggerOperation: TriggerOperation;
  conditions: string;
  // schedule
  recurrenceType: Recurrence;
  cronExpression: string;
  scheduledTime: string;        // HH:mm
  scheduleStartDate: string;    // datetime-local
  scheduleEndDate: string;      // datetime-local
  // message
  notificationType: string;
  iconName: string;
  priority: string;
  titleTemplate: string;
  bodyTemplate: string;
  titleTemplateAr: string;
  bodyTemplateAr: string;
  redirectData: string;
  dataMapping: string;
  hasFileTemplate: string;
  fileUrlTemplate: string;
  fileContentTypeTemplate: string;
  // recipients
  targetMode: TargetMode;
  targetUsersQuery: string;
  allowedRoles: string;
  connectionStateFilter: ConnectionFilter;
  // channels
  sendToNotificationTable: boolean;
  sendPushNotification: boolean;
  sendEmail: boolean;
  pushTarget: PushTarget;
}

export const EMPTY_FORM: TriggerFormValue = {
  name: '', description: '', isActive: true,
  triggerType: 'DatabaseAction',
  tableName: '', triggerOperation: 'INSERT', conditions: '',
  recurrenceType: 'Daily', cronExpression: '', scheduledTime: '09:00', scheduleStartDate: '', scheduleEndDate: '',
  notificationType: '', iconName: 'bell', priority: 'Medium',
  titleTemplate: '', bodyTemplate: '', titleTemplateAr: '', bodyTemplateAr: '',
  redirectData: '', dataMapping: '', hasFileTemplate: '', fileUrlTemplate: '', fileContentTypeTemplate: '',
  // "roles" (not "everyone") so a new trigger can never broadcast by accident — the admin must choose.
  targetMode: 'roles', targetUsersQuery: '', allowedRoles: '', connectionStateFilter: 'Both',
  sendToNotificationTable: true, sendPushNotification: false, sendEmail: false, pushTarget: 'Both',
};

export function triggerToForm(t: NotificationTrigger): TriggerFormValue {
  const users = (t.targetUsersQuery ?? '').trim();
  const roles = (t.allowedRoles ?? '').trim();
  return {
    name: t.name,
    description: t.description ?? '',
    isActive: t.isActive,
    triggerType: t.triggerType,
    tableName: t.tableName ?? '',
    triggerOperation: t.triggerOperation ?? 'INSERT',
    conditions: t.conditions ?? '',
    recurrenceType: t.recurrenceType ?? 'Daily',
    cronExpression: t.cronExpression ?? '',
    scheduledTime: (t.scheduledTime ?? '09:00').slice(0, 5),
    scheduleStartDate: toLocalInput(t.scheduleStartDate),
    scheduleEndDate: toLocalInput(t.scheduleEndDate),
    notificationType: t.notificationType,
    iconName: t.iconName ?? 'bell',
    priority: t.priority ?? 'Medium',
    titleTemplate: t.titleTemplate,
    bodyTemplate: t.bodyTemplate,
    titleTemplateAr: t.titleTemplateAr ?? '',
    bodyTemplateAr: t.bodyTemplateAr ?? '',
    redirectData: t.redirectData && t.redirectData.trim() !== '{}' ? t.redirectData : '',
    dataMapping: t.dataMapping ?? '',
    hasFileTemplate: t.hasFileTemplate ?? '',
    fileUrlTemplate: t.fileUrlTemplate ?? '',
    fileContentTypeTemplate: t.fileContentTypeTemplate ?? '',
    targetMode: users ? 'users' : roles ? 'roles' : 'everyone',
    targetUsersQuery: users,
    allowedRoles: roles,
    connectionStateFilter: t.connectionStateFilter ?? 'Both',
    sendToNotificationTable: t.sendToNotificationTable,
    sendPushNotification: t.sendPushNotification,
    sendEmail: t.sendEmail,
    pushTarget: t.pushTarget ?? 'Both',
  };
}

const orNull = (s: string): string | null => (s.trim() ? s.trim() : null);
const time = (hhmm: string): string | null => (/^\d{2}:\d{2}$/.test(hhmm) ? `${hhmm}:00` : null);

export function formToCreate(v: TriggerFormValue): CreateTriggerRequest {
  const db = v.triggerType === 'DatabaseAction';
  const sched = !db;
  return {
    name: v.name.trim(),
    description: orNull(v.description),
    triggerType: v.triggerType,
    tableName: db ? v.tableName.trim() : null,
    triggerOperation: db ? v.triggerOperation : null,
    conditions: db ? orNull(v.conditions) : null,
    recurrenceType: sched ? v.recurrenceType : null,
    cronExpression: sched && v.recurrenceType === 'Cron' ? v.cronExpression.trim() : null,
    scheduledTime: sched && ['Daily', 'Weekly', 'Monthly'].includes(v.recurrenceType) ? time(v.scheduledTime) : null,
    scheduleStartDate: sched ? toUtcIso(v.scheduleStartDate) : null,
    scheduleEndDate: sched ? toUtcIso(v.scheduleEndDate) : null,
    notificationType: v.notificationType.trim(),
    titleTemplate: v.titleTemplate.trim(),
    bodyTemplate: v.bodyTemplate.trim(),
    titleTemplateAr: orNull(v.titleTemplateAr),
    bodyTemplateAr: orNull(v.bodyTemplateAr),
    iconName: orNull(v.iconName),
    priority: orNull(v.priority),
    redirectData: orNull(v.redirectData),
    dataMapping: orNull(v.dataMapping),
    hasFileTemplate: orNull(v.hasFileTemplate),
    fileUrlTemplate: orNull(v.fileUrlTemplate),
    fileContentTypeTemplate: orNull(v.fileContentTypeTemplate),
    targetUsersQuery: v.targetMode === 'users' ? orNull(v.targetUsersQuery) : null,
    allowedRoles: v.targetMode === 'roles' ? orNull(v.allowedRoles) : null,
    connectionStateFilter: v.connectionStateFilter,
    targetHubName: 'NotificationHub',
    sendToNotificationTable: v.sendToNotificationTable,
    sendPushNotification: v.sendPushNotification,
    sendEmail: v.sendEmail,
    sendSms: false,
    pushTarget: v.pushTarget,
    isActive: v.isActive,
  };
}

/**
 * The backend PUT only touches fields that are present, and treats `null` as "leave alone".
 * Text fields are therefore sent as '' to clear them. Dates/time cannot be cleared through the API
 * (a limitation of UpdateNotificationTriggerDto) — they're simply omitted when empty.
 */
export function formToUpdate(v: TriggerFormValue): UpdateTriggerRequest {
  const base = formToCreate(v);
  const db = v.triggerType === 'DatabaseAction';
  return {
    ...base,
    description: v.description.trim(),
    tableName: db ? v.tableName.trim() : '',
    triggerOperation: db ? v.triggerOperation : undefined,
    conditions: db ? v.conditions.trim() : '',
    recurrenceType: db ? undefined : v.recurrenceType,
    cronExpression: !db && v.recurrenceType === 'Cron' ? v.cronExpression.trim() : '',
    scheduledTime: base.scheduledTime ?? undefined,
    scheduleStartDate: base.scheduleStartDate ?? undefined,
    scheduleEndDate: base.scheduleEndDate ?? undefined,
    titleTemplateAr: v.titleTemplateAr.trim(),
    bodyTemplateAr: v.bodyTemplateAr.trim(),
    iconName: v.iconName.trim(),
    priority: v.priority.trim(),
    redirectData: v.redirectData.trim(),
    dataMapping: v.dataMapping.trim(),
    hasFileTemplate: v.hasFileTemplate.trim(),
    fileUrlTemplate: v.fileUrlTemplate.trim(),
    fileContentTypeTemplate: v.fileContentTypeTemplate.trim(),
    targetUsersQuery: v.targetMode === 'users' ? v.targetUsersQuery.trim() : '',
    allowedRoles: v.targetMode === 'roles' ? v.allowedRoles.trim() : '',
  };
}
