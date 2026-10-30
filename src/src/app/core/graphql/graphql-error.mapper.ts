import { AppError, FieldError } from '../errors/app-error';

type UnknownRecord = Record<string, unknown>;

/**
 * Apollo Client v3 exposed ApolloError while current Apollo releases expose
 * specialised error classes. Structural parsing supports both error shapes
 * without coupling this application mapper to a removed runtime export.
 */
export function normalizeGraphqlError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const errors = graphqlErrorsFrom(error);
  const firstError = errors[0];
  const extensions = recordFrom(firstError?.['extensions']);
  const code = stringFrom(extensions['code']);
  const fieldErrors = fieldErrorsFrom(extensions['errors']);

  if (isNetworkError(error)) {
    return new AppError({
      kind: 'network',
      code: 'NETWORK_ERROR',
      publicMessage: 'Unable to reach the server. Check your connection and try again.',
      retryable: true,
      cause: error,
    });
  }

  return new AppError({
    kind: 'graphql',
    code,
    fieldErrors,
    publicMessage: safeGraphqlMessage(code),
    retryable: false,
    cause: error,
  });
}

function graphqlErrorsFrom(error: unknown): UnknownRecord[] {
  const value = recordFrom(error);
  // Apollo Client v3 uses graphQLErrors; Apollo Client v4 uses errors on CombinedGraphQLErrors.
  const candidates = value['graphQLErrors'] ?? value['errors'];
  return Array.isArray(candidates) ? candidates.map(recordFrom).filter(hasEntries) : [];
}

function isNetworkError(error: unknown): boolean {
  const value = recordFrom(error);
  if (value['networkError']) return true;

  const name = stringFrom(value['name']);
  return name === 'ServerError' || name === 'ServerParseError' || name === 'CombinedProtocolErrors';
}

function fieldErrorsFrom(value: unknown): FieldError[] {
  if (!Array.isArray(value)) return [];

  return value.map(recordFrom).filter(isFieldError).map((fieldError) => ({
    field: fieldError['field'],
    message: fieldError['message'],
    ...(typeof fieldError['code'] === 'string' ? { code: fieldError['code'] } : {}),
  }));
}

function recordFrom(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' ? value as UnknownRecord : {};
}

function hasEntries(value: UnknownRecord): boolean {
  return Object.keys(value).length > 0;
}

function isFieldError(value: UnknownRecord): value is UnknownRecord & { field: string; message: string; code?: string } {
  return typeof value['field'] === 'string' && typeof value['message'] === 'string';
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function safeGraphqlMessage(code?: string): string {
  switch (code) {
    case 'UNAUTHENTICATED': return 'Your session has expired. Please sign in again.';
    case 'FORBIDDEN': return 'You do not have permission to perform this action.';
    case 'BAD_USER_INPUT': return 'Please review the highlighted fields.';
    default: return 'The request could not be completed. Please try again.';
  }
}
