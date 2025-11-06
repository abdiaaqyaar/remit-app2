/*
  # RemitBridge Database Schema

  ## Overview
  Creates the complete database schema for RemitBridge remittance application.

  ## 1. New Tables
  
  ### `profiles`
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email
  - `phone` (text) - User phone number
  - `full_name` (text) - User's full name
  - `country` (text) - User's country (USA/UK/EU)
  - `kyc_status` (text) - KYC verification status (pending/under_review/approved/rejected)
  - `kyc_documents` (jsonb) - Stored KYC document references
  - `biometric_enabled` (boolean) - Biometric authentication toggle
  - `preferred_language` (text) - User's language preference
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `recipients`
  - `id` (uuid, primary key) - Recipient identifier
  - `user_id` (uuid, foreign key) - Owner of this recipient
  - `full_name` (text) - Recipient's full name
  - `phone_number` (text) - Recipient's phone number
  - `mpesa_number` (text) - M-Pesa account number
  - `country` (text) - Recipient country (Kenya)
  - `is_favorite` (boolean) - Quick access flag
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `transactions`
  - `id` (uuid, primary key) - Transaction identifier
  - `user_id` (uuid, foreign key) - Transaction owner
  - `recipient_id` (uuid, foreign key) - Recipient reference
  - `send_amount` (numeric) - Amount sent in source currency
  - `send_currency` (text) - Source currency (USD/GBP/EUR)
  - `receive_amount` (numeric) - Amount received in KES
  - `exchange_rate` (numeric) - FX rate applied
  - `fee_amount` (numeric) - Transaction fee
  - `total_amount` (numeric) - Total deducted from sender
  - `payment_gateway` (text) - Gateway used (Stripe/Flutterwave)
  - `status` (text) - Transaction status (pending/processing/delivered/failed)
  - `payment_reference` (text) - External payment reference
  - `mpesa_confirmation` (text) - M-Pesa confirmation code
  - `notes` (text) - Transaction notes
  - `created_at` (timestamptz) - Transaction creation
  - `completed_at` (timestamptz) - Transaction completion
  - `updated_at` (timestamptz) - Last status update

  ### `notifications`
  - `id` (uuid, primary key) - Notification identifier
  - `user_id` (uuid, foreign key) - Notification recipient
  - `transaction_id` (uuid, foreign key) - Related transaction
  - `title` (text) - Notification title
  - `message` (text) - Notification message
  - `type` (text) - Notification type (transaction/kyc/system)
  - `is_read` (boolean) - Read status
  - `created_at` (timestamptz) - Notification timestamp

  ### `exchange_rates`
  - `id` (uuid, primary key) - Rate identifier
  - `from_currency` (text) - Source currency
  - `to_currency` (text) - Target currency (KES)
  - `rate` (numeric) - Exchange rate
  - `fee_percentage` (numeric) - Fee as percentage
  - `updated_at` (timestamptz) - Rate update timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Profile access restricted to authenticated owner
  - Recipients restricted to owner
  - Transactions restricted to owner
  - Notifications restricted to recipient
  - Exchange rates publicly readable

  ## 3. Important Notes
  - All monetary values use numeric type for precision
  - Timestamps use timestamptz for timezone awareness
  - JSONB used for flexible KYC document storage
  - Foreign keys maintain referential integrity
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  phone text,
  full_name text NOT NULL,
  country text NOT NULL DEFAULT 'USA',
  kyc_status text NOT NULL DEFAULT 'pending',
  kyc_documents jsonb DEFAULT '[]'::jsonb,
  biometric_enabled boolean DEFAULT false,
  preferred_language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create recipients table
CREATE TABLE IF NOT EXISTS recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone_number text NOT NULL,
  mpesa_number text NOT NULL,
  country text NOT NULL DEFAULT 'Kenya',
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recipients"
  ON recipients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipients"
  ON recipients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipients"
  ON recipients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipients"
  ON recipients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES recipients(id) ON DELETE RESTRICT,
  send_amount numeric(12,2) NOT NULL,
  send_currency text NOT NULL,
  receive_amount numeric(12,2) NOT NULL,
  exchange_rate numeric(10,4) NOT NULL,
  fee_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL,
  payment_gateway text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_reference text,
  mpesa_confirmation text,
  notes text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL DEFAULT 'KES',
  rate numeric(10,4) NOT NULL,
  fee_percentage numeric(5,2) NOT NULL DEFAULT 2.5,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(from_currency, to_currency)
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exchange rates"
  ON exchange_rates FOR SELECT
  TO authenticated
  USING (true);

-- Insert default exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate, fee_percentage)
VALUES 
  ('USD', 'KES', 129.50, 2.5),
  ('GBP', 'KES', 162.75, 2.5),
  ('EUR', 'KES', 141.20, 2.5)
ON CONFLICT (from_currency, to_currency) 
DO UPDATE SET 
  rate = EXCLUDED.rate,
  updated_at = now();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipients_user_id ON recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);