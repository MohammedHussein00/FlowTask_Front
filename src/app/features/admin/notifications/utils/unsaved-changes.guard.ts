// src/app/features/admin/notifications/utils/unsaved-changes.guard.ts
import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmService } from '../ui/confirm.service';
import { AnI18n } from './an-i18n';

export interface HasUnsavedChanges { hasUnsavedChanges(): boolean; }

/** Asks before leaving the trigger form with edits that were not saved. */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = component => {
  if (!component.hasUnsavedChanges()) return true;
  const i18n = inject(AnI18n);
  return inject(ConfirmService).ask({
    title: i18n.t('unsaved.title'),
    message: i18n.t('unsaved.message'),
    confirmLabel: i18n.t('unsaved.leave'),
    cancelLabel: i18n.t('unsaved.stay'),
    tone: 'danger',
  });
};
