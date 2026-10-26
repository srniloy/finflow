import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { errorMessage } from '../../core/interceptors/error.interceptor';
import { AccountService } from '../../core/services/account.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionService } from '../../core/services/transaction.service';
import { SimpleTransactionResponse } from '../../core/models/models';
import { AmountFieldComponent } from '../../shared/amount-field.component';
import { BalanceNoteComponent } from '../../shared/balance-note.component';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { IconComponent } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { maxTwoDecimals, withinBalance } from '../../shared/validators';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    FieldErrorComponent,
    PageHeaderComponent,
    AmountFieldComponent,
    BalanceNoteComponent,
    IconComponent
  ],
  template: `
    <div class="mx-auto w-full max-w-5xl">
      <app-page-header
        icon="transfer"
        title="Transfer money"
        subtitle="Send money to another FinFlow account."
      />

      @if (!pendingVerification()) {
        <div class="fin-card">
          <div class="mb-6 flex items-baseline justify-between">
            <span class="text-sm text-slate-500">Available balance</span>
            <span class="text-lg font-semibold tabular-nums text-emerald-500">
              {{ accounts.account()?.balance ?? 0 | currency }}
            </span>
          </div>
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="mb-6">
              <label class="fin-label" for="toAccountId">Recipient account ID or email</label>
              <input
                id="toAccountId"
                type="text"
                formControlName="toAccountId"
                autocomplete="off"
                class="fin-input"
                [class.fin-input-error]="
                  form.controls.toAccountId.invalid && form.controls.toAccountId.touched
                "
              />
              <app-field-error [control]="form.controls.toAccountId" />
            </div>
            <app-amount-field [control]="form.controls.amount" />
            <app-balance-note
              [balance]="accounts.account()?.balance ?? null"
              [amount]="form.controls.amount.value"
              direction="out"
              noun="transfer"
            />
            <button type="submit" class="fin-btn mt-6" [disabled]="submitting()">
              {{ submitting() ? 'Processing…' : 'Send money' }}
            </button>
          </form>
        </div>
      } @else {
        <div class="fin-card">
          <div class="mb-6 flex items-start gap-4">
            <span
              class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"
            >
              <app-icon name="info" [size]="22" />
            </span>
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Verification required</h2>
              <p class="mt-1 text-sm leading-relaxed text-slate-600">
                This transfer of
                <span class="font-semibold tabular-nums">
                  {{ (pendingVerification()!.amount ?? 0) | currency }}
                </span>
                was flagged as unusual activity for your account. For your security, it is
                <span class="font-semibold text-amber-600">pending verification</span> and the amount
                is on hold.
              </p>
              <p class="mt-2 text-sm leading-relaxed text-slate-600">
                We sent a 6-digit code to your registered email
                <span class="font-medium">{{ maskedEmail() }}</span>. Enter it below to approve this
                transfer. The code is valid for 5 minutes.
              </p>
            </div>
          </div>

          <div class="mb-6">
            <label class="fin-label" for="otp">Verification code</label>
            <input
              id="otp"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              placeholder="••••••"
              class="fin-input text-center text-2xl tracking-[0.5em]"
              [class.fin-input-error]="otpError()"
              [value]="otp()"
              (input)="onOtpInput($event)"
            />
            @if (otpError()) {
              <p class="mt-2 text-sm text-red-500">{{ otpError() }}</p>
            }
          </div>

          <p class="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700">
            Careful: entering a wrong code will cancel the transfer and block your account for
            security. If you close this page without verifying, the transfer is cancelled and the
            amount refunded automatically.
          </p>

          <div class="flex items-center gap-3">
            <button type="button" class="fin-btn" [disabled]="verifying()" (click)="verify()">
              {{ verifying() ? 'Verifying…' : 'Verify & send' }}
            </button>
            <button
              type="button"
              class="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              [disabled]="verifying()"
              (click)="cancelVerification()"
            >
              Cancel
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class TransferComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly tx = inject(TransactionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly accounts = inject(AccountService);
  private readonly auth = inject(AuthService);

  readonly submitting = signal(false);
  /** Non-null while an OTP-flagged transfer is awaiting verification. */
  readonly pendingVerification = signal<(SimpleTransactionResponse & { amount?: number }) | null>(null);
  readonly verifying = signal(false);
  readonly otp = signal('');
  readonly otpError = signal('');

  /** Watches an open OTP gate so an auto-refund (sweeper) flips the UI without a reload. */
  private expiryWatch: ReturnType<typeof setInterval> | null = null;

  private startExpiryWatch(): void {
    this.stopExpiryWatch();
    this.expiryWatch = setInterval(() => {
      const pending = this.pendingVerification();
      if (!pending) {
        this.stopExpiryWatch();
        return;
      }
      this.tx.getTransaction(pending.transactionId).subscribe({
        next: (t) => {
          if (t.status === 'FAILED') {
            this.stopExpiryWatch();
            this.pendingVerification.set(null);
            this.toast.error(
              `Transfer cancelled and the amount refunded. Reference ${pending.transactionId}.`
            );
            void this.router.navigate(['/dashboard']);
          } else if (t.status === 'SUCCESS') {
            this.stopExpiryWatch();
            this.pendingVerification.set(null);
            this.finish(`Transfer complete. Reference ${pending.transactionId}.`);
          }
        },
        error: () => undefined
      });
    }, 10_000);
  }

  private stopExpiryWatch(): void {
    if (this.expiryWatch) {
      clearInterval(this.expiryWatch);
      this.expiryWatch = null;
    }
  }

  ngOnDestroy(): void {
    this.stopExpiryWatch();
  }

  readonly form = this.fb.group({
    toAccountId: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    amount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      maxTwoDecimals(),
      withinBalance(() => this.accounts.account()?.balance ?? null)
    ])
  });

  maskedEmail(): string {
    const email = this.auth.currentUser()?.email ?? '';
    const [local, domain] = email.split('@');
    if (!domain) return 'your registered email';
    const visible = local.slice(0, 2);
    return `${visible}${'•'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
  }

  ngOnInit(): void {
    // Re-entry path: /transfer?verify={transactionId} (dashboard / detail page /
    // page reload) - restores the OTP gate for a transaction awaiting verification.
    const verifyId = this.route.snapshot.queryParamMap.get('verify');
    if (verifyId) {
      this.loadPendingVerification(verifyId);
    }
    if (!this.accounts.account()) {
      this.accounts.loadAccount().subscribe({
        next: () => this.form.controls.amount.updateValueAndValidity(),
        error: () => undefined
      });
    }
  }

  /** Shows the OTP gate for an existing transaction that is still awaiting verification. */
  loadPendingVerification(transactionId: string): void {
    this.tx.getTransactionDetail(transactionId).subscribe({
      next: (t) => {
        const mine = this.auth.currentUser()?.accountNumber ?? '';
        if (t.senderAccountNumber !== mine) {
          // only the sender holds the OTP - receivers get no verification gate
          this.toast.info('Only the sender of this transfer can verify it.');
          void this.router.navigate(['/dashboard']);
        } else if (t.status === 'PENDING_VERIFICATION') {
          this.pendingVerification.set({
            transactionId: t.id,
            status: t.status,
            amount: t.amount,
            failureReason: t.failureReason
          });
          this.otp.set('');
          this.otpError.set('');
          this.startExpiryWatch();
        } else {
          this.toast.info('That transaction no longer needs verification.');
          void this.router.navigate(['/dashboard']);
        }
      },
      error: (err: unknown) => {
        this.toast.error(errorMessage(err, 'Could not load that transaction.'));
        void this.router.navigate(['/dashboard']);
      }
    });
  }

  onOtpInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
    this.otp.set(value);
    (event.target as HTMLInputElement).value = value;
    if (value.length === 6) this.otpError.set('');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.tx
      .transfer({
        toAccountId: this.form.controls.toAccountId.value.trim(),
        amount: Number(this.form.controls.amount.value)
      })
      .subscribe({
        next: (res) => this.watchTransaction(res),
        error: (err: unknown) => {
          this.submitting.set(false);
          this.toast.error(errorMessage(err, 'Could not complete the transfer.'));
        }
      });
  }

  /**
   * The transfer API replies with PROCESSING; fraud check + OTP generation
   * happen asynchronously, so poll until the transaction settles.
   */
  private watchTransaction(res: SimpleTransactionResponse): void {
    let attempts = 0;
    const tick = (): void => {
      this.tx.getTransaction(res.transactionId).subscribe({
        next: (t) => {
          if (t.status === 'PENDING_VERIFICATION') {
            this.submitting.set(false);
            this.pendingVerification.set({ ...t, amount: Number(this.form.controls.amount.value) });
            this.otp.set('');
            this.otpError.set('');
            this.startExpiryWatch();
            this.toast.info('Verification needed: a 6-digit code was sent to your email.');
          } else if (t.status === 'SUCCESS') {
            this.finish(`Transfer complete. Reference ${t.transactionId}.`);
          } else if (t.status === 'FAILED') {
            this.submitting.set(false);
            this.toast.error(
              `Transfer cancelled and amount refunded. Reference ${t.transactionId}.`
            );
            void this.router.navigate(['/dashboard']);
          } else if (++attempts < 15) {
            setTimeout(tick, 1000);
          } else {            this.submitting.set(false);
            this.toast.info(
              `Transfer is still processing. Reference ${t.transactionId}. Check transactions for updates.`
            );
            void this.router.navigate(['/dashboard']);
          }
        },
        error: () => {
          this.submitting.set(false);
          this.toast.error('Could not check the transfer status. Reference ' + res.transactionId + '.');
        }
      });
    };
    setTimeout(tick, 800);
  }

  verify(): void {
    const pending = this.pendingVerification();
    if (!pending) return;
    if (this.otp().length !== 6) {
      this.otpError.set('Enter the 6-digit code from your email.');
      return;
    }
    this.verifying.set(true);
    this.otpError.set('');
    this.tx.verifyOtp(pending.transactionId, this.otp()).subscribe({
      next: (res) => {
        this.verifying.set(false);
        this.pendingVerification.set(null);
        this.stopExpiryWatch();
        if (res.status === 'SUCCESS') {
          this.finish('Transfer complete. Reference ' + res.transactionId + '.');
        } else {
          this.submitting.set(false);
          this.toast.error(
            res.failureReason
              ? res.failureReason.replace(/ - SAGA Compensation executed.*$/, '')
              : 'Verification failed - the transfer was cancelled and the amount refunded.'
          );
          void this.router.navigate(['/dashboard']);
        }
      },
      error: (err: unknown) => {
        this.verifying.set(false);
        this.otpError.set(errorMessage(err, 'Verification failed. Check the code and try again.'));
      }
    });
  }

  cancelVerification(): void {
    this.stopExpiryWatch();
    this.pendingVerification.set(null);
    this.submitting.set(false);
    this.toast.info(
      'Transfer left unverified - it will be cancelled and refunded automatically if the code is not verified in time.'
    );
    void this.router.navigate(['/dashboard']);
  }

  private finish(message: string): void {
    this.stopExpiryWatch();
    this.submitting.set(false);
    this.pendingVerification.set(null);
    this.toast.success(message);
    void this.router.navigate(['/dashboard']);
  }
}
