import { db } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { PlanId } from '../config/planConfig';

// Painel do Desenvolvedor: gestão das lojas (tenants) que assinam o sistema

const COLLECTION = 'tenants';

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

export interface Tenant {
  id: string;                      // identificador único da loja (ex: slug)
  storeName: string;
  ownerName: string;
  email: string;
  phone?: string;
  planId: PlanId;
  status: TenantStatus;
  monthlyValue: number;            // valor mensal cobrado (pode diferir do preço de tabela)
  dueDay: number;                  // dia de vencimento da mensalidade
  billingConfig?: {                // config de faturamento gravada no localStorage da loja
    dueDay: number;
    value: number;
    lastPaidMonth: string;
    whatsapp: string;
    pixKey: string;
    bankDetails: string;
    paymentConfirmed: boolean;
    paymentConfirmedAt: string;
  };
  accessNotes?: string;            // anotações de suporte (senhas 2FA, observações de acesso)
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
}

export const getTenants = async (): Promise<Tenant[]> => {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Tenant));
  } catch (e) {
    console.error('Erro ao carregar tenants:', e);
    return [];
  }
};

export const saveTenant = async (tenant: Tenant): Promise<void> => {
  const now = new Date().toISOString();
  const data = { ...tenant, updatedAt: now, createdAt: tenant.createdAt || now };
  await setDoc(doc(db, COLLECTION, tenant.id), data, { merge: true });
};

export const updateTenant = async (id: string, data: Partial<Tenant>): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: new Date().toISOString() } as any);
};

export const deleteTenant = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};

// Ações rápidas de suporte
export const suspendTenant = (id: string) => updateTenant(id, { status: 'suspended' });
export const activateTenant = (id: string) => updateTenant(id, { status: 'active' });

// Extender acesso: move a data de expiração N dias à frente
export const extendTenantAccess = async (tenant: Tenant, days: number): Promise<void> => {
  const base = tenant.billingConfig?.paymentConfirmedAt
    ? new Date(tenant.billingConfig.paymentConfirmedAt)
    : new Date();
  base.setDate(base.getDate() + days);
  await updateTenant(tenant.id, {
    status: 'active',
    billingConfig: {
      ...(tenant.billingConfig || {
        dueDay: tenant.dueDay, value: tenant.monthlyValue, lastPaidMonth: '',
        whatsapp: '', pixKey: '', bankDetails: '', paymentConfirmed: false, paymentConfirmedAt: ''
      }),
      paymentConfirmed: true,
      paymentConfirmedAt: base.toISOString()
    }
  });
};

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  trial: 'Trial',
  active: 'Ativa',
  suspended: 'Suspensa',
  cancelled: 'Cancelada'
};

export const TENANT_STATUS_COLORS: Record<TenantStatus, string> = {
  trial: 'bg-blue-600',
  active: 'bg-emerald-600',
  suspended: 'bg-amber-600',
  cancelled: 'bg-red-600'
};
