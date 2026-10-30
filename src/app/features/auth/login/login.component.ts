import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AppError } from '../../../core/errors/app-error';
import { AuthService, OAUTH_PROVIDER_GRAPHQL_NAME } from '../../../core/auth/auth.service';
import { SocialAuthService, OAuthProvider } from '../../../core/auth/social-auth.service';
import { ComponentTranslatePipe } from '../../../core/i18n/component-translate.pipe';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { AuthLayoutComponent } from '../../../shared/components/auth-layout/auth-layout.component';
import { OauthIconComponent } from '../../../shared/components/oauth-icon/oauth-icon.component';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ComponentTranslatePipe, AppAlertComponent, AppButtonComponent, AuthLayoutComponent, OauthIconComponent, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly social = inject(SocialAuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  showPassword = false;
  loading = false;
  oauthLoading: OAuthProvider | null = null;
  generalError = '';
  providerError = '';
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  get emailError(): boolean { const c = this.form.controls.email; return c.invalid && (c.dirty || c.touched); }
  get passwordError(): boolean { const c = this.form.controls.password; return c.invalid && (c.dirty || c.touched); }

  errorFor(control: 'email' | 'password'): string {
    const errors = this.form.controls[control].errors;
    if (!errors) return '';
    if (errors['backend']) return errors['backend'];
    if (control === 'email' && errors['email']) return 'emailInvalid';
    return `${control}Required`;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading || this.oauthLoading) return;
    this.loading = true;
    this.generalError = '';
    this.clearBackendErrors();
    this.auth.login(this.form.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.loading = false; void this.router.navigateByUrl('/dashboard'); },
      error: error => { this.loading = false; this.applyError(error); },
    });
  }

  signInWith(provider: OAuthProvider): void {
    if (this.loading || this.oauthLoading) return;
    this.generalError = '';
    this.providerError = '';
    this.oauthLoading = provider;
    this.social.start(provider).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: code => this.completeOAuth(provider, code),
      error: (key: string) => { this.oauthLoading = null; this.providerError = key || 'oauthFailed'; },
    });
  }

  private completeOAuth(provider: OAuthProvider, code: string): void {
    this.auth.oauthLogin(OAUTH_PROVIDER_GRAPHQL_NAME[provider], code).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.oauthLoading = null; void this.router.navigateByUrl('/dashboard'); },
      error: error => { this.oauthLoading = null; this.applyError(error, true); },
    });
  }

  private applyError(error: unknown, provider = false): void {
    const appError = error instanceof AppError ? error : null;
    if (appError?.fieldErrors.length && !provider) {
      for (const field of appError.fieldErrors) {
        const control = this.form.get(field.field.toLowerCase());
        if (control) { control.setErrors({ backend: field.message }); control.markAsTouched(); }
      }
      if (this.form.controls.email.errors?.['backend'] || this.form.controls.password.errors?.['backend']) return;
    }
    if (provider) this.providerError = appError?.publicMessage || 'oauthFailed';
    else this.generalError = appError?.publicMessage || 'unexpectedError';
  }

  private clearBackendErrors(): void { for (const control of Object.values(this.form.controls)) control.setErrors(null); }
}
