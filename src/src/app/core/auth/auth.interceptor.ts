import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

function isApiRequest(url: string): boolean {
  return (
    url.startsWith(environment.apiUrl) ||
    url.startsWith(environment.graphqlUrl)
  );
}

/**
 * Attaches the Bearer token to every outgoing API request.
 * On 401: clears the session and redirects to login.
 *
 * NOTE: Silent token refresh is not implemented because the backend does not
 * expose a refreshSession mutation. When the access token expires the user is
 * sent back to the login page.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const token = auth.accessToken;
  const authReq = req.clone({
    withCredentials: true,
    ...(token ? { setHeaders: { Authorization: `Bearer ${token}` } } : {}),
  });

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        auth.logout();
        router.navigateByUrl('/auth/login');
      }
      return throwError(() => err);
    }),
  );
};
