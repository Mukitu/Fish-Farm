
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
}

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  type: 'খাবার' | 'ওষুধ' | 'অন্যান্য';
  price_per_unit?: number;
  custom_properties?: any;
  // Fixed: Added missing low_stock_threshold property
  low_stock_threshold: number;
}

export interface Pond {
  id: string;
  user_id: string;
  name: string;
  area: number;
  fish_type: string;
  stock_date: string;
  is_active: boolean;
  is_archived: boolean;
}

// Fixed: Added missing GrowthRecord interface export
export interface GrowthRecord {
  id: string;
  user_id: string;
  pond_id: string;
  pond_name: string;
  avg_weight_gm: number;
  sample_count: number;
  date: string;
}

export interface ExpenseRecord {
  id: string;
  pond_id: string;
  category: string;
  item_name: string;
  amount: number;
  weight?: number;
  date: string;
}

export interface SaleRecord {
  id: string;
  pond_id: string;
  item_name: string;
  amount: number;
  weight: number;
  date: string;
}

export const SUBSCRIPTION_PLANS = [
  { id: 1, ponds: 1, price: 150, label: '১টি পুকুর' },
  { id: 2, ponds: 2, price: 300, label: '২টি পুকুর' },
  { id: 3, ponds: 3, price: 400, label: '৩টি পুকুর' },
  { id: 4, ponds: 4, price: 500, label: '৪টি পুকুর' },
  { id: 5, ponds: 5, price: 550, label: '৫টি পুকুর' },
  { id: 6, ponds: 999, price: 800, label: 'আনলিমিটেড পুকুর' },
];
