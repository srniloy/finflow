export type NotificationType = 'OTP' | 'TRANSACTION' | 'FRAUD' | 'PAYMENT' | 'SYSTEM';

export interface Notification {
  id: number;
  accountNumber: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationFilter {
  type?: NotificationType;
  unreadOnly?: boolean;
}
