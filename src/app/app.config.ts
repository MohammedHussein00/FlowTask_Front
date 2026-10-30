import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { APOLLO_OPTIONS, Apollo } from 'apollo-angular';
import { provideTransloco, TranslocoLoader, Translation } from '@ngneat/transloco';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';
import { AuthSessionStore } from './core/auth/auth-session.store';
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import { LocaleService } from './core/i18n/locale.service';
import { apolloOptionsFactory } from './core/graphql/apollo.config';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class GlobalTranslocoLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    LocaleService,
    AuthSessionStore,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    // Restores session (including access token) from localStorage before
    // any route guard or API call runs.
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const auth = inject(AuthService);
        return () => firstValueFrom(auth.restoreSession());
      },
      multi: true,
    },

    // Apollo — single setup via apolloOptionsFactory
    Apollo,
    {
      provide: APOLLO_OPTIONS,
      useFactory: apolloOptionsFactory,
    },

    provideTransloco({
      config: {
        availableLangs: ['en', 'ar', 'fr'],
        defaultLang: 'ar',
        reRenderOnLangChange: true,
        prodMode: environment.production,
      },
      loader: GlobalTranslocoLoader,
    }),
  ],
};
