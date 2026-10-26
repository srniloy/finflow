import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/interceptors/error.interceptor';
import { Account, Transaction } from '../../core/models/models';
import { API_BASE_URL } from '../../core/config';
import { AccountService } from '../../core/services/account.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent, IconName } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../shared/page-header.component';

/** Matches transaction-service TransactionResponse. */
interface BackendTx {
  id: string;
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT';
  status: string;
  description: string | null;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
}

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, IconComponent, PageHeaderComponent],
  template: `
    <div class="mx-auto w-full max-w-5xl">
      @if (error; as err) {
        <section class="fin-card text-center">
          <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <app-icon name="alert" [size]="24" />
          </span>
          <h1 class="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Transaction not found</h1>
          <p class="mt-1 text-sm text-slate-500">{{ err }}</p>
          <a routerLink="/dashboard" class="fin-btn mt-6 inline-block !w-auto px-6">Back to dashboard</a>
        </section>
      } @else {
        @if (txn(); as t) {
          <a
            routerLink="/dashboard"
            class="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-blue-900"
          >
            &larr; Back to activity
          </a>
          <app-page-header [icon]="icon()" title="{{ title() }}" subtitle="Entered on {{ t.date | date: 'MMM d, h:mm a' }}" />

        <!-- Amount -->
        <section
          class="relative overflow-hidden rounded-3xl p-6 text-white md:p-8"
          [class]="isCredit() ? 'bg-emerald-600' : 'bg-blue-900'"
          aria-label="Transfer amount"
        >
          <p class="text-sm opacity-80">{{ isCredit() ? 'Money in' : 'Money out' }}</p>
          <p class="mt-3 text-4xl font-semibold tabular-nums tracking-tight md:text-5xl">
            {{ (isCredit() ? '+' : '-') + (t.amount | currency) }}
          </p>
          <span
            class="mt-6 inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1.5 text-xs font-semibold"
          >
            <app-icon [name]="statusIcon()" [size]="14" />
            {{ statusLabel() }}
          </span>
        </section>

        <!-- OTP verification CTA (sender only - the OTP is emailed to the sender) -->
        @if (txn()?.status === 'PENDING_VERIFICATION' && txn()!.senderAccountNumber === mine()) {
          <section
            class="fin-card mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            aria-label="OTP verification pending"
          >
            <div>
              <p class="font-semibold text-slate-900">OTP verification required</p>
              <p class="mt-1 text-sm leading-relaxed text-slate-500">
                Enter the 6-digit code sent to your registered email to complete this transfer.
                If the code is not verified in time, the transfer is cancelled and refunded
                automatically.
              </p>
            </div>
            <a
              routerLink="/transfer"
              [queryParams]="{ verify: txn()!.id }"
              class="fin-btn !w-auto shrink-0 px-6"
            >
              Enter OTP
            </a>
          </section>
        }

        <!-- Accounts -->
        <section class="fin-card mt-4" aria-label="Accounts involved">
          <dl class="divide-y divide-slate-100">
            <div class="pb-4">
              <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">From</dt>
              <dd class="mt-1">
                <p class="font-semibold tabular-nums tracking-wide text-slate-900">{{ t.senderAccountNumber }}</p>
                <p class="text-sm text-slate-500">{{ senderName() }}</p>
              </dd>
            </div>
            <div class="pt-4">
              <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">To</dt>
              <dd class="mt-1">
                <p class="font-semibold tabular-nums tracking-wide text-slate-900">{{ t.receiverAccountNumber }}</p>
                <p class="text-sm text-slate-500">{{ receiverName() }}</p>
              </dd>
            </div>
          </dl>
        </section>

        <!-- Details -->
        <section class="fin-card mt-4" aria-label="Transfer details">
          <dl class="divide-y divide-slate-100">
            <div class="flex items-center justify-between gap-4 pb-4">
              <dt class="text-sm font-semibold text-slate-500">Transaction ID</dt>
              <dd>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg px-2 py-1 font-semibold text-slate-600 transition hover:bg-slate-100"
                  (click)="copyId()"
                >
                  <span class="truncate text-xs tabular-nums" [title]="t.id">{{ t.id }}</span>
                  <app-icon name="copy" [size]="14" />
                </button>
              </dd>
            </div>
            <div class="flex items-start justify-between gap-4 py-4">
              <dt class="text-sm font-semibold text-slate-500">Description</dt>
              <dd class="min-w-0 text-right text-sm text-slate-700">{{ t.description || '-' }}</dd>
            </div>
            @if (failureReason(); as reason) {
              <div class="flex items-start justify-between gap-4 py-4">
                <dt class="text-sm font-semibold text-slate-500">Reason</dt>
                <dd class="min-w-0 text-right text-sm font-medium text-red-500">{{ reason }}</dd>
              </div>
            }
            <div class="flex items-baseline justify-between gap-4 py-4">
              <dt class="text-sm font-semibold text-slate-500">Initiated</dt>
              <dd class="text-sm tabular-nums text-slate-700">{{ t.date | date: 'MMM d, h:mm a' }}</dd>
            </div>
            @if (t.completedAt; as completed) {
              <div class="flex items-baseline justify-between gap-4 pt-4">
                <dt class="text-sm font-semibold text-slate-500">Completed</dt>
                <dd class="text-sm tabular-nums text-slate-700">{{ completed | date: 'MMM d, h:mm a' }}</dd>
              </div>
            }
          </dl>
        </section>
      } @else {
        <section class="fin-card">
          <div class="py-14 text-center text-sm font-medium text-slate-500">Loading transaction…</div>
        </section>
      }
      }
    </div>
  `
})
export class TransactionDetailComponent implements OnInit {
  readonly transactionId = input.required<string>();
  readonly txn = signal<Transaction | null>(null);
  readonly senderDetails = signal<Account | null>(null);
  readonly receiverDetails = signal<Account | null>(null);

  error = '';

  readonly accounts = inject(AccountService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  readonly mine = computed(() => this.auth.currentUser()?.accountNumber ?? '');

  ngOnInit(): void {
    this.http.get<BackendTx>(`${API_BASE_URL}/transactions/${this.transactionId()}`).subscribe({
      next: (raw) => {
        const mine = this.mine();
        this.txn.set({
          id: raw.id,
          type: raw.type === 'TRANSFER' ? (raw.receiverAccountNumber === mine ? 'TRANSFER_IN' : 'TRANSFER') : raw.type,
          amount: raw.amount,
          date: raw.createdAt,
          status: raw.status as Transaction['status'],
          senderAccountNumber: raw.senderAccountNumber,
          receiverAccountNumber: raw.receiverAccountNumber,
          description: raw.description ?? undefined,
          failureReason: raw.failureReason ?? undefined,
          completedAt: raw.completedAt ?? undefined
        });

        // Resolve the other party's holder name from account-service.
        for (const number of [raw.senderAccountNumber, raw.receiverAccountNumber]) {
          if (number && number !== mine) {
            this.accounts.getAccountDetails(number).subscribe({
              next: (acc) =>
                number === raw.senderAccountNumber
                  ? this.senderDetails.set(acc)
                  : this.receiverDetails.set(acc),
              error: () => undefined
            });
          }
        }
      },
      error: (err: unknown) => {
        this.error = errorMessage(err, 'That transaction does not exist or has been removed.');
      }
    });
  }

  readonly isCredit = computed(() => {
    const t = this.txn();
    // card payments via Razorpay are money into the account
    return !!t && (t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'PAYMENT');
  });

  readonly failureReason = computed(() => {
    const t = this.txn();
    if (!t || (t.status !== 'FAILED' && t.status !== 'FLAGGED')) {
      return null;
    }
    return t.failureReason || t.description || null;
  });

  readonly senderName = computed(() => this.senderDetails()?.accountHolderName ?? 'FinFlow account');
  readonly receiverName = computed(() => this.receiverDetails()?.accountHolderName ?? 'FinFlow account');

  readonly icon = computed<IconName>(() => {
    const t = this.txn();
    switch (t?.type) {
      case 'WITHDRAW':
      case 'WITHDRAWAL': return 'withdraw';
      case 'PAYMENT': return 'payment';
      case 'DEPOSIT':
      case 'TRANSFER_IN': return 'deposit';
      default: return 'transfer';
    }
  });

  readonly title = computed(() => {
    const t = this.txn();
    switch (t?.type) {
      case 'TRANSFER':
      case 'TRANSFER_IN': return 'Money transfer';
      case 'WITHDRAW':
      case 'WITHDRAWAL': return 'Withdrawal';
      case 'PAYMENT': return 'Payment';
      default: return 'Deposit';
    }
  });

  readonly statusLabel = computed(() => {
    const t = this.txn();
    switch (t?.status) {
      case 'SUCCESS':
      case 'COMPLETED': return 'Completed';
      case 'PROCESSING': return 'Processing';
      case 'PENDING_VERIFICATION': return 'Pending verification';
      case 'FAILED': return 'Failed';
      case 'FLAGGED': return 'Flagged';
      default: return 'Pending';
    }
  });

  readonly statusIcon = computed<IconName>(() => {
    const t = this.txn();
    switch (t?.status) {
      case 'SUCCESS':
      case 'COMPLETED': return 'check';
      case 'FAILED':
      case 'FLAGGED': return 'alert';
      default: return 'info';
    }
  });

  copyId(): void {
    const t = this.txn();
    if (!t) {
      return;
    }
    navigator.clipboard.writeText(t.id).then(
      () => this.toast.success('Transaction ID copied.'),
      () => this.toast.error('Could not copy. Select the ID and copy it manually.')
    );
  }
}
