// src/app/features/admin/notifications/utils/validation-messages.ts
import { ValidationErrors } from '@angular/forms';
import { AnI18n } from './an-i18n';

/** Picks the most relevant error of a control and returns a localised sentence. */
export function validationMessage(errors: ValidationErrors | null, i18n: AnI18n): string {
  if (!errors) return '';
  if (typeof errors['server'] === 'string') return errors['server'];                    // message from the API
  if (errors['required']) return i18n.t('v.required');
  if (errors['maxlength']) return i18n.t('v.maxlength', { max: errors['maxlength'].requiredLength });
  if (errors['pattern']) return i18n.t('v.pattern');
  if (errors['badTable']) return i18n.t('v.badTable');
  if (errors['badCron']) return i18n.t('v.badCron.' + errors['badCron'].reason);
  if (errors['conditionsOr']) return i18n.t('v.conditionsOr');
  if (errors['badConditions']) return i18n.t('v.badConditions', { clause: errors['badConditions'].clause });
  if (errors['badTemplate']) return i18n.t('v.badTemplate');
  if (errors['invalidJson']) return i18n.t('v.invalidJson');
  if (errors['jsonObject']) return i18n.t('v.jsonObject');
  if (errors['badUserTargets']) return i18n.t('v.badUserTargets', { token: errors['badUserTargets'].token });
  if (errors['badRoles']) return i18n.t('v.badRoles', { role: errors['badRoles'].role });
  if (errors['badTime']) return i18n.t('v.badTime');
  if (errors['futureDate']) return i18n.t('v.futureDate');
  return i18n.t('v.invalid');
}
