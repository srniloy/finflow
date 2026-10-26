export interface User {
  userId: string;
  email: string;
  name?: string;
  accountNumber?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
}

/** Matches auth-service AuthResponse (register and login). */
export interface RegisterResponse {
  message: string;
  accountId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** Matches auth-service AuthResponse (login). */
export interface LoginResponse {
  token: string;
  userId: string;
  name: string;
  email: string;
  accountId: string;
}

/** Matches account-service AccountResponse. */
export interface Account {
  accountId: string;
  accountNumber?: string;
  accountHolderName?: string;
  email?: string;
  status?: string;
  balance: number;
  accountType: string;
}

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'TRANSFER'
  | 'TRANSFER_IN'
  | 'PAYMENT'
  | 'WITHDRAWAL';

/** Matches transaction-service TransactionStatus. */
export type TransactionStatus =
  | 'SUCCESS'
  | 'PENDING'
  | 'FAILED'
  | 'COMPLETED'
  | 'PROCESSING'
  | 'PENDING_VERIFICATION'
  | 'FLAGGED';

/** Matches transaction-service TransactionResponse. */
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  status: TransactionStatus;
  senderAccountNumber: string;
  receiverAccountNumber: string;
  description?: string;
  failureReason?: string;
  completedAt?: string;
  referenceNumber?: string;
}

export type BackendTransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT';

export interface AmountRequest {
  amount: number;
}

export interface BalanceTransactionResponse {
  transactionId: string;
  newBalance?: number;
  status: TransactionStatus;
}

export interface TransferRequest {
  toAccountId: string;
  amount: number;
}

export interface PaymentRequest {
  billerId: string;
  invoiceNumber: string;
  amount: number;
}

export interface SimpleTransactionResponse {
  transactionId: string;
  status: TransactionStatus;
  failureReason?: string;
}

/** Info needed to open Razorpay Checkout on the client. */
export interface PaymentCheckoutInfo {
  orderId: string;
  key: string;
  amountMajor: number;
  currency: string;
}

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}
