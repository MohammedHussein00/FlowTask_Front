// src/app/features/admin/notifications/models/notification-admin.models.ts
/** Types mirroring the PetroFlow notification API (NotificationTriggerDto & friends — camelCase JSON). */

export type TriggerType = 'DatabaseAction' | 'Scheduled';
export type TriggerOperation = 'INSERT' | 'UPDATE' | 'DELETE';
export type Recurrence = 'Once' | 'Daily' | 'Weekly' | 'Monthly' | 'Cron';
export type PushTarget = 'Both' | 'Mobile' | 'Web';
export type ConnectionFilter = 'Both' | 'Connected' | 'Disconnected';
export type Priority = 'Low' | 'Medium' | 'High';

export const TRIGGER_OPERATIONS: readonly TriggerOperation[] = ['INSERT', 'UPDATE', 'DELETE'];
export const RECURRENCES: readonly Recurrence[] = ['Once', 'Daily', 'Weekly', 'Monthly', 'Cron'];

export interface NotificationTrigger {
  id: number;
  name: string;
  description: string | null;
  triggerType: TriggerType;
  tableName: string | null;
  triggerOperation: TriggerOperation | null;
  conditions: string | null;
  recurrenceType: Recurrence | null;
  cronExpression: string | null;
  /** "HH:mm:ss" — Cairo local time. */
  scheduledTime: string | null;
  scheduleStartDate: string | null;
  scheduleEndDate: string | null;
  nextRunTime: string | null;
  lastRunTime: string | null;
  notificationType: string;
  titleTemplate: string;
  bodyTemplate: string;
  titleTemplateAr: string | null;
  bodyTemplateAr: string | null;
  iconName: string | null;
  priority: string | null;
  redirectData: string | null;
  dataMapping: string | null;
  hasFileTemplate: string | null;
  fileUrlTemplate: string | null;
  fileContentTypeTemplate: string | null;
  targetUsersQuery: string | null;
  allowedRoles: string | null;
  connectionStateFilter: ConnectionFilter;
  targetHubName: string | null;
  sendToNotificationTable: boolean;
  sendPushNotification: boolean;
  sendEmail: boolean;
  sendSms: boolean;
  pushTarget: PushTarget;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  executionCount: number;
  lastExecutedAt: string | null;
}

/** Body of POST /api/notification-triggers. */
export interface CreateTriggerRequest {
  name: string;
  description?: string | null;
  triggerType: TriggerType;
  tableName?: string | null;
  triggerOperation?: TriggerOperation | null;
  conditions?: string | null;
  recurrenceType?: Recurrence | null;
  cronExpression?: string | null;
  scheduledTime?: string | null;
  scheduleStartDate?: string | null;
  scheduleEndDate?: string | null;
  notificationType: string;
  titleTemplate: string;
  bodyTemplate: string;
  titleTemplateAr?: string | null;
  bodyTemplateAr?: string | null;
  iconName?: string | null;
  priority?: string | null;
  redirectData?: string | null;
  dataMapping?: string | null;
  hasFileTemplate?: string | null;
  fileUrlTemplate?: string | null;
  fileContentTypeTemplate?: string | null;
  targetUsersQuery?: string | null;
  allowedRoles?: string | null;
  connectionStateFilter: ConnectionFilter;
  targetHubName?: string | null;
  sendToNotificationTable: boolean;
  sendPushNotification: boolean;
  sendEmail: boolean;
  sendSms: boolean;
  pushTarget: PushTarget;
  isActive: boolean;
}

/** Body of PUT /api/notification-triggers/{id} — the backend only changes fields that are present. */
export type UpdateTriggerRequest = Partial<CreateTriggerRequest>;

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TriggerStatistics {
  total: number;
  active: number;
  inactive: number;
  totalExecutions: number;
}

export interface TriggerQuery {
  page: number;
  pageSize: number;
  search: string;
  /** null = all */
  isActive: boolean | null;
  /** '' = all */
  triggerType: '' | TriggerType;
  /** '' = all */
  operation: '' | TriggerOperation;
}

export const DEFAULT_TRIGGER_QUERY: TriggerQuery = {
  page: 1,
  pageSize: 10,
  search: '',
  isActive: null,
  triggerType: '',
  operation: '',
};

/** Normalised API failure. fieldErrors keys are camelCase form-control names. */
export interface ApiProblem {
  status: number;
  message: string;
  fieldErrors: Record<string, string[]>;
}
