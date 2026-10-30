import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { GraphqlClientService, ApiPayload } from '../graphql/graphql-client.service';
import { AuthSessionStore, AuthSession } from './auth-session.store';
import { LOGIN_MUTATION, OAUTH_LOGIN_MUTATION, REGISTER_MUTATION } from '../graphql/auth.documents';

export type OAuthProviderName = 'GOOGLE' | 'GIT_HUB';
export const OAUTH_PROVIDER_GRAPHQL_NAME: Record<'google' | 'github', OAuthProviderName> = {
  google: 'GOOGLE',
  github: 'GIT_HUB',
};

export interface AuthResultDto {
  userId: number;
  email: string;
  fullName: string;
  accessToken: string;
  expiresAt: string;
}

export interface LoginInput    { email: string; password: string; }
export interface RegisterInput { fullName: string; email: string; password: string; }

interface LoginData    { login:      ApiPayload<AuthResultDto>; }
interface RegisterData { register:   ApiPayload<AuthResultDto>; }
interface OAuthData    { oAuthLogin: ApiPayload<AuthResultDto>; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly graphql = inject(GraphqlClientService);
  private readonly session = inject(AuthSessionStore);

  login(input: LoginInput): Observable<AuthResultDto> {
    return this.graphql.mutate<LoginData, { input: LoginInput }>(LOGIN_MUTATION, { input }).pipe(
      map(result => this.graphql.unwrapPayload(result.login)),
      tap(dto => this.setSession(dto)),
    );
  }

  register(input: RegisterInput): Observable<AuthResultDto> {
    return this.graphql.mutate<RegisterData, { input: RegisterInput }>(REGISTER_MUTATION, { input }).pipe(
      map(result => this.graphql.unwrapPayload(result.register)),
      tap(dto => this.setSession(dto)),
    );
  }

  oauthLogin(provider: OAuthProviderName, code: string): Observable<AuthResultDto> {
    return this.graphql.mutate<OAuthData, { input: { provider: OAuthProviderName; code: string } }>(
      OAUTH_LOGIN_MUTATION, { input: { provider, code } },
    ).pipe(
      map(result => this.graphql.unwrapPayload(result.oAuthLogin)),
      tap(dto => this.setSession(dto)),
    );
  }

  logout(): void {
    this.session.clear();
  }

  get accessToken(): string | null {
    return this.session.accessToken;
  }

  /**
   * Called by APP_INITIALIZER before any route guard runs.
   * Returns true when a valid, non-expired session with an access token exists.
   * The access token is restored from localStorage by AuthSessionStore.readStorage(),
   * so Apollo can attach it immediately on the first request after a page refresh.
   */
  restoreSession(): Observable<boolean> {
    const valid = this.session.isAuthenticated() && this.session.accessToken !== null;
    if (!valid) {
      this.session.clear(); // clean up any half-state (session marker but no token)
    }
    return of(valid);
  }

  private setSession(dto: AuthResultDto): void {
    const session: AuthSession = {
      user: { userId: dto.userId, email: dto.email, fullName: dto.fullName },
      accessToken: dto.accessToken,
      expiresAt: dto.expiresAt,
    };
    this.session.setSession(session);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Keep AppError import for isAppError type-guard
import { AppError } from '../errors/app-error';
