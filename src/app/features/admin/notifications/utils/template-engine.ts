// src/app/features/admin/notifications/utils/template-engine.ts
/**
 * Client-side twin of the backend TemplateEngine (PetroFlow.Infrastructure/Notifications/TemplateEngine.cs).
 * Used for live previews and "would this row fire?" checks. Keep the two in sync.
 */
export interface PreviewContext {
  table: string;
  operation: string;
  old: Record<string, string | null>;
  new: Record<string, string | null>;
}

export const TOKEN_RE = /\{\{\s*([\w.]+)\s*\}\}/g;
const RESERVED = new Set(['table', 'operation', 'now']);

const CLAUSE_RE = /^\s*\{\{\s*([\w.]+)\s*\}\}\s*(==|!=|>=|<=|>|<|contains|changed)\s*(.*?)\s*$/i;
export const AND_RE = /\s+AND\s+/i;

function ci(map: Record<string, string | null>, key: string): string | null | undefined {
  const hit = Object.keys(map).find(k => k.toLowerCase() === key.toLowerCase());
  return hit === undefined ? undefined : map[hit];
}

export function resolveToken(key: string, ctx: PreviewContext): string | null {
  const lower = key.toLowerCase();
  if (lower.startsWith('old.')) return ci(ctx.old, key.slice(4)) ?? null;
  if (lower.startsWith('new.')) return ci(ctx.new, key.slice(4)) ?? null;
  if (lower === 'table') return ctx.table;
  if (lower === 'operation') return ctx.operation;
  if (lower === 'now') return new Date().toISOString();
  const fromNew = ci(ctx.new, key);
  return fromNew !== undefined ? fromNew : (ci(ctx.old, key) ?? null);
}

export function renderTemplate(template: string | null | undefined, ctx: PreviewContext, jsonEscape = false): string {
  if (!template) return '';
  return template.replace(TOKEN_RE, (_m, key: string) => {
    const v = resolveToken(key, ctx) ?? '';
    return jsonEscape ? JSON.stringify(v).slice(1, -1) : v;
  });
}

function unquote(v: string): string {
  const t = v.trim();
  return t.length >= 2 && ((t[0] === "'" && t.at(-1) === "'") || (t[0] === '"' && t.at(-1) === '"')) ? t.slice(1, -1) : t;
}

function isNum(v: string | null): v is string {
  return v !== null && v.trim() !== '' && !Number.isNaN(Number(v));
}

function hasChanged(field: string, ctx: PreviewContext): boolean {
  const f = field.includes('.') ? field.slice(field.indexOf('.') + 1) : field;
  if (ctx.operation === 'INSERT') return ci(ctx.new, f) !== undefined;
  if (ctx.operation === 'DELETE') return ci(ctx.old, f) !== undefined;
  const o = ci(ctx.old, f);
  return o !== undefined && o !== (ci(ctx.new, f) ?? null);
}

function compare(actual: string | null, op: string, expected: string): boolean {
  const eq = (): boolean => {
    if (expected.toLowerCase() === 'null') return !actual;
    if (isNum(actual) && isNum(expected)) return Number(actual) === Number(expected);
    return (actual ?? '').toLowerCase() === expected.toLowerCase();
  };
  switch (op) {
    case '==': return eq();
    case '!=': return !eq();
    case 'contains': return (actual ?? '').toLowerCase().includes(expected.toLowerCase());
  }
  const cmp = isNum(actual) && isNum(expected)
    ? Number(actual) - Number(expected)
    : (actual ?? '').toLowerCase().localeCompare(expected.toLowerCase());
  return op === '>' ? cmp > 0 : op === '<' ? cmp < 0 : op === '>=' ? cmp >= 0 : cmp <= 0;
}

/** Same grammar as the server: clauses joined by AND; a malformed clause fails closed. */
export function evaluateConditions(conditions: string | null | undefined, ctx: PreviewContext): { ok: boolean; failed?: string } {
  if (!conditions?.trim()) return { ok: true };
  for (const clause of conditions.split(AND_RE)) {
    const m = CLAUSE_RE.exec(clause);
    if (!m) return { ok: false, failed: clause.trim() };
    const [, field, opRaw, value] = m;
    const op = opRaw.toLowerCase();
    const pass = op === 'changed' ? hasChanged(field, ctx) : compare(resolveToken(field, ctx), op, unquote(value));
    if (!pass) return { ok: false, failed: clause.trim() };
  }
  return { ok: true };
}

/** Stricter than the server on purpose: an operator with no value (`{{Status}} ==`) is almost certainly a mistake. */
export function isValidConditionClause(clause: string): boolean {
  const m = CLAUSE_RE.exec(clause);
  return !!m && (m[2].toLowerCase() === 'changed' || m[3].trim() !== '');
}

/** Unique {{Field}} names used across the given templates (reserved tokens excluded). */
export function extractTokens(...templates: Array<string | null | undefined>): string[] {
  const found = new Set<string>();
  for (const t of templates) {
    if (!t) continue;
    for (const m of t.matchAll(TOKEN_RE)) {
      const key = m[1];
      if (!RESERVED.has(key.toLowerCase())) found.add(key.replace(/^(old|new)\./i, ''));
    }
  }
  return [...found];
}

/** Parses the "sample row" JSON box. `Old` (object) holds the previous values for UPDATE previews. */
export function parseSample(json: string): { new: Record<string, string | null>; old: Record<string, string | null> } | null {
  try {
    const raw = JSON.parse(json || '{}') as unknown;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const flat = (o: Record<string, unknown>): Record<string, string | null> =>
      Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === null || v === undefined ? null : String(v)]));
    const { Old, old, ...rest } = raw as Record<string, unknown>;
    const oldObj = (Old ?? old) as Record<string, unknown> | undefined;
    return { new: flat(rest), old: oldObj && typeof oldObj === 'object' ? flat(oldObj) : {} };
  } catch {
    return null;
  }
}
