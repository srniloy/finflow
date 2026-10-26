import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_BASE_URL } from '../config';
import {
  AmountRequest,
  PaymentCheckoutInfo,
  PaymentRequest,
  SimpleTransactionResponse,
  Transaction,
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

  /** GET /api/v1/transactions/{transactionId} - status polling. */
  getTransaction(transactionId: string): Observable<SimpleTransactionResponse> {
    return this.http
      .get<{ id: string; status: string }>(
        `${API_BASE_URL}/transactions/${transactionId}`
      )
      .pipe(map((res) => ({ transactionId: res.id, status: mapTransactionStatus(res.status) })));
  }

  /** GET /api/v1/transactions/{transactionId} - full record (OTP re-entry, detail views). */
  getTransactionDetail(transactionId: string): Observable<Transaction> {
    return this.http
      .get<{
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
        referenceNumber: string | null;
      }>(`${API_BASE_URL}/transactions/${transactionId}`)
      .pipe(map((res) => ({
        id: res.id,
        type: res.type,
        amount: Number(res.amount),
        date: res.createdAt,
        status: mapTransactionStatus(res.status),
        senderAccountNumber: res.senderAccountNumber,
        receiverAccountNumber: res.receiverAccountNumber,
        description: res.description ?? undefined,
        failureReason: res.failureReason ?? undefined,
        completedAt: res.completedAt ?? undefined,
        referenceNumber: res.referenceNumber ?? undefined
      })));
  }

  /** POST /api/v1/transactions/{transactionId}/verify?otp=123456 */
  verifyOtp(transactionId: string, otp: string): Observable<SimpleTransactionResponse> {
    return this.http
      .post<{ id: string; status: string; failureReason?: string }>(
        `${API_BASE_URL}/transactions/${transactionId}/verify`,
        null,
        { params: { otp } }
      )
      .pipe(
        tap(() => this.refreshBalance()),
        map((res) => ({
          transactionId: res.id,
          status: mapTransactionStatus(res.status),
          failureReason: res.failureReason
        }))
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
    case 'PENDING_VERIFICATION': return 'PENDING_VERIFICATION';
    default: return 'PENDING'; // PROCESSING / PENDING
  }
}
