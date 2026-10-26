import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { errorMessage } from '../../core/interceptors/error.interceptor';
import { Transaction, TransactionStatus, TransactionType } from '../../core/models/models';
import { AccountService } from '../../core/services/account.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent, IconName } from '../../shared/icon.component';

const PAGE_SIZE = 8;

const LABELS: Record<TransactionType, string> = {
  DEPOSIT: 'Deposit',
  WITHDRAW: 'Withdrawal',
  TRANSFER: 'Transfer sent',
  TRANSFER_IN: 'Transfer received',
  PAYMENT: 'Payment',
  WITHDRAWAL: 'Withdrawal'
};

const ICONS: Record<TransactionType, IconName> = {
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  TRANSFER: 'transfer',
  TRANSFER_IN: 'deposit',
  PAYMENT: 'payment',
  WITHDRAWAL: 'withdraw'
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  SUCCESS: 'Completed',
  PENDING: 'Pending',
  FAILED: 'Failed',
  COMPLETED: 'Completed',
  PROCESSING: 'Processing',
  PENDING_VERIFICATION: 'Pending verification',
  FLAGGED: 'Flagged'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, IconComponent],
  template: `
    <div class="grid gap-4 lg:grid-cols-3">
      <!-- Balance -->
      <section
        class="relative overflow-hidden rounded-3xl bg-blue-900 p-6 text-white md:p-8 lg:col-span-2"
        aria-label="Account balance"
      >
        <div class="flex items-start justify-between gap-3">
          <p class="text-sm text-blue-200">Available balance</p>
          @if (accounts.account(); as acc) {
            <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              {{ acc.accountType }}
            </span>
          }
        </div>
        <p class="mt-3 text-5xl font-semibold tabular-nums tracking-tight md:text-6xl">
          {{ accounts.account()?.balance ?? 0 | currency }}
        </p>

        <div class="mt-10 flex items-center justify-between gap-3 rounded-2xl bg-black/15 px-4 py-3">
          <div class="min-w-0">
            <p class="text-xs text-blue-200">Account ID</p>
            <p class="truncate font-semibold tabular-nums tracking-wide">
              {{ accounts.account()?.accountId ?? 'Loading' }}
            </p>
          </div>
          <button
            type="button"
            class="flex shrink-0 items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/20 disabled:opacity-50"
            [disabled]="!accounts.account()"
            (click)="copyAccountId()"
          >
            <app-icon name="copy" [size]="16" />
            Copy
          </button>
        </div>
      </section>

      <!-- Totals -->
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-1">
        <section class="fin-card !p-5">
          <span
            class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
          >
            <app-icon name="deposit" [size]="18" />
          </span>
          <p class="mt-3 text-sm text-slate-500">Money in</p>
          <p class="text-2xl font-semibold tabular-nums text-emerald-500">
            {{ totals().in | currency }}
          </p>
        </section>
        <section class="fin-card !p-5">
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500">
            <app-icon name="withdraw" [size]="18" />
          </span>
          <p class="mt-3 text-sm text-slate-500">Money out</p>
          <p class="text-2xl font-semibold tabular-nums text-red-500">
            {{ totals().out | currency }}
          </p>
        </section>
      </div>
    </div>

    <!-- Quick actions -->
    <nav class="mt-4 grid grid-cols-4 gap-3" aria-label="Quick actions">
      @for (a of actions; track a.path) {
        <a
          [routerLink]="a.path"
          class="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-4 text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:text-blue-900"
        >
          <span
            class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-900 transition group-hover:bg-blue-900 group-hover:text-white"
          >
            <app-icon [name]="a.icon" [size]="20" />
          </span>
          {{ a.label }}
        </a>
      }
    </nav>

    <!-- Activity -->
    <section class="fin-card mt-6 !p-0">
      <div class="border-b border-slate-100 px-6 py-4">
        <h2 class="text-lg font-semibold text-slate-900">Recent activity</h2>
      </div>

      @if (sorted().length === 0) {
        <div class="px-6 py-14 text-center">
          <p class="font-semibold text-slate-900">No activity yet</p>
          <p class="mt-1 text-sm text-slate-500">
            Deposit money and your transactions will show up here.
          </p>
          <a routerLink="/deposit" class="fin-btn mt-5 inline-block !w-auto px-6">
            Make a deposit
          </a>
        </div>
      } @else {
        <ul class="divide-y divide-slate-100">
          @for (t of pageItems(); track t.id) {
            <li
              class="flex items-center gap-4 px-6 py-4"
              [class.cursor-pointer]="isClickable(t)"
              [class.hover:bg-slate-50]="isClickable(t)"
              [routerLink]="isClickable(t) ? ['/transactions', t.id] : null"
              role="button"
              tabindex="0"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                [class]="isCredit(t) ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'"
              >
                <app-icon [name]="iconFor(t)" [size]="18" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-slate-900">{{ labelFor(t) }}</p>
                <p class="text-sm text-slate-500">
                  @if (t.type === 'TRANSFER_IN') {
                    from
                    <span class="font-medium tabular-nums text-slate-600">{{ counterparty(t) }}</span>
                    &middot;
                  }
                  @if (t.type === 'TRANSFER') {
                    to
                    <span class="font-medium tabular-nums text-slate-600">{{ counterparty(t) }}</span>
                    &middot;
                  }
                  {{ t.date | date: 'MMM d, h:mm a' }}
                </p>
              </div>
              <div class="text-right">
                <p
                  class="font-semibold tabular-nums"
                  [class.text-emerald-500]="isCredit(t)"
                  [class.text-red-500]="!isCredit(t)"
                >
                  {{ isCredit(t) ? '+' : '-' }}{{ t.amount | currency }}
                </p>
                <p
                  class="text-xs"
                  [class.text-slate-400]="t.status === 'SUCCESS' || t.status === 'COMPLETED'"
                  [class.text-amber-600]="t.status === 'PENDING' || t.status === 'PROCESSING' || t.status === 'PENDING_VERIFICATION'"
                  [class.text-red-500]="t.status === 'FAILED' || t.status === 'FLAGGED'"
                >
                  {{ statusLabel(t) }}
                </p>
                @if (t.status === 'PENDING_VERIFICATION' && !isCredit(t)) {
                  <button
                    type="button"
                    class="mt-1.5 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-amber-600"
                    (click)="verifyTransaction(t, $event)"
                  >
                    Enter OTP
                  </button>
                }
              </div>
            </li>
          }
        </ul>

        <div class="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm">
          <span class="text-slate-500">
            {{ rangeStart() }}&ndash;{{ rangeEnd() }} of {{ sorted().length }}
          </span>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:border-blue-900 disabled:opacity-40 disabled:hover:border-slate-200"
              [disabled]="page() === 0"
              (click)="page.set(page() - 1)"
            >
              Previous
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:border-blue-900 disabled:opacity-40 disabled:hover:border-slate-200"
              [disabled]="page() >= totalPages() - 1"
              (click)="page.set(page() + 1)"
            >
              Next
            </button>
          </div>
        </div>
      }
    </section>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly accounts = inject(AccountService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Quietly re-pulls balance + history so backend changes (e.g. OTP auto-refund) appear without a manual reload. */
  private autoRefresh: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    if (this.autoRefresh) {
      clearInterval(this.autoRefresh);
      this.autoRefresh = null;
    }
  }

  readonly page = signal(0);

  readonly actions: { label: string; path: string; icon: IconName }[] = [
    { label: 'Deposit', path: '/deposit', icon: 'deposit' },
    { label: 'Withdraw', path: '/withdraw', icon: 'withdraw' },
    { label: 'Transfer', path: '/transfer', icon: 'transfer' },
    { label: 'Pay bill', path: '/payment', icon: 'payment' }
  ];

  readonly sorted = computed<Transaction[]>(() =>
    [...this.accounts.history()].sort((a, b) => b.date.localeCompare(a.date))
  );
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.sorted().length / PAGE_SIZE)));
  readonly pageItems = computed(() =>
    this.sorted().slice(this.page() * PAGE_SIZE, (this.page() + 1) * PAGE_SIZE)
  );
  readonly rangeStart = computed(() => (this.sorted().length === 0 ? 0 : this.page() * PAGE_SIZE + 1));
  readonly rangeEnd = computed(() =>
    Math.min((this.page() + 1) * PAGE_SIZE, this.sorted().length)
  );

  readonly totals = computed(() => {
    let moneyIn = 0;
    let moneyOut = 0;
    for (const t of this.accounts.history()) {
      if (t.status === 'FAILED') {
        continue;
      }
      if (t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'PAYMENT') {
        moneyIn += t.amount;
      } else {
        moneyOut += t.amount;
      }
    }
    return { in: moneyIn, out: moneyOut };
  });

  ngOnInit(): void {
    forkJoin([this.accounts.loadAccount(), this.accounts.loadHistory()]).subscribe({
      error: (err: unknown) => this.toast.error(errorMessage(err, 'Could not load your account.'))
    });
    this.autoRefresh = setInterval(() => {
      this.accounts.loadAccount().subscribe({ error: () => undefined });
      this.accounts.loadHistory().subscribe({ error: () => undefined });
    }, 20_000);
  }

  /** All activity rows now have a backend record - payments included. */
  isClickable(t: Transaction): boolean {
    return true;
  }

  /** Jump straight to the OTP gate for a transfer awaiting verification (deep-linkable: /transfer?verify={id}). */
  verifyTransaction(t: Transaction, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/transfer'], { queryParams: { verify: t.id } });
  }

  /** The other account: receiver when you sent money, sender when you received it. */
  counterparty(t: Transaction): string {
    return this.isCredit(t) ? t.senderAccountNumber : t.receiverAccountNumber;
  }

  isCredit(t: Transaction): boolean {
    // card payments via Razorpay are money into the account
    return t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'PAYMENT';
  }

  iconFor(t: Transaction): IconName {
    return ICONS[t.type];
  }

  labelFor(t: Transaction): string {
    return LABELS[t.type];
  }

  statusLabel(t: Transaction): string {
    return STATUS_LABELS[t.status];
  }

  copyAccountId(): void {
    const id = this.accounts.account()?.accountId;
    if (!id) {
      return;
    }
    navigator.clipboard.writeText(id).then(
      () => this.toast.success('Account ID copied.'),
      () => this.toast.error('Could not copy. Select the ID and copy it manually.')
    );
  }
}
