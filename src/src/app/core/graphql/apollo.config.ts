import { inject } from '@angular/core';
import { ApolloClientOptions, ApolloLink, InMemoryCache } from '@apollo/client/core';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { HttpLink } from 'apollo-angular/http';
import { AuthSessionStore } from '../auth/auth-session.store';
import { environment } from '../../../environments/environment';

// ── auth link — attaches bearer token from store (memory, restored on boot) ───
function buildAuthLink(session: AuthSessionStore): ApolloLink {
  return new ApolloLink((operation, forward) => {
    const token = session.accessToken;
    if (token) {
      operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
        headers: { ...headers, Authorization: `Bearer ${token}` },
      }));
    }
    return forward(operation);
  });
}

// ── error link — clears session on AUTH_NOT_AUTHENTICATED ─────────────────────
function buildErrorLink(session: AuthSessionStore): ApolloLink {
  return new ErrorLink(({ error }) => {
    if (CombinedGraphQLErrors.is(error)) {
      const isUnauthenticated = error.errors.some(
        (e) => (e.extensions?.['code'] as string) === 'AUTH_NOT_AUTHENTICATED',
      );
      if (isUnauthenticated) session.clear();
    }
  });
}

// ── factory used by APOLLO_OPTIONS ───────────────────────────────────────────
export function apolloOptionsFactory(): ApolloClientOptions {
  const httpLink = inject(HttpLink);
  const session  = inject(AuthSessionStore);

  const http  = httpLink.create({ uri: environment.graphqlUrl, withCredentials: true });
  const auth  = buildAuthLink(session);
  const error = buildErrorLink(session);

  return {
    link: ApolloLink.from([error, auth, http]),
    cache: new InMemoryCache(),
  };
}
