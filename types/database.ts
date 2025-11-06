export type KycStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type TransactionStatus = 'pending' | 'processing' | 'delivered' | 'failed';
export type Currency = 'USD' | 'GBP' | 'EUR';
export type PaymentGateway = 'Stripe' | 'Flutterwave';
export type NotificationType = 'transaction' | 'kyc' | 'system';

export interface Profile {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  country: string;
  kyc_status: KycStatus;
  kyc_documents: any[];
  biometric_enabled: boolean;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface Recipient {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  mpesa_number: string;
  country: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  recipient_id: string;
  send_amount: number;
  send_currency: Currency;
  receive_amount: number;
  exchange_rate: number;
  fee_amount: number;
  total_amount: number;
  payment_gateway: PaymentGateway;
  status: TransactionStatus;
  payment_reference: string | null;
  mpesa_confirmation: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
  recipient?: Recipient;
}

export interface Notification {
  id: string;
  user_id: string;
  transaction_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  from_currency: Currency;
  to_currency: string;
  rate: number;
  fee_percentage: number;
  updated_at: string;
}
