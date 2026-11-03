import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    query,
    orderBy,
    getDocs,
    setDoc,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot
} from "firebase/firestore";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type User as FirebaseUser
} from "firebase/auth";
import {
    Product,
    Order,
    Customer,
    CategoryItem,
    TrackingItem,
    InventoryMovement,
    Expense,
    ManualRevenue,
} from "../types";

const firebaseConfig = {
    apiKey: "AIzaSyCS6qCKhiBQoc5ZGkWzAEZOdycXMnwMzgY",
    authDomain: "versiory-store.firebaseapp.com",
    projectId: "versiory-store",
    storageBucket: "versiory-store.firebasestorage.app",
    messagingSenderId: "453657944560",
    appId: "1:453657944560:web:a45e08446b7c21ee88bd35",
    measurementId: "G-64YE9XW5LD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ---- Tenant ID padrão (enquanto não há roteamento por subdomínio) ----
export const DEFAULT_TENANT_ID = 'versiory-demo';

// Retorna o path da coleção dentro do tenant
const tenantCol = (tenantId: string, col: string) =>
    `tenants/${tenantId}/${col}`;

// ---- Firebase Auth helpers ----
export const signInAdmin = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
};

export const signOutAdmin = async () => {
    await signOut(auth);
};

export const onAdminAuthChanged = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// ---- Cloudinary ----
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dq1hw3zyq/image/upload";
const CLOUDINARY_PRESET = "tojuttxp";

export const uploadImageObj = async (base64String: string, fileName: string): Promise<string> => {
    if (!base64String) return '';
    if (base64String.startsWith('http')) return base64String;
    const formData = new FormData();
    formData.append('file', base64String);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    formData.append('context', `original_filename=${fileName}`);
    try {
        const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        if (!response.ok) throw new Error(`Cloudinary error: ${response.statusText}`);
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw error;
    }
};

// ---- Firestore Generic Helpers (tenant-aware) ----
async function getCollection<T>(tenantId: string, col: string): Promise<T[]> {
    const q = query(collection(db, tenantCol(tenantId, col)));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as T));
}

async function setDocument(tenantId: string, col: string, id: string | number, data: any) {
    const ref = doc(db, tenantCol(tenantId, col), String(id));
    await setDoc(ref, data);
}

async function deleteDocument(tenantId: string, col: string, id: string | number) {
    const ref = doc(db, tenantCol(tenantId, col), String(id));
    await deleteDoc(ref);
}

// ---- Products ----
export const getProducts = (tenantId = DEFAULT_TENANT_ID) =>
    getCollection<Product>(tenantId, 'products');

export const subscribeToProducts = (callback: (products: Product[]) => void, tenantId = DEFAULT_TENANT_ID) => {
    const q = query(collection(db, tenantCol(tenantId, 'products')));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Product)));
    });
};

export const saveProduct = async (product: Product, base64Image?: string, tenantId = DEFAULT_TENANT_ID) => {
    let imageUrl = product.image;
    if (base64Image && base64Image.startsWith('data:image')) {
        imageUrl = await uploadImageObj(base64Image, `product_${product.id}_${Date.now()}`);
    }
    const uploadedImages: string[] = [];
    if (product.images && product.images.length > 0) {
        for (const img of product.images) {
            if (img && img.startsWith('data:image')) {
                uploadedImages.push(await uploadImageObj(img, `product_${product.id}_gallery_${Date.now()}`));
            } else if (img) {
                uploadedImages.push(img);
            }
        }
    }
    const productData = { ...product, image: imageUrl, images: uploadedImages };
    await setDocument(tenantId, 'products', product.id, productData);
    return productData;
};

export const deleteProductItem = (id: number, tenantId = DEFAULT_TENANT_ID) =>
    deleteDocument(tenantId, 'products', id);

// ---- Categories ----
export const getCategories = (tenantId = DEFAULT_TENANT_ID) =>
    getCollection<CategoryItem>(tenantId, 'categories');

export const saveCategory = (category: CategoryItem, tenantId = DEFAULT_TENANT_ID) =>
    setDocument(tenantId, 'categories', category.id, category);

export const deleteCategoryItem = (id: string, tenantId = DEFAULT_TENANT_ID) =>
    deleteDocument(tenantId, 'categories', id);

// ---- Orders ----
export const getOrders = async (tenantId = DEFAULT_TENANT_ID): Promise<Order[]> => {
    const q = query(collection(db, tenantCol(tenantId, 'orders')), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data() } as Order));
};

export const subscribeToOrders = (callback: (orders: Order[]) => void, tenantId = DEFAULT_TENANT_ID) => {
    const q = query(collection(db, tenantCol(tenantId, 'orders')), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ ...d.data() } as Order)));
    });
};

export const saveOrder = (order: Order, tenantId = DEFAULT_TENANT_ID) =>
    setDocument(tenantId, 'orders', order.id, order);

export const getOrder = async (id: string, tenantId = DEFAULT_TENANT_ID): Promise<Order | null> => {
    const ref = doc(db, tenantCol(tenantId, 'orders'), id);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as Order : null;
};

// ---- Customers ----
export const getCustomers = (tenantId = DEFAULT_TENANT_ID) =>
    getCollection<Customer>(tenantId, 'customers');

export const saveCustomer = (customer: Customer, tenantId = DEFAULT_TENANT_ID) =>
    setDocument(tenantId, 'customers', customer.id, customer);

export const subscribeToCustomers = (callback: (customers: Customer[]) => void, tenantId = DEFAULT_TENANT_ID) => {
    return onSnapshot(collection(db, tenantCol(tenantId, 'customers')), (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Customer)));
    });
};

// ---- Cart ----
export const saveCart = async (email: string, items: any[], tenantId = DEFAULT_TENANT_ID) => {
    await setDocument(tenantId, 'carts', email, { items, updatedAt: Date.now() });
};

export const getCart = async (email: string, tenantId = DEFAULT_TENANT_ID): Promise<any[]> => {
    const ref = doc(db, tenantCol(tenantId, 'carts'), email);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().items || [] : [];
};

// ---- Tracking ----
export const getTracking = (tenantId = DEFAULT_TENANT_ID) =>
    getCollection<TrackingItem>(tenantId, 'tracking');

export const saveTrackingItem = (tracking: TrackingItem, tenantId = DEFAULT_TENANT_ID) =>
    setDocument(tenantId, 'tracking', tracking.orderId, tracking);

export const getTrackingItem = async (orderId: string, tenantId = DEFAULT_TENANT_ID): Promise<TrackingItem | null> => {
    const ref = doc(db, tenantCol(tenantId, 'tracking'), orderId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as TrackingItem : null;
};

// ---- Inventory Movements ----
export const getInventoryMovements = async (tenantId = DEFAULT_TENANT_ID): Promise<InventoryMovement[]> => {
    const q = query(collection(db, tenantCol(tenantId, 'inventoryMovements')), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data() } as InventoryMovement));
};

export const subscribeToInventoryMovements = (callback: (movements: InventoryMovement[]) => void, tenantId = DEFAULT_TENANT_ID) => {
    const q = query(collection(db, tenantCol(tenantId, 'inventoryMovements')), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ ...d.data() } as InventoryMovement)));
    });
};

export const saveInventoryMovement = (movement: InventoryMovement, tenantId = DEFAULT_TENANT_ID) =>
    setDocument(tenantId, 'inventoryMovements', movement.id, movement);

// ---- Expenses ----
export const getExpenses = async (tenantId = DEFAULT_TENANT_ID): Promise<Expense[]> => {
    const q = query(collection(db, tenantCol(tenantId, 'expenses')), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data() } as Expense));
};

export const subscribeToExpenses = (callback: (expenses: Expense[]) => void, tenantId = DEFAULT_TENANT_ID) => {
    const q = query(collection(db, tenantCol(tenantId, 'expenses')), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ ...d.data() } as Expense)));
    });
};

export const saveExpense = (expense: Expense, tenantId = DEFAULT_TENANT_ID) =>
    setDocument(tenantId, 'expenses', expense.id, expense);

export const deleteExpense = (id: number, tenantId = DEFAULT_TENANT_ID) =>
    deleteDocument(tenantId, 'expenses', id);

// ---- Manual Revenues ----
export const getManualRevenues = (tenantId = DEFAULT_TENANT_ID) =>
    getCollection<ManualRevenue>(tenantId, 'manualRevenues');

export const saveManualRevenue = (revenue: ManualRevenue, tenantId = DEFAULT_TENANT_ID) =>
    setDocument(tenantId, 'manualRevenues', revenue.id, revenue);

export const deleteManualRevenue = (id: number, tenantId = DEFAULT_TENANT_ID) =>
    deleteDocument(tenantId, 'manualRevenues', id);

// ---- Coupons ----
import { Coupon } from '../types';

export const getCoupons = (tenantId = DEFAULT_TENANT_ID) =>
    getCollection<Coupon>(tenantId, 'coupons');

export const saveCoupon = (coupon: Coupon, tenantId = DEFAULT_TENANT_ID) =>
    setDocument(tenantId, 'coupons', coupon.id, coupon);

export const deleteCouponItem = (id: string, tenantId = DEFAULT_TENANT_ID) =>
    deleteDocument(tenantId, 'coupons', id);

export const validateAndUseCoupon = async (
    codigo: string,
    tenantId = DEFAULT_TENANT_ID
): Promise<{ coupon: Coupon | null; error: string | null }> => {
    try {
        const coupons = await getCoupons(tenantId);
        const coupon = coupons.find(c => c.codigo.toUpperCase() === codigo.toUpperCase());
        if (!coupon) return { coupon: null, error: 'Cupom inválido ou expirado' };
        if (!coupon.ativo) return { coupon: null, error: 'Cupom inválido ou expirado' };
        const now = new Date();
        const fim = new Date(coupon.dataFim);
        fim.setHours(23, 59, 59, 999);
        if (now < new Date(coupon.dataInicio) || now > fim)
            return { coupon: null, error: 'Cupom fora do período de validade' };
        if (coupon.usosRealizados >= coupon.usoMaximo)
            return { coupon: null, error: 'Limite de usos do cupom atingido' };
        const updated: Coupon = { ...coupon, usosRealizados: coupon.usosRealizados + 1 };
        await saveCoupon(updated, tenantId);
        return { coupon: updated, error: null };
    } catch (err) {
        console.error('Erro ao validar cupom:', err);
        return { coupon: null, error: 'Erro ao validar cupom. Tente novamente.' };
    }
};

// ---- User Session (localStorage — migrar para Firestore futuramente) ----
export interface UserSession {
    email: string;
    name?: string;
    phone?: string;
    cpfCnpj?: string;
    address?: string;
    loginTime: number;
    tenantId?: string;
    planId?: string;
    subscriptionStatus?: 'pending' | 'active' | 'expired' | 'cancelled';
    subscriptionExpiresAt?: string | null;
}

export const saveUserSession = async (session: UserSession) => {
    const data = { ...session, loginTime: session.loginTime || Date.now() };
    localStorage.setItem(`versiory_user_${session.email}`, JSON.stringify(data));
    localStorage.setItem('versiory_last_user', session.email);
};

export const getUserSession = async (): Promise<UserSession | null> => {
    try {
        const lastUser = localStorage.getItem('versiory_last_user');
        if (!lastUser) return null;
        const data = localStorage.getItem(`versiory_user_${lastUser}`);
        return data ? JSON.parse(data) as UserSession : null;
    } catch {
        return null;
    }
};

export const clearUserSession = async () => {
    const lastUser = localStorage.getItem('versiory_last_user');
    if (lastUser) localStorage.removeItem(`versiory_user_${lastUser}`);
    localStorage.removeItem('versiory_last_user');
};

// ---- Admin Session (localStorage) ----
const ADMIN_SESSION_KEY = 'versiory_admin_session';

export interface AdminSession {
    isAuthenticated: boolean;
    role?: 'admin' | 'seller' | 'dev';
    tenantId?: string;
    loginTime: number;
    lastActivity: number;
}

export const saveAdminSession = async (session: AdminSession) => {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
};

export const getAdminSession = async (): Promise<AdminSession | null> => {
    try {
        const data = localStorage.getItem(ADMIN_SESSION_KEY);
        if (!data) return null;
        const session = JSON.parse(data) as AdminSession;
        const maxAge = session.role === 'dev' ? 8 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        if (Date.now() - session.loginTime > maxAge) {
            localStorage.removeItem(ADMIN_SESSION_KEY);
            return null;
        }
        return session;
    } catch {
        return null;
    }
};

export const updateAdminActivity = async () => {
    try {
        const session = await getAdminSession();
        if (session?.isAuthenticated) {
            await saveAdminSession({ ...session, lastActivity: Date.now() });
        }
    } catch (error) {
        console.error('Erro ao atualizar atividade admin:', error);
    }
};

export const clearAdminSession = async () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
};

// ---- Audit Log (coleção global — visível para dev cross-tenant) ----
export interface AuditLogEntry {
    id?: string;
    userId?: string;
    userRole?: string;
    tenantId?: string;
    action: string;
    entity?: string;
    entityId?: string;
    details?: string;
    createdAt: number;
}

export const logAudit = async (entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) => {
    try {
        const ref = doc(collection(db, 'audit_logs'));
        await setDoc(ref, { ...entry, createdAt: Date.now() });
    } catch (error) {
        console.error('Erro ao registrar audit log:', error);
    }
};

// ---- Tenant Config ----
export interface TenantConfig {
    name: string;
    slug: string;
    whatsapp: string;
    active: boolean;
    createdAt: string;
    logoUrl?: string;
    primaryColor?: string;
}

export const getTenantConfig = async (tenantId = DEFAULT_TENANT_ID): Promise<TenantConfig | null> => {
    const ref = doc(db, 'tenants', tenantId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as TenantConfig : null;
};

export const saveTenantConfig = async (config: TenantConfig, tenantId = DEFAULT_TENANT_ID) => {
    const ref = doc(db, 'tenants', tenantId);
    await setDoc(ref, config);
};

// ---- WhatsApp da loja ----
export const STORE_WHATSAPP_NUMBER = '5511958540171';
