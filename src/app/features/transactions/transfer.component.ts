import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { errorMessage } from '../../core/interceptors/error.interceptor';
import { AccountService } from '../../core/services/account.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionService } from '../../core/services/transaction.service';
import { AmountFieldComponent } from '../../shared/amount-field.component';
import { BalanceNoteComponent } from '../../shared/balance-note.component';
import { FieldErrorComponent } from '../../shared/field-error.component';
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
    BalanceNoteComponent
  ],
  template: `
    <div class="mx-auto w-full max-w-5xl">
      <app-page-header
        icon="transfer"
        title="Transfer money"
        subtitle="Send money to another FinFlow account."
      />
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
          <button type="submit" class="fin-btn mt-6" [disabled]="submitting()">Send money</button>
        </form>
      </div>
    </div>
  `
})
export class TransferComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tx = inject(TransactionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly accounts = inject(AccountService);

  readonly submitting = signal(false);

  readonly form = this.fb.group({
    toAccountId: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
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
        next: (res) => {
          this.submitting.set(false);
          this.toast.success(
            res.status === 'SUCCESS'
              ? `Transfer complete. Reference ${res.transactionId}.`
              : `Transfer ${res.status.toLowerCase()}. Reference ${res.transactionId}.`
          );
          void this.router.navigate(['/dashboard']);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.toast.error(errorMessage(err, 'Could not complete the transfer.'));
        }
      });
  }
}
