
export enum UserRole {
  ADMIN = 'ADMIN',
  FARMER = 'FARMER'
}

export enum SubscriptionStatus {
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE'
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  expiry_date: string | null;
  max_ponds: number;
  phone?: string;
  farm_name?: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Pond {
  id: string;
  user_id: string;
  name: string;
  area: number;
  fish_type: string;
  stock_date: string;
  is_active: boolean;
  total_count?: number;
  total_weight?: number;
  avg_weight?: number;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  type: string;
  low_stock_threshold: number;
  created_at?: string;
}

export const SUBSCRIPTION_PLANS = [
  { id: 1, ponds: 1, price: 150, label: '১টি পুকুর' },
  { id: 2, ponds: 2, price: 300, label: '২টি পুকুর' },
  { id: 3, ponds: 3, price: 400, label: '৩টি পুকুর' },
  { id: 4, ponds: 4, price: 500, label: '৪টি পুকুর' },
  { id: 5, ponds: 5, price: 550, label: '৫টি পুকুর' },
  { id: 6, ponds: 999, price: 800, label: 'আনলিমিটেড পুকুর' },
];
