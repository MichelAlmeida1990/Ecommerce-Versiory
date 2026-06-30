
export interface Product {
  id: number;
  name: string;
  price: number;
  pricePOS?: number; // ERRCOM134: Preço para Loja Física
  priceEcommerce?: number; // ERRCOM134: Preço para E-commerce
  priceMarketplace?: number; // Preço para Marketplaces (pode ser diferente devido a comissões)
  category: string;
  image: string;
  images?: string[]; // Múltiplas imagens
  description: string;
  rating: number;
  reviews: number;
  stock?: number;
  minStock?: number; // Estoque mínimo configurável (default: 10)
  stockBySize?: { [size: string]: number }; // Estoque por tamanho
  sizes?: string;
  colors?: string; // Cores disponíveis (ex: "Preto, Branco, Vermelho")
  stockBySizeColor?: { [key: string]: number }; // Estoque por tamanho+cor (ex: "M-Preto": 5)
  sizeChart?: SizeChart; // Régua de medição
  ncm?: string; // Nomenclatura Comum do Mercosul
  cfop?: string; // Código Fiscal de Operações e Prestações
  cst?: string; // Código de Situação Tributária
  origem?: number; // 0 para Nacional, 1 para Estrangeira, etc.
  cest?: string; // Código Especificador da Substituição Tributária
  unidade?: string; // UN, KG, PC, etc.
  peso?: number; // Peso em kg
  aliquotaIcms?: number;
  aliquotaPis?: number;
  aliquotaCofins?: number;
  aliquotaIpi?: number;
  codigoBeneficio?: string;
  gtin?: string; // Código de Barras (EAN)
  gtinTrib?: string; // Código de Barras Tributável
  usoReformaTributaria?: boolean; // Reforma Tributária 2026
  aliquotaCbs?: number; // Contribuição sobre Bens e Serviços (Federal)
  aliquotaIbs?: number; // Imposto sobre Bens e Serviços (Estadual/Municipal)
  aliquotaIs?: number; // Imposto Seletivo (Específico)
  cClassTrib?: string; // Código de Classificação Tributária (Reforma 2026)
  installments?: number; // Parcelamento máximo sem juros
  cardRate?: number; // REFCOM184: Taxa de cartão (%) para parcelamento
  active?: boolean; // ERRCOM105: Inativo/Ativo
  // Marketplace Integration
  mlId?: string; // ID do anúncio no Mercado Livre
  shopeeId?: string; // ID do produto na Shopee
  marketplaceAttributes?: { [key: string]: any }; // Atributos específicos exigidos por cada canal
}


export interface SizeChart {
  P?: { chest?: number; waist?: number; hip?: number; length?: number };
  M?: { chest?: number; waist?: number; hip?: number; length?: number };
  G?: { chest?: number; waist?: number; hip?: number; length?: number };
  GG?: { chest?: number; waist?: number; hip?: number; length?: number };
  XG?: { chest?: number; waist?: number; hip?: number; length?: number };
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export type Category = 'Todos' | 'Eletrônicos' | 'Moda' | 'Casa' | 'Esportes' | 'Cama, Mesa e Banho' | 'Serviços';

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  availableSizes?: string[]; // Tamanhos disponíveis para a categoria
  sizeType?: 'clothing' | 'shoes' | 'accessories' | 'none'; // Tipo de tamanho
}

export interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  priceEcommerce?: number; // ERRCOM138: Preço específico para e-commerce
  image?: string;
  description?: string;
  selectedSize?: string;
  selectedColor?: string;
  installments?: number;
}

export interface InstallmentStatus { // ERRCOM135
  id: string;
  number: string; // Ex: "1/6"
  amount: number;
  status: 'pending' | 'paid'; // REFCOM135
  paidAt?: string;
  notes?: string;
  paymentMethod?: string;
}

export interface Order {
  id: string;
  customerId: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerCpfCnpj?: string; // ERRCOM070
  date: string;
  orderTime?: string; // ERRCOM083
  total: number;
  discountAmount?: number; // ERRCOM108: Valor do desconto concedido
  discountType?: 'percentual' | 'fixo'; // ERRCOM125: Tipo do desconto (PDV)
  couponCode?: string; // ERRCOM108: Cupom utilizado
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'budget' | 'returned';
  statusHistory?: { status: string; date: string; notes?: string }[]; // ERRCOM101: Histórico de status
  items: OrderItem[];
  address?: string;
  estimatedDelivery?: string;
  trackingCode?: string;
  carrier?: string;
  notes?: string; // Observações do pedido
  salesChannel?: 'online' | 'physical' | 'mercadolivre' | 'shopee' | 'magalu' | 'amazon'; // Canal de venda, expandido para marketplaces
  paymentMethod?: string;
  emitNF?: boolean;
  nfeXml?: string;
  isBudget?: boolean; // Orçamento
  customPolicies?: string; // Garantia / Políticas customizadas para esta venda
  accountedInCash?: boolean; // Se o pedido já foi somado ao saldo do caixa atual
  stockDecremented?: boolean; // Se a baixa de estoque já foi realizada para este pedido
  installments?: number; // Número de parcelas (para crédito)
  installmentDetails?: InstallmentStatus[]; // ERRCOM135: Gestão de parcelas
  marketplaceOrderId?: string; // ID original do pedido no marketplace
  marketplaceStatus?: string; // Status original no marketplace para debug
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
  isDefault?: boolean; // Endereço padrão
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  cpfCnpj?: string;
  avatar?: string;
  birthDate?: string;
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
  // REFCOM180: Campos adicionais para exportação CSV para contabilidade
  paymentMethod?: string;
  documentRef?: string;
  supplier?: string;
  supplierCpfCnpj?: string;
}

export interface ManualRevenue { // ERRCOM136: Registro de receitas avulsas
  id: number;
  description: string;
  category: 'PIX' | 'Dinheiro' | 'Credito' | 'Debito' | 'Deposito';
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
  storePolicies?: string;
  // REFCOM169_endereco: Endereço para Retire na Loja
  enderecoRetireLoja?: string;
}

export interface CashWithdrawal {
  id: string;
  amount: number;
  reason: string;
  timestamp: string;
  user: string;
}

export interface CashDeposit {
  id: string;
  amount: number;
  reason: string;
  timestamp: string;
  user: string;
}

export interface CashRegister {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  status: 'open' | 'closed';
  initialAmount: number;
  expectedAmount: number;
  actualAmount?: number;
  difference?: number;
  totalSales: number;
  totalOrders: number;
  salesByPayment: {
    dinheiro: number;
    pix: number;
    debito: number;
    credito: number;
  };
  salesByPaymentCount: {
    dinheiro: number;
    pix: number;
    debito: number;
    credito: number;
  };
  withdrawals: CashWithdrawal[];
  deposits: CashDeposit[];
  totalDiscounts?: number; // REFCOM152: Total de descontos aplicados no período
  cancelledOrders?: number; // REFCOM164: Quantidade de pedidos cancelados no período
  cancelledAmount?: number; // REFCOM164: Valor total dos pedidos cancelados no período
  notes?: string;
}

// ERRCOM124: Interface para Cupons de Desconto
export interface Coupon {
  id: string;
  codigo: string; // ex: "PROMO10"
  tipo: 'percentual' | 'fixo'; // % ou R$ fixo
  valor: number; // 10 = 10% ou R$ 10,00
  dataInicio: string; // ISO date string
  dataFim: string;   // ISO date string
  usoMaximo: number;
  usosRealizados: number;
  ativo: boolean;
  descricao?: string;
  valorMinimo?: number;
}

export interface SmtpSettings { // ERRCOM093
  host: string;
  port: number;
  user: string;
  pass: string;
  encryption: 'tls' | 'ssl';
  authRequired: boolean;
  fromEmail: string;
  fromName: string;
}

export interface MarketplaceConfig {
  mercadolivre?: {
    appId: string;
    clientSecret: string;
    redirectUri: string;
    accessToken?: string;
    refreshToken?: string;
    expiry?: number;
    status: 'connected' | 'disconnected' | 'error';
  };
  shopee?: {
    partnerId: string;
    partnerKey: string;
    shopId: string;
    status: 'connected' | 'disconnected' | 'error';
  };
}

// REFCOM175: Interface para Configuração de Condições de Pagamento
export interface PaymentConfig {
  debitRate: number; // Taxa Débito (%)
  creditRate: number; // Taxa Crédito à vista (%)
  installmentRates: { [installments: number]: number }; // Taxa Crédito parcelado por número de parcelas (%)
  pixRate: number; // Taxa PIX (%)
  anticipationRate: number; // Taxa antecipação (%)
  receiptDays: number; // Prazo de recebimento (dias)
  processors: {
    cielo?: { enabled: boolean; rates?: { [key: string]: number } };
    rede?: { enabled: boolean; rates?: { [key: string]: number } };
    getnet?: { enabled: boolean; rates?: { [key: string]: number } };
    stone?: { enabled: boolean; rates?: { [key: string]: number } };
  };
}
