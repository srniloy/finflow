import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_BASE_URL } from '../config';
import { Account, Transaction } from '../models/models';
import { AuthService } from './auth.service';

/** Matches transaction-service / account-service field names. */
interface BackendTransaction {
  id: string;
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT';
  status: string;
  description: string | null;
  failureReason: string | null;
  referenceNumber: string | null;
  createdAt: string;
  completedAt: string | null;
}

/** Matches account-service AccountResponse. */
interface BackendAccount {
  id: string;
  accountNumber: string;
  accountHolderName: string;
  email: string;
  phone: string;
  accountType: string;
  status: string;
  balance: number;
  dailyTransactionLimit: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly account = signal<Account | null>(null);
  readonly history = signal<Transaction[]>([]);

  /** Calls GET /api/v1/accounts/{accountNumber} and maps to the frontend shape. */
  loadAccount(): Observable<Account> {
    return this.http.get<BackendAccount>(`${API_BASE_URL}/accounts/${this.myAccountNumber()}`).pipe(
      map((acc) => {
        const mapped = this.mapAccount(acc);
        this.account.set(mapped);
        return mapped;
      })
    );
  }

  /** Resolves another account's holder name (used to show "who sent the money"). */
  getAccountDetails(accountNumber: string): Observable<Account> {
    return this.http
      .get<BackendAccount>(`${API_BASE_URL}/accounts/${accountNumber}`)
      .pipe(map((acc) => this.mapAccount(acc)));
  }

  private mapAccount(acc: BackendAccount): Account {
    return {
      accountId: acc.accountNumber,
      accountNumber: acc.accountNumber,
      accountHolderName: acc.accountHolderName,
      email: acc.email,
      status: acc.status,
      balance: acc.balance,
      accountType: acc.accountType
    };
  }

  /** Calls GET /api/v1/transactions/account/{accountNumber} and maps to the frontend shape. */
  loadHistory(): Observable<Transaction[]> {
    return this.http
      .get<BackendTransaction[]>(`${API_BASE_URL}/transactions/account/${this.myAccountNumber()}`)
      .pipe(map((list) => {
        const mapped = list.map((t) => ({
          id: t.id,
          // Incoming money is shown as a deposit; otherwise keep the backend type.
          type: this.mapType(t),
          amount: t.amount,
          date: t.createdAt,
          status: this.mapStatus(t.status),
          senderAccountNumber: t.senderAccountNumber,
          receiverAccountNumber: t.receiverAccountNumber,
          description: t.description ?? undefined,
          failureReason: t.failureReason ?? undefined
        }));
        this.history.set(mapped);
        return mapped;
      }));
  }

  setBalance(balance: number): void {
    const acc = this.account();
    if (acc) {
      this.account.set({ ...acc, balance });
    }
  }

  private myAccountNumber(): string {
    return this.auth.currentUser()?.accountNumber ?? '';
  }

  private mapType(t: BackendTransaction): Transaction['type'] {
    const mine = this.myAccountNumber();
    if (t.type === 'TRANSFER' && t.receiverAccountNumber === mine && t.senderAccountNumber !== mine) {
      return 'TRANSFER_IN';
    }
    if (t.type === 'WITHDRAWAL') {
      return 'WITHDRAW';
    }
    return t.type === 'PAYMENT' ? 'PAYMENT' : t.type;
  }

  private mapStatus(status: string): Transaction['status'] {
    switch (status) {
      case 'COMPLETED': return 'SUCCESS';
      case 'FAILED':
      case 'FLAGGED': return 'FAILED';
      default: return 'PENDING';  // PROCESSING / PENDING / PENDING_VERIFICATION
    }
  }
}
