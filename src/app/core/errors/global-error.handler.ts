import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { AppError } from './app-error';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly notifications = inject(NotificationService);

  handleError(error: unknown): void {
    const normalized = error instanceof AppError
      ? error
      : new AppError({
          kind: 'unknown',
          publicMessage: 'Something went wrong. Please try again.',
          cause: error,
          retryable: true,
        });

    // Do not display stack traces, raw GraphQL extensions, or response bodies.
    this.notifications.error('Request failed', normalized.publicMessage);

    // Replace this with a privacy-safe telemetry adapter in production.
    if (!this.isProduction()) console.error('[FlowTask]', error);
  }

  private isProduction(): boolean {
    return document.documentElement.dataset['environment'] === 'production';
  }
}
