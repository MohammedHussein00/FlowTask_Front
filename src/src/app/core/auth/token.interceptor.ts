// import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { catchError, switchMap, throwError } from 'rxjs';
// import { AuthService } from './auth.service';

// // ─────────────────────────────────────────────────────────────────
// // 1. Attaches Bearer token to every outgoing request
// // 2. On 401: attempts one silent token refresh, then retries
// // 3. On second 401: logs the user out
// // ─────────────────────────────────────────────────────────────────

// let isRefreshing = false;

// export const tokenInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
//   const auth  = inject(AuthService);
//   // const token = auth.token;

//   // Attach token
//   const authReq = token
//     ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
//     : req;

//   return next(authReq).pipe(
//     catchError((error: HttpErrorResponse) => {
//       // 401 = token expired — attempt refresh
//       // if (error.status === 4  01 && !isRefreshing && auth.refreshAccessToken()) {
//         isRefreshing = true;

//         // TODO: call your backend's refresh token GraphQL mutation here
//         // Example:
//         // return apollo.mutate({ mutation: REFRESH_TOKEN_MUTATION,
//         //   variables: { refreshToken: auth.getRefreshToken() }
//         // }).pipe(
//         //   switchMap((res) => {
//         //     isRefreshing = false;
//         //     const newToken = res.data.refreshToken.accessToken;
//         //     auth.updateAccessToken(newToken);
//         //     return next(req.clone({
//         //       setHeaders: { Authorization: `Bearer ${newToken}` }
//         //     }));
//         //   }),
//         //   catchError(() => {
//         //     isRefreshing = false;
//         //     auth.logout();
//         //     return throwError(() => error);
//         //   })
//         // );

//         // For now — logout on 401
//         isRefreshing = false;
//         // auth.logout();
//         return throwError(() => error);
//       }

//       if (error.status === 401) {
//         // auth.logout();
//       }

//       return throwError(() => error);
//     })
//   );
// };
