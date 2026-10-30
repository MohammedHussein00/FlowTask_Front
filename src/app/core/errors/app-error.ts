export type AppErrorKind = 'network' | 'graphql' | 'payload' | 'validation' | 'unknown';

export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

export interface AppErrorOptions {
  kind: AppErrorKind;
  code?: string;
  publicMessage: string;
  fieldErrors?: FieldError[];
  cause?: unknown;
  retryable?: boolean;
}

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly code?: string;
  readonly publicMessage: string;
  readonly fieldErrors: readonly FieldError[];
  readonly retryable: boolean;

  constructor(options: AppErrorOptions) {
    super(options.publicMessage);
    this.name = 'AppError';
    this.kind = options.kind;
    this.code = options.code;
    this.publicMessage = options.publicMessage;
    this.fieldErrors = options.fieldErrors ?? [];
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }
}
