import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { DocumentNode } from 'graphql';
import { Observable, catchError, map } from 'rxjs';
import { AppError, FieldError } from '../errors/app-error';
import { normalizeGraphqlError } from './graphql-error.mapper';

export interface ApiPayload<T> {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    errors?: FieldError[];
  };
}

@Injectable({ providedIn: 'root' })
export class GraphqlClientService {
  private readonly apollo = inject(Apollo);

  query<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
    query: DocumentNode,
    variables?: TVariables,
    fetchPolicy: 'cache-first' | 'network-only' = 'cache-first',
  ): Observable<TData> {
    return this.apollo.query<TData>({ query, variables, fetchPolicy }).pipe(
      map(result => result.data),
      map(data => {
        if (!data) throw this.unknownError();
        return data;
      }),
      catchError(error => { throw normalizeGraphqlError(error); }),
    );
  }

  mutate<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
    mutation: DocumentNode,
    variables?: TVariables,
  ): Observable<TData> {
    return this.apollo.mutate<TData>({ mutation, variables }).pipe(
      map(result => {
        if (!result.data) throw this.unknownError();
        return result.data;
      }),
    );
  }

  unwrapPayload<T>(payload: ApiPayload<T>): T {
    if (payload.success === false || payload.error || !payload.data) {
      const apiError = payload.error;
      throw new AppError({
        kind: 'payload',
        code: apiError?.code,
        publicMessage: this.safeMessage(apiError?.code, apiError?.message),
        fieldErrors: apiError?.errors ?? [],
      });
    }
    return payload.data;
  }

  private safeMessage(code?: string, serverMessage?: string): string {
    // Preserve generic authentication wording to avoid account enumeration.
    if (['INVALID_CREDENTIALS', 'USER_NOT_FOUND', 'WRONG_PASSWORD'].includes(code ?? '')) {
      return 'Incorrect email or password.';
    }
    return serverMessage || 'The request could not be completed.';
  }

  private unknownError(): AppError {
    return new AppError({ kind: 'unknown', publicMessage: 'The server returned an empty response.', retryable: true });
  }
}
