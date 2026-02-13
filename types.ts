
export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  rating: number;
  reviews: number;
  stock?: number;
  sizes?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type Category = 'Todos' | 'Eletrônicos' | 'Moda' | 'Casa' | 'Esportes';

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
}

export interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: number;
  customerName: string;
  date: string;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  notes?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
}

export interface TrackingItem {
  orderId: string;
  carrier: string;
  code: string;
  status: 'posted' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'delayed';
  lastUpdate: string;
}

export interface InventoryMovement {
  id: number;
  productId: number;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
  user: string;
}

export interface Expense {
  id: number;
  description: string;
  category: 'fixed' | 'variable' | 'investment' | 'emergency';
  amount: number;
  date: string;
  notes?: string;
  user: string;
}
