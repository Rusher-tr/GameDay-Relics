export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  seller_id: string;
  condition: 'Mint' | 'Good' | 'Fair';
  images: string[];
  verified: boolean;
  category?: string;
  team?: string;
  player?: string;
  year?: string;
  stock: number;
  created_at: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  price: number;
  status: 'pending_payment' | 'pending_shipment' | 'in_transit' | 'delivered' | 'completed' | 'disputed' | 'refunded';
  payment_status: 'pending' | 'processing' | 'escrowed' | 'released' | 'refunded';
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface EscrowPayment {
  id: string;
  order_id: string;
  amount: number;
  status: 'held' | 'released' | 'refunded';
  stripe_payment_id?: string;
  held_at: string;
  released_at?: string;
}

export interface Dispute {
  id: string;
  order_id: string;
  raised_by: string;
  reason: 'fake' | 'broken' | 'not_verified' | 'other';
  description: string;
  status: 'open' | 'in_review' | 'resolved' | 'refunded';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution?: string;
}

export interface DisputeEvidence {
  id: string;
  dispute_id: string;
  image_url: string;
  uploaded_at: string;
}

export interface OrderVerification {
  id: string;
  order_id: string;
  service_provider: 'PSA' | 'DNA' | 'JSA' | 'other';
  status: 'pending' | 'in_progress' | 'verified' | 'failed';
  certificate_id?: string;
  certificate_url?: string;
  requested_at: string;
  completed_at?: string;
  notes?: string;
}
