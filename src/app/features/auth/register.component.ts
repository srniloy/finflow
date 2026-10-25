import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/interceptors/error.interceptor';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthShellComponent } from '../../shared/auth-shell.component';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { phoneNumber, strongPassword } from '../../shared/validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent, AuthShellComponent],
  template: `
    <app-auth-shell title="Create your account" subtitle="It takes about a minute.">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="mb-5">
          <label class="fin-label" for="name">Full name</label>
          <input
            id="name"
            type="text"
            formControlName="name"
            autocomplete="name"
            class="fin-input"
            [class.fin-input-error]="form.controls.name.invalid && form.controls.name.touched"
          />
          <app-field-error [control]="form.controls.name" />
        </div>

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

        <div class="mb-5">
          <label class="fin-label" for="phone">Phone number</label>
          <input
            id="phone"
            type="tel"
            formControlName="phone"
            autocomplete="tel"
            placeholder="+8801700000000"
            class="fin-input"
            [class.fin-input-error]="form.controls.phone.invalid && form.controls.phone.touched"
          />
          <app-field-error [control]="form.controls.phone" />
        </div>

        <div class="mb-7">
          <label class="fin-label" for="password">Password</label>
          <div class="relative">
            <input
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="new-password"
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
          <ul class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            @for (rule of rules(); track rule.label) {
              <li [class]="rule.met ? 'text-emerald-600' : 'text-slate-400'">
                {{ rule.met ? '✓' : '○' }} {{ rule.label }}
              </li>
            }
          </ul>
        </div>

        <button type="submit" class="fin-btn" [disabled]="submitting()">Create account</button>
      </form>

      <p class="mt-8 text-center text-sm text-slate-500">
        Already have an account?
        <a routerLink="/login" class="font-semibold text-blue-900 hover:underline">Log in</a>
      </p>
    </app-auth-shell>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly submitting = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, phoneNumber()]],
    password: ['', [Validators.required, strongPassword()]]
  });

  rules(): { label: string; met: boolean }[] {
    const v = this.form.controls.password.value;
    return [
      { label: '8+ characters', met: v.length >= 8 },
      { label: 'Lower case letter', met: /[a-z]/.test(v) },
      { label: 'Upper case letter', met: /[A-Z]/.test(v) },
      { label: 'A number', met: /\d/.test(v) },
      { label: 'A symbol', met: /[^A-Za-z0-9]/.test(v) }
    ];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.toast.success(`Account created. Your account ID is ${res.accountId}. Log in to continue.`);
        void this.router.navigate(['/login']);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.toast.error(errorMessage(err, 'Could not create your account. Please try again.'));
      }
    });
  }
}
