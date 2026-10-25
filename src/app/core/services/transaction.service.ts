import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_BASE_URL } from '../config';
import {
  AmountRequest,
  PaymentCheckoutInfo,
  PaymentRequest,
  SimpleTransactionResponse,
  TransferRequest
} from '../models/models';
import { AccountService } from './account.service';
import { AuthService } from './auth.service';

/** Matches payment-service PaymentOrderResponse. */
interface PaymentOrderResponse {
  paymentId: string;
  razorpayPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  razorpayKeyId: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly accounts = inject(AccountService);
  private readonly auth = inject(AuthService);

  /** POST /api/v1/transactions/deposit { accountNumber, amount } */
  deposit(payload: AmountRequest): Observable<SimpleTransactionResponse> {
    return this.http
      .post<{ id: string; status: string }>(
        `${API_BASE_URL}/transactions/deposit`,
        { accountNumber: this.myAccountNumber(), amount: payload.amount }
      )
      .pipe(
        tap(() => this.refreshBalance()),
        map((res) => ({ transactionId: res.id, status: mapTransactionStatus(res.status) }))
      );
  }

  /** POST /api/v1/transactions/withdrawal { accountNumber, amount } */
  withdraw(payload: AmountRequest): Observable<SimpleTransactionResponse> {
    return this.http
      .post<{ id: string; status: string }>(
        `${API_BASE_URL}/transactions/withdrawal`,
        { accountNumber: this.myAccountNumber(), amount: payload.amount }
      )
      .pipe(
        tap(() => this.refreshBalance()),
        map((res) => ({ transactionId: res.id, status: mapTransactionStatus(res.status) }))
      );
  }

  /** POST /api/v1/transactions/transfer { senderAccountNumber, receiverAccountNumber, amount, description } */
  transfer(payload: TransferRequest): Observable<SimpleTransactionResponse> {
    return this.http
      .post<{ id: string; status: string }>(
        `${API_BASE_URL}/transactions/transfer`,
        {
          senderAccountNumber: this.myAccountNumber(),
          receiverAccountNumber: payload.toAccountId,
          amount: payload.amount,
          description: 'Transfer sent via FinFlow'
        }
      )
      .pipe(
        tap(() => this.refreshBalance()),
        map((res) => ({ transactionId: res.id, status: mapTransactionStatus(res.status) }))
      );
  }

  /** POST /api/v1/payments/create-order { accountNumber, amount, description } */
  payment(payload: PaymentRequest): Observable<PaymentCheckoutInfo> {
    return this.http
      .post<PaymentOrderResponse>(
        `${API_BASE_URL}/payments/create-order`,
        {
          accountNumber: this.myAccountNumber(),
          amount: payload.amount,
          description: `Biller ${payload.billerId} - invoice ${payload.invoiceNumber}`
        }
      )
      .pipe(
        map((res) => ({
          orderId: res.razorpayPaymentId,   // the Razorpay order id
          key: res.razorpayKeyId,
          amountMajor: res.amount,
          currency: res.currency
        }))
      );
  }

  /** Transaction/payment responses carry no balance, so re-fetch the account in the background. */
  private refreshBalance(): void {
    this.accounts.loadAccount().subscribe({ error: () => undefined });
  }

  private myAccountNumber(): string {
    return this.auth.currentUser()?.accountNumber ?? '';
  }
}

/** Backend statuses -> the frontend's success/pending/failed states. */
function mapTransactionStatus(status: string): SimpleTransactionResponse['status'] {
  switch (status) {
    case 'COMPLETED': return 'SUCCESS';
    case 'FAILED':
    case 'FLAGGED': return 'FAILED';
    default: return 'PENDING';
  }
}
