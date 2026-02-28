
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
  ncm?: string; // Nomenclatura Comum do Mercosul
  cfop?: string; // Código Fiscal de Operações e Prestações
  cst?: string; // Código de Situação Tributária
  origem?: number; // 0 para Nacional, 1 para Estrangeira, etc.
  cest?: string; // Código Especificador da Substituição Tributária
  unidade?: string; // UN, KG, PC, etc.
  peso?: number; // Peso em kg
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
  image?: string;
  description?: string;
}

export interface Order {
  id: string;
  customerId: number;
  customerEmail: string;
  customerName: string;
  date: string;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  trackingCode?: string;
  carrier?: string;
  notes?: string;
  salesChannel?: 'online' | 'physical';
  paymentMethod?: string;
  emitNF?: boolean;
  nfeXml?: string;
}

export interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  ibgeCode?: string; // Código IBGE do município (obrigatório para NF-e)
  type: 'billing' | 'shipping';
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone: string;
  cpfCnpj?: string;
  avatar?: string;
  addresses: Address[];
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  orderHistory: Order[];
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

export interface NfeSettings {
  cnpj: string;
  razaoSocial: string;
  inscricaoEstadual: string;
  codigoIbgeMunicipio: string;
  apiToken: string;
  ambiente: 'homologacao' | 'producao';
  serie: string;
  certificadoA1?: string;
}

export interface FiscalConfig {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  codigoIbgeMunicipio: string;
  ambiente: 'homologacao' | 'producao';
  serie: string;
  numeroAtual: number;
}
