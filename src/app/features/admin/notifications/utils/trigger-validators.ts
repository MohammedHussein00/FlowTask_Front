// src/app/features/admin/notifications/utils/trigger-validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AND_RE, TOKEN_RE, isValidConditionClause } from './template-engine';

/** Physical MySQL table name: letters, digits, underscore. Prevents typos like "user table" or "users;". */
export const TABLE_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]{0,99}$/;

const isEmpty = (v: unknown): boolean => v === null || v === undefined || String(v).trim() === '';

/** Valid JSON that is an object (or empty). {{Field}} tokens inside strings are fine. */
export function jsonObjectValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (isEmpty(c.value)) return null;
    try {
      const parsed: unknown = JSON.parse(String(c.value));
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? null : { jsonObject: true };
    } catch {
      return { invalidJson: true };
    }
  };
}

/** Every `{{` must open a well-formed `{{Field}}` token — catches `{{Name}`, `{ {Name}}`, `{{ }}` etc. */
export function templateValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (isEmpty(c.value)) return null;
    const rest = String(c.value).replace(TOKEN_RE, '');
    return rest.includes('{{') || rest.includes('}}') ? { badTemplate: true } : null;
  };
}

/** Conditions grammar: `{{Field}} op value` clauses joined by AND. */
export function conditionsValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (isEmpty(c.value)) return null;
    // OR is not part of the grammar (a stray "OR" would silently become part of the value) — outside quotes it is an error.
    if (/\s+OR\s+/i.test(String(c.value).replace(/'[^']*'|"[^"]*"/g, "''"))) return { conditionsOr: true };
    const bad = String(c.value).split(AND_RE).find(clause => !isValidConditionClause(clause));
    return bad === undefined ? null : { badConditions: { clause: bad.trim() } };
  };
}

export function tableNameValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null =>
    isEmpty(c.value) || TABLE_NAME_RE.test(String(c.value).trim()) ? null : { badTable: true };
}

/** Comma list of positive user ids and/or {{Field}} tokens, e.g. `{{UserId}}, 5`. */
export function userTargetsValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (isEmpty(c.value)) return null;
    const bad = String(c.value)
      .split(/[,;\s]+/)
      .filter(Boolean)
      .find(t => !(/^[1-9]\d{0,9}$/.test(t) || /^\{\{\s*[\w.]+\s*\}\}$/.test(t)));
    return bad === undefined ? null : { badUserTargets: { token: bad } };
  };
}

export function rolesValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (isEmpty(c.value)) return null;
    const bad = String(c.value).split(',').map(s => s.trim()).find(r => !/^[\w][\w .-]{0,49}$/.test(r));
    return bad === undefined ? null : { badRoles: { role: bad } };
  };
}

// ───────────── Quartz cron (6 or 7 fields: sec min hour dom month dow [year]) ─────────────
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function num(token: string, names: string[] | null, offset: number): number {
  const t = token.toUpperCase();
  if (/^\d+$/.test(t)) return Number(t);
  const i = names ? names.indexOf(t) : -1;
  return i < 0 ? NaN : i + offset;
}

function cronFieldOk(raw: string, min: number, max: number, names: string[] | null, nameOffset: number, kind: 'dom' | 'dow' | 'other'): boolean {
  const inRange = (n: number): boolean => Number.isInteger(n) && n >= min && n <= max;
  return raw.split(',').every(part => {
    if (part === '*' || part === '?') return true;
    if (kind === 'dom' && (part === 'L' || part === 'LW' || /^L-\d+$/.test(part))) return true;
    if (kind === 'dom' && /^\d+W$/.test(part)) return inRange(Number(part.slice(0, -1)));
    if (kind === 'dow' && part.toUpperCase() === 'L') return true;
    if (kind === 'dow' && /^\w+L$/.test(part)) return inRange(num(part.slice(0, -1), names, nameOffset));
    if (kind === 'dow' && /^\w+#[1-5]$/.test(part)) return inRange(num(part.split('#')[0], names, nameOffset));

    const [range, step] = part.split('/');
    if (step !== undefined && !/^\d+$/.test(step)) return false;
    if (range === '*') return true;
    const ends = range.split('-');
    if (ends.length > 2) return false;
    return ends.every(e => inRange(num(e, names, nameOffset)));
  });
}

export function cronValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (isEmpty(c.value)) return null;
    const f = String(c.value).trim().split(/\s+/);
    if (f.length !== 6 && f.length !== 7) return { badCron: { reason: 'fields' } };

    const ok =
      cronFieldOk(f[0], 0, 59, null, 0, 'other') &&
      cronFieldOk(f[1], 0, 59, null, 0, 'other') &&
      cronFieldOk(f[2], 0, 23, null, 0, 'other') &&
      cronFieldOk(f[3], 1, 31, null, 0, 'dom') &&
      cronFieldOk(f[4], 1, 12, MONTHS, 1, 'other') &&
      cronFieldOk(f[5], 1, 7, DAYS, 1, 'dow') &&
      (f.length === 6 || cronFieldOk(f[6], 1970, 2199, null, 0, 'other'));
    if (!ok) return { badCron: { reason: 'value' } };

    // Quartz: day-of-month and day-of-week can't both be restricted — exactly one must be "?".
    const domQ = f[3] === '?';
    const dowQ = f[5] === '?';
    return domQ === dowQ ? { badCron: { reason: 'dayConflict' } } : null;
  };
}

/** HH:mm */
export function timeValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null =>
    isEmpty(c.value) || /^([01]\d|2[0-3]):[0-5]\d$/.test(String(c.value)) ? null : { badTime: true };
}

/** Local datetime string must be in the future (used for "Once" triggers on create). */
export function futureDateValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (isEmpty(c.value)) return null;
    const t = new Date(String(c.value)).getTime();
    return Number.isNaN(t) || t > Date.now() ? null : { futureDate: true };
  };
}

// ───────────── group-level validators ─────────────
export function dateRangeValidator(start: string, end: string): ValidatorFn {
  return (g: AbstractControl): ValidationErrors | null => {
    const s = g.get(start)?.value as string;
    const e = g.get(end)?.value as string;
    if (isEmpty(s) || isEmpty(e)) return null;
    return new Date(e).getTime() <= new Date(s).getTime() ? { endBeforeStart: true } : null;
  };
}

/** At least one delivery channel (in-app / push / email) must be on, otherwise the trigger does nothing. */
export function channelsValidator(): ValidatorFn {
  return (g: AbstractControl): ValidationErrors | null => {
    const v = g.value as Record<string, unknown>;
    return v['sendToNotificationTable'] || v['sendPushNotification'] || v['sendEmail'] ? null : { needsChannel: true };
  };
}

/** If a "has file" template is set, a file URL template is mandatory. */
export function fileTemplateValidator(): ValidatorFn {
  return (g: AbstractControl): ValidationErrors | null => {
    const has = g.get('hasFileTemplate')?.value as string;
    const url = g.get('fileUrlTemplate')?.value as string;
    return !isEmpty(has) && isEmpty(url) ? { needsFileUrl: true } : null;
  };
}
