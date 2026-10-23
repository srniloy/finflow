export type AccountType = 'SAVINGS' | 'CURRENT' | 'FIXED_DEPOSIT' | 'RECURRING_DEPOSIT';

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'CLOSED';

export interface Account {
  id: number;
  accountNumber: string;
  accountHolderName: string;
  email: string;
  phone: string;
  accountType: AccountType;
  status: AccountStatus;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAccountRequest {
  accountHolderName: string;
  email: string;
  phone: string;
  accountType: AccountType;
  initialDeposit?: number;
}

export interface BalanceResponse {
  accountNumber: string;
  balance: number;
  currency: string;
}
