import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { errorMessage } from '../../core/interceptors/error.interceptor';
import { AccountService } from '../../core/services/account.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionService } from '../../core/services/transaction.service';
import { AmountFieldComponent } from '../../shared/amount-field.component';
import { BalanceNoteComponent } from '../../shared/balance-note.component';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { maxTwoDecimals, withinBalance } from '../../shared/validators';

/** Razorpay Checkout types (loaded from https://checkout.razorpay.com/v1/checkout.js). */
interface RazorpayCheckoutResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature?: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;        // minor units (cents for USD)
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler?: (result: RazorpayCheckoutResult) => void;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, cb: (payload: { error?: { description?: string } }) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    FieldErrorComponent,
    PageHeaderComponent,
    AmountFieldComponent,
    BalanceNoteComponent
  ],
  template: `
    <div class="mx-auto w-full max-w-5xl">
      <app-page-header
        icon="payment"
        title="Pay an invoice"
        subtitle="Pay a biller or merchant online."
      />
      <div class="fin-card">
        <div class="mb-6 flex items-baseline justify-between">
          <span class="text-sm text-slate-500">Available balance</span>
          <span class="text-lg font-semibold tabular-nums text-emerald-500">
            {{ accounts.account()?.balance ?? 0 | currency }}
          </span>
        </div>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="mb-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label class="fin-label" for="billerId">Biller or merchant ID</label>
              <input
                id="billerId"
                type="text"
                formControlName="billerId"
                autocomplete="off"
                class="fin-input"
                [class.fin-input-error]="
                  form.controls.billerId.invalid && form.controls.billerId.touched
                "
              />
              <app-field-error [control]="form.controls.billerId" />
            </div>
            <div>
              <label class="fin-label" for="invoiceNumber">Invoice number</label>
              <input
                id="invoiceNumber"
                type="text"
                formControlName="invoiceNumber"
                autocomplete="off"
                class="fin-input"
                [class.fin-input-error]="
                  form.controls.invoiceNumber.invalid && form.controls.invoiceNumber.touched
                "
              />
              <app-field-error [control]="form.controls.invoiceNumber" />
            </div>
          </div>
          <app-amount-field [control]="form.controls.amount" />
          <app-balance-note
            [balance]="accounts.account()?.balance ?? null"
            [amount]="form.controls.amount.value"
            direction="out"
            noun="payment"
          />
          <button type="submit" class="fin-btn mt-6" [disabled]="submitting()">
            {{ paying() ? 'Waiting for payment…' : 'Pay invoice' }}
          </button>
          @if (paying()) {
            <p class="mt-3 text-center text-sm font-medium text-slate-500">
              The Razorpay portal is open. Use a test card to finish paying (or close it to cancel).
            </p>
          }
        </form>
      </div>
    </div>
  `
})
export class PaymentComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tx = inject(TransactionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly accounts = inject(AccountService);

  readonly submitting = signal(false);
  readonly paying = signal(false);

  readonly form = this.fb.group({
    // Pre-filled with dummy data so the Razorpay checkout can be tested in one click.
    billerId: this.fb.nonNullable.control('MERCHANT-BD-1001', [Validators.required]),
    invoiceNumber: this.fb.nonNullable.control('INV-2026-0042', [Validators.required]),
    amount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      maxTwoDecimals(),
      withinBalance(() => this.accounts.account()?.balance ?? null)
    ])
  });

  ngOnInit(): void {
    if (!this.accounts.account()) {
      this.accounts.loadAccount().subscribe({
        next: () => this.form.controls.amount.updateValueAndValidity(),
        error: () => undefined
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.paying()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);

    // 1. Create the Razorpay order on the backend (saved in payment_db with status CREATED).
    this.tx
      .payment({
        billerId: this.form.controls.billerId.value.trim(),
        invoiceNumber: this.form.controls.invoiceNumber.value.trim(),
        amount: Number(this.form.controls.amount.value)
      })
      .subscribe({
        next: (info) => {
          this.submitting.set(false);
          // 2. Open the Razorpay Checkout portal on the user's dummy card.
          void this.openCheckout(info);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.toast.error(errorMessage(err, 'Could not start the payment.'));
        }
      });
  }

  /** Loads checkout.js once, then opens the Razorpay portal. */
  private async openCheckout(info: { orderId: string; key: string; amountMajor: number; currency: string }): Promise<void> {
    try {
      await this.loadCheckoutScript();
    }
    catch {
      this.toast.error('Could not load the payment portal. Check your connection.');
      return;
    }
    if (!window.Razorpay) {
      this.toast.error('The payment portal is unavailable right now.');
      return;
    }

    this.paying.set(true);
    const checkout = new window.Razorpay({
      key: info.key,
      amount: Math.round(info.amountMajor * 100),   // Razorpay expects minor units
      currency: info.currency,
      name: 'FinFlow',
      description: `Invoice payment for biller ${this.form.controls.billerId.value.trim()}`,
      order_id: info.orderId,
      prefill: {
        name: this.auth.currentUser()?.name,
        email: this.auth.currentUser()?.email
      },
      theme: { color: '#1e3a8a' },
      modal: { ondismiss: () => this.cancelCheckout() },
      handler: (result) => this.completeCheckout(result)
    });
    checkout.on('payment.failed', (payload) => {
      this.paying.set(false);
      this.toast.error(payload.error?.description ?? 'The payment failed. No money was moved.');
    });
    checkout.open();
  }

  private completeCheckout(result: RazorpayCheckoutResult): void {
    this.paying.set(false);
    this.toast.success(`Payment captured. Razorpay reference ${result.razorpay_payment_id}.`);
    // The webhook -> Kafka -> account-service flow runs in the background;
    // refresh the balance shortly after to reflect the settled payment.
    setTimeout(() => this.accounts.loadAccount().subscribe({ error: () => undefined }), 3000);
    void this.router.navigate(['/dashboard']);
  }

  private cancelCheckout(): void {
    this.paying.set(false);
    this.toast.info('Payment cancelled. Nothing was charged.');
  }

  /** Injects the Razorpay checkout script once and resolves when it is ready. */
  private loadCheckoutScript(): Promise<void> {
    const w = window as unknown as { __finflowRazorpayLoading?: Promise<void> };
    if (w.__finflowRazorpayLoading) {
      return w.__finflowRazorpayLoading;
    }
    w.__finflowRazorpayLoading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CHECKOUT_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('checkout.js failed to load'));
      document.body.appendChild(script);
    });
    return w.__finflowRazorpayLoading;
  }
}
