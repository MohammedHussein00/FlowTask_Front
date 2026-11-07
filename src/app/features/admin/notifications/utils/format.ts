// src/app/features/admin/notifications/utils/format.ts

/** The API serialises UTC DateTimes without a "Z" (EF returns Kind=Unspecified) — treat them as UTC. */
export function parseUtc(value: string | null | undefined): Date | null {
  if (!value) return null;
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const d = new Date(hasZone ? value : value + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(value: string | null | undefined, locale: string): string {
  const d = parseUtc(value);
  return d ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d) : '—';
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 31_536_000], ['month', 2_592_000], ['day', 86_400], ['hour', 3_600], ['minute', 60],
];

/** "in 3 hours" / "2 days ago" in the active UI language. */
export function relativeTime(value: string | null | undefined, locale: string): string {
  const d = parseUtc(value);
  if (!d) return '—';
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, secs] of UNITS) {
    if (abs >= secs) return rtf.format(Math.round(diffSec / secs), unit);
  }
  return rtf.format(Math.round(diffSec / 60), 'minute');
}

/** UTC ISO string → value for <input type="datetime-local"> in the browser's time zone. */
export function toLocalInput(value: string | null | undefined): string {
  const d = parseUtc(value);
  if (!d) return '';
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** <input type="datetime-local"> value (browser-local) → UTC ISO string for the API. */
export function toUtcIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function browserTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'local'; }
}
