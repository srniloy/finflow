import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/interceptors/error.interceptor';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthShellComponent } from '../../shared/auth-shell.component';
import { FieldErrorComponent } from '../../shared/field-error.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent, AuthShellComponent],
  template: `
    <app-auth-shell title="Log in" subtitle="Welcome back. Enter your details to continue.">
      <!-- Demo accounts: click to autofill -->
      <div class="mb-8">
        <p class="fin-label">Try a demo account</p>
        <div class="grid grid-cols-2 gap-3">
          @for (demo of demoAccounts; track demo.email) {
            <button
              type="button"
              class="flex flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left transition"
              [class]="
                form.controls.email.value === demo.email
                  ? 'border-blue-900 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-blue-900'
              "
              (click)="useDemo(demo)"
            >
              <span class="text-sm font-semibold text-slate-900">{{ demo.label }}</span>
              <span class="w-full truncate text-xs text-slate-500">{{ demo.email }}</span>
            </button>
          }
        </div>
        <p class="mt-2 text-xs text-slate-400">
          Password for both demo accounts: <span class="font-semibold">Ab&#64;112233</span>
        </p>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="mb-5">
          <label class="fin-label" for="email">Email</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            autocomplete="email"
            placeholder="you@example.com"
            class="fin-input"
            [class.fin-input-error]="form.controls.email.invalid && form.controls.email.touched"
          />
          <app-field-error [control]="form.controls.email" />
        </div>

        <div class="mb-7">
          <label class="fin-label" for="password">Password</label>
          <div class="relative">
            <input
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
              class="fin-input pr-16"
              [class.fin-input-error]="
                form.controls.password.invalid && form.controls.password.touched
              "
            />
            <button
              type="button"
              class="absolute inset-y-0 right-3 text-sm font-semibold text-slate-500 hover:text-blue-900"
              (click)="showPassword.set(!showPassword())"
            >
              {{ showPassword() ? 'Hide' : 'Show' }}
            </button>
          </div>
          <app-field-error [control]="form.controls.password" />
        </div>

        <button type="submit" class="fin-btn" [disabled]="submitting()">Log in</button>
      </form>

      <p class="mt-8 text-center text-sm text-slate-500">
        New to FinFlow?
        <a routerLink="/register" class="font-semibold text-blue-900 hover:underline">
          Create an account
        </a>
      </p>
    </app-auth-shell>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly submitting = signal(false);
  readonly showPassword = signal(false);

  /** Pre-registered accounts for quick testing. */
  readonly demoAccounts = [
    { label: 'Account 1', email: 'account1@finflow.com', password: 'Ab@112233' },
    { label: 'Account 2', email: 'account2@finflow.com', password: 'Ab@112233' }
  ];

  /** Fills the login form with a demo account. */
  useDemo(demo: { email: string; password: string }): void {
    this.form.setValue({ email: demo.email, password: demo.password });
    this.form.markAsUntouched();
  }

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success('You are logged in.');
        void this.router.navigate(['/dashboard']);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.toast.error(errorMessage(err, 'Login failed. Check your email and password.'));
      }
    });
  }
}
