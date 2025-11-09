/*
  # Create Orders, Escrow, and Dispute Management Schema

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `buyer_id` (uuid, foreign key to auth.users)
      - `seller_id` (uuid, foreign key to auth.users)
      - `product_id` (uuid, foreign key to products)
      - `price` (numeric)
      - `status` (enum: pending_payment, pending_shipment, in_transit, delivered, completed, disputed, refunded)
      - `payment_status` (enum: pending, processing, escrowed, released, refunded)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `escrow_payments`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `amount` (numeric)
      - `status` (enum: held, released, refunded)
      - `stripe_payment_id` (text)
      - `held_at` (timestamp)
      - `released_at` (timestamp, nullable)

    - `disputes`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `raised_by` (uuid, foreign key to auth.users)
      - `reason` (text: fake, broken, not_verified, other)
      - `description` (text)
      - `status` (enum: open, in_review, resolved, refunded)
      - `created_at` (timestamp)
      - `resolved_at` (timestamp, nullable)
      - `resolved_by` (uuid, nullable, foreign key to admin user)
      - `resolution` (text, nullable)

    - `dispute_evidence`
      - `id` (uuid, primary key)
      - `dispute_id` (uuid, foreign key to disputes)
      - `image_url` (text)
      - `uploaded_at` (timestamp)

    - `order_verifications`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `service_provider` (text: PSA, DNA, JSA, other)
      - `status` (enum: pending, in_progress, verified, failed)
      - `certificate_id` (text, nullable)
      - `certificate_url` (text, nullable)
      - `requested_at` (timestamp)
      - `completed_at` (timestamp, nullable)
      - `notes` (text, nullable)

    - `products`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `price` (numeric)
      - `seller_id` (uuid, foreign key to auth.users)
      - `condition` (text: Mint, Good, Fair)
      - `images` (text array)
      - `verified` (boolean)
      - `category` (text, nullable)
      - `team` (text, nullable)
      - `player` (text, nullable)
      - `year` (text, nullable)
      - `stock` (integer, default: 1)
      - `created_at` (timestamp)

    - `audit_logs`
      - `id` (uuid, primary key)
      - `action` (text)
      - `order_id` (uuid, nullable, foreign key to orders)
      - `user_id` (uuid, foreign key to auth.users)
      - `timestamp` (timestamp)
      - `metadata` (jsonb)

  2. Security
    - Enable RLS on all tables
    - Add policies for buyer, seller, and admin access
    - Restrict orders visibility by ownership
    - Allow admins to view all disputes and escrow

  3. Indexes
    - Index on orders(buyer_id, status)
    - Index on orders(seller_id, status)
    - Index on disputes(order_id, status)
    - Index on audit_logs(user_id, timestamp)
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  seller_id uuid NOT NULL,
  condition text NOT NULL CHECK (condition IN ('Mint', 'Good', 'Fair')),
  images text[] DEFAULT ARRAY[]::text[],
  verified boolean DEFAULT false,
  category text,
  team text,
  player text,
  year text,
  stock integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id),
  price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'pending_shipment', 'in_transit', 'delivered', 'completed', 'disputed', 'refunded')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'escrowed', 'released', 'refunded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escrow_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
  stripe_payment_id text,
  held_at timestamptz DEFAULT now(),
  released_at timestamptz
);

CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  raised_by uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('fake', 'broken', 'not_verified', 'other')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'refunded')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid,
  resolution text
);

CREATE TABLE IF NOT EXISTS dispute_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  service_provider text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'verified', 'failed')),
  certificate_id text,
  certificate_url text,
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  notes text
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  order_id uuid REFERENCES orders(id),
  user_id uuid NOT NULL,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_orders_buyer_status ON orders(buyer_id, status);
CREATE INDEX idx_orders_seller_status ON orders(seller_id, status);
CREATE INDEX idx_disputes_order_status ON disputes(order_id, status);
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);
CREATE INDEX idx_products_seller ON products(seller_id);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can view published products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Sellers can insert their products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their products"
  ON products FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Orders policies
CREATE POLICY "Buyers can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Sellers can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Sellers can update their order statuses"
  ON orders FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid() OR auth.uid() = buyer_id)
  WITH CHECK (seller_id = auth.uid() OR auth.uid() = buyer_id);

-- Escrow payment policies
CREATE POLICY "Buyers can view escrow for their orders"
  ON escrow_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = escrow_payments.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can view escrow for their orders"
  ON escrow_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = escrow_payments.order_id
      AND orders.seller_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all escrow"
  ON escrow_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Disputes policies
CREATE POLICY "Users can view disputes for their orders"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    raised_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = disputes.order_id
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users can create disputes for their orders"
  ON disputes FOR INSERT
  TO authenticated
  WITH CHECK (
    raised_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND orders.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update disputes"
  ON disputes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Dispute evidence policies
CREATE POLICY "Users can upload evidence for their disputes"
  ON dispute_evidence FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM disputes
      WHERE disputes.id = dispute_id
      AND disputes.raised_by = auth.uid()
    )
  );

CREATE POLICY "Users can view evidence for their disputes"
  ON dispute_evidence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM disputes
      WHERE disputes.id = dispute_evidence.dispute_id
      AND (
        disputes.raised_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM orders
          WHERE orders.id = disputes.order_id
          AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Admins can view all dispute evidence"
  ON dispute_evidence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Order verifications policies
CREATE POLICY "Users can view verifications for their orders"
  ON order_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_verifications.order_id
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all verifications"
  ON order_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Buyers can request verification"
  ON order_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- Audit logs policies
CREATE POLICY "Users can view their audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );
