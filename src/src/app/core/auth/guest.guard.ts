import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionStore } from './auth-session.store';

export const guestGuard: CanActivateFn = () => {
  const session = inject(AuthSessionStore);
  return session.isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};
