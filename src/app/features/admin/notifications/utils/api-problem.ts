// src/app/features/admin/notifications/utils/api-problem.ts
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ApiProblem } from '../models/notification-admin.models';

function camel(key: string): string {
  return key ? key.charAt(0).toLowerCase() + key.slice(1) : key;
}

/**
 * Turns whatever the API sent back into one shape. Understands ASP.NET ValidationProblemDetails
 * ({ errors: { Name: ["..."] } }), plain { error } / { message } bodies and the app's own
 * { error: { message, errors: [{ field, message }] } } payload.
 */
export function toApiProblem(err: unknown): ApiProblem {
  if (!(err instanceof HttpErrorResponse)) {
    return { status: 0, message: err instanceof Error ? err.message : '', fieldErrors: {} };
  }

  const body = err.error as Record<string, unknown> | string | null;
  const fieldErrors: Record<string, string[]> = {};
  let message = '';

  if (typeof body === 'string') {
    message = body;
  } else if (body && typeof body === 'object') {
    const errors = body['errors'];
    if (errors && !Array.isArray(errors) && typeof errors === 'object') {
      for (const [k, v] of Object.entries(errors as Record<string, unknown>)) {
        fieldErrors[camel(k)] = Array.isArray(v) ? v.map(String) : [String(v)];
      }
    } else if (Array.isArray(errors)) {
      for (const e of errors as Array<{ field?: string; message?: string }>) {
        if (e.field && e.message) (fieldErrors[camel(e.field)] ??= []).push(e.message);
      }
    }

    const nested = body['error'];
    message =
      (typeof nested === 'string' ? nested : (nested as { message?: string } | undefined)?.message) ??
      (body['message'] as string | undefined) ??
      (body['detail'] as string | undefined) ??
      (body['title'] as string | undefined) ??
      '';
  }

  return { status: err.status, message, fieldErrors };
}

/** Copies server-side field errors onto matching form controls; returns how many were applied. */
export function applyServerErrors(form: FormGroup, problem: ApiProblem): number {
  let applied = 0;
  for (const [field, messages] of Object.entries(problem.fieldErrors)) {
    const control: AbstractControl | null = form.get(field);
    if (!control) continue;
    control.setErrors({ ...(control.errors ?? {}), server: messages[0] });
    control.markAsTouched();
    applied++;
  }
  return applied;
}
