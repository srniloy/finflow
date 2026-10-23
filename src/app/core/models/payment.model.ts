export type PaymentStatus =
  'CREATED' | 'AUTHORIZED' | 'CAPTURED' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  paymentId: string;
  orderId?: string;
  accountNumber: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  description?: string;
  receipt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePaymentRequest {
  accountNumber: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface PaymentOrderResponse {
  orderId: string;
  razorpayPaymentId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
}

export interface PaymentVerification {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RefundRequest {
  amount?: number;
  reason?: string;
}
