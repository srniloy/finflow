export type TransactionType = 'DEBIT' | 'CREDIT';

export type TransactionStatus =
  'PENDING' | 'PENDING_VERIFICATION' | 'PROCESSING' | 'COMPLETED' | 'FLAGGED' | 'FAILED';

export interface Transaction {
  transactionId: string;
  accountNumber: string;
  counterpartyAccountNumber?: string;
  counterpartyName?: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description?: string;
  referenceNumber?: string;
  fee?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TransferRequest {
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
  description?: string;
}

export interface DepositRequest {
  accountNumber: string;
  amount: number;
  description?: string;
}

export interface WithdrawalRequest {
  accountNumber: string;
  amount: number;
  description?: string;
}

export interface VerifyOtpRequest {
  otp: string;
}

export interface TransactionHistoryFilter {
  page?: number;
  size?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  fromDate?: string;
  toDate?: string;
}
