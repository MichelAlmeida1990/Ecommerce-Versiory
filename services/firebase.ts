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
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
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
    Coupon,
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

import { getActiveTenantId } from './tenantContext';
export const DEFAULT_TENANT_ID = 'versiory-demo';
export const SHOWCASE_TENANT_ID = DEFAULT_TENANT_ID;

// Re-export de funções de tenant (domínio/subdomínio/onboarding)
export { getTenantByDomain, getTenantBySubdomain } from './tenantService';
export { createPendingOnboarding, getPendingOnboardings, approvePendingOnboarding, rejectPendingOnboarding } from './tenantService';

// Retorna o path da coleÃ§Ã£o dentro do tenant
const tenantCol = (tenantId: string, col: string) =>
    `tenants/${tenantId}/${col}`;

// ---- Firebase Auth helpers ----
export const signInAdmin = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
};

export const registerCustomerAuth = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    return cred.user;
};

export const resendCustomerVerification = () => {
    if (!auth.currentUser) throw new Error('Entre na conta para reenviar a confirmação.');
    return sendEmailVerification(auth.currentUser);
};

export const sendCustomerPasswordReset = (email: string) =>
    sendPasswordResetEmail(auth, email);

export const changeCustomerPassword = async (currentPassword: string, newPassword: string) => {
    const user = auth.currentUser;
    if (!user?.email) throw new Error('É necessário entrar na conta novamente.');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
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
export const getProducts = async (tenantId = getActiveTenantId()): Promise<Product[]> => {
    return getCollection<Product>(tenantId, 'products');
};

export const subscribeToProducts = (callback: (products: Product[]) => void, tenantId = getActiveTenantId()) => {
    const q = query(collection(db, tenantCol(tenantId, 'products')));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Product)));
    });
};

export const subscribeToPublicProducts = (
    callback: (products: Product[]) => void,
    tenantId = getActiveTenantId(),
    onError: (error: unknown) => void = (error) => console.error('Erro ao carregar catálogo público:', error)
) => {
    let active = true;
    const refresh = async () => {
        try {
            const products = await getProducts(tenantId);
            if (active) callback(products);
        } catch (error) {
            if (active) onError(error);
        }
    };
    void refresh();
    const refreshTimer = setInterval(() => void refresh(), 60_000);
    return () => {
        active = false;
        clearInterval(refreshTimer);
    };
};

export const saveProduct = async (product: Product, base64Image?: string, tenantId = getActiveTenantId()) => {
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

export const deleteProductItem = (id: number, tenantId = getActiveTenantId()) =>
    deleteDocument(tenantId, 'products', id);

// ---- Categories ----
export const getCategories = (tenantId = getActiveTenantId()) =>
    getCollection<CategoryItem>(tenantId, 'categories');

export const saveCategory = (category: CategoryItem, tenantId = getActiveTenantId()) =>
    setDocument(tenantId, 'categories', category.id, category);

export const deleteCategoryItem = (id: string, tenantId = getActiveTenantId()) =>
    deleteDocument(tenantId, 'categories', id);

// ---- Orders ----
export const getOrders = async (tenantId = getActiveTenantId()): Promise<Order[]> => {
    const q = query(collection(db, tenantCol(tenantId, 'orders')), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data() } as Order));
};

export const subscribeToOrders = (callback: (orders: Order[]) => void, tenantId = getActiveTenantId()) => {
    const q = query(collection(db, tenantCol(tenantId, 'orders')), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ ...d.data() } as Order)));
    });
};

export const saveOrder = (order: Order, tenantId = getActiveTenantId()) =>
    setDocument(tenantId, 'orders', order.id, order);

export const getOrder = async (id: string, tenantId = getActiveTenantId()): Promise<Order | null> => {
    const ref = doc(db, tenantCol(tenantId, 'orders'), id);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as Order : null;
};

// ---- Customers ----
export const getCustomers = (tenantId = getActiveTenantId()) =>
    getCollection<Customer>(tenantId, 'customers');

export const saveCustomer = (customer: Customer, tenantId = getActiveTenantId()) =>
    setDocument(tenantId, 'customers', customer.uid || customer.id, customer);

export const getCustomerProfile = async (tenantId = getActiveTenantId()): Promise<Customer | null> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return null;
    const snapshot = await getDoc(doc(db, tenantCol(tenantId, 'customers'), uid));
    return snapshot.exists() ? ({ ...snapshot.data(), uid } as Customer) : null;
};

export const ensureCustomerProfile = async (
    profile?: Partial<Customer>,
    tenantId = getActiveTenantId()
): Promise<Customer> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('É necessário estar autenticado.');
    const customerData = { ...profile, uid, updatedAt: Date.now() };
    await setDocument(tenantId, 'customers', uid, customerData);
    return customerData as Customer;
};

export const createCustomerOrder = async (
    input: Record<string, unknown>,
    tenantId = getActiveTenantId()
): Promise<{ id: string; total: number; discountAmount: number; items: Order['items'] }> => {
    const orderId = String(input.orderId || `order_${Date.now()}`);
    const orderData = {
        ...input,
        id: orderId,
        tenantId,
        status: 'pending',
        createdAt: Date.now(),
    };
    await setDocument(tenantId, 'orders', orderId, orderData);
    return { id: orderId, total: 0, discountAmount: 0, items: [] };
};

export const getCustomerOrders = async (tenantId = getActiveTenantId()): Promise<Order[]> => {
    const uid = auth.currentUser?.uid;
    const q = query(
        collection(db, tenantCol(tenantId, 'orders')),
        orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    const allOrders = snapshot.docs.map(d => ({ ...d.data() } as Order));
    if (uid) {
        return allOrders.filter(o => o.customerEmail === auth.currentUser?.email);
    }
    return allOrders.filter(o => o.customerEmail === auth.currentUser?.email);
};

export const updateCustomerOrder = async (
    input: { orderId: string; action: 'cancel' | 'request-return' | 'update-address'; reason?: string; address?: string },
    tenantId = getActiveTenantId()
): Promise<Order> => {
    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email;
    const ref = doc(db, tenantCol(tenantId, 'orders'), input.orderId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Pedido não encontrado.');
    const order = snap.data() as Order;
    if (order.customerEmail !== email) {
        throw new Error('Você não tem permissão para atualizar este pedido.');
    }
    const updates: Partial<Order> = {};
    if (input.action === 'cancel') updates.status = 'cancelled';
    if (input.action === 'request-return') updates.status = 'returned';
    if (input.action === 'update-address' && input.address) updates.address = input.address;
    if (input.reason) updates.notes = input.reason;
    await setDoc(ref, { ...order, ...updates });
    return { ...order, ...updates } as Order;
};

export const lookupOrderTracking = async (
    orderId: string,
    email: string,
    tenantId = getActiveTenantId()
): Promise<{ order: Order; tracking: TrackingItem | null }> => {
    const ref = doc(db, tenantCol(tenantId, 'orders'), orderId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Pedido não encontrado.');
    const order = snap.data() as Order;
    if (order.customerEmail !== email) {
        throw new Error('Este pedido não pertence a este e-mail.');
    }
    const trackingRef = doc(db, tenantCol(tenantId, 'tracking'), orderId);
    const trackingSnap = await getDoc(trackingRef);
    const tracking = trackingSnap.exists() ? (trackingSnap.data() as TrackingItem) : null;
    return { order, tracking };
};

export const subscribeToCustomers = (callback: (customers: Customer[]) => void, tenantId = getActiveTenantId()) => {
    return onSnapshot(collection(db, tenantCol(tenantId, 'customers')), (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Customer)));
    });
};

// ---- Cart ----
export const saveCart = async (_email: string, items: any[], tenantId = getActiveTenantId()) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await setDocument(tenantId, 'carts', uid, { items, updatedAt: Date.now() });
};

export const getCart = async (_email: string, tenantId = getActiveTenantId()): Promise<any[]> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const ref = doc(db, tenantCol(tenantId, 'carts'), uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().items || [] : [];
};

// ---- Tracking ----
export const getTracking = (tenantId = getActiveTenantId()) =>
    getCollection<TrackingItem>(tenantId, 'tracking');

export const saveTrackingItem = (tracking: TrackingItem, tenantId = getActiveTenantId()) =>
    setDocument(tenantId, 'tracking', tracking.orderId, tracking);

export const getTrackingItem = async (orderId: string, tenantId = getActiveTenantId()): Promise<TrackingItem | null> => {
    const ref = doc(db, tenantCol(tenantId, 'tracking'), orderId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as TrackingItem : null;
};

// ---- Inventory Movements ----
export const getInventoryMovements = async (tenantId = getActiveTenantId()): Promise<InventoryMovement[]> => {
    const q = query(collection(db, tenantCol(tenantId, 'inventoryMovements')), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data() } as InventoryMovement));
};

export const subscribeToInventoryMovements = (callback: (movements: InventoryMovement[]) => void, tenantId = getActiveTenantId()) => {
    const q = query(collection(db, tenantCol(tenantId, 'inventoryMovements')), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ ...d.data() } as InventoryMovement)));
    });
};

export const saveInventoryMovement = (movement: InventoryMovement, tenantId = getActiveTenantId()) =>
    setDocument(tenantId, 'inventoryMovements', movement.id, movement);

// ---- Expenses ----
export const getExpenses = async (tenantId = getActiveTenantId()): Promise<Expense[]> => {
    const q = query(collection(db, tenantCol(tenantId, 'expenses')), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data() } as Expense));
};

export const subscribeToExpenses = (callback: (expenses: Expense[]) => void, tenantId = getActiveTenantId()) => {
    const q = query(collection(db, tenantCol(tenantId, 'expenses')), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ ...d.data() } as Expense)));
    });
};

export const saveExpense = (expense: Expense, tenantId = getActiveTenantId()) =>
    setDocument(tenantId, 'expenses', expense.id, expense);

export const deleteExpense = (id: number, tenantId = getActiveTenantId()) =>
    deleteDocument(tenantId, 'expenses', id);

// ---- Manual Revenues ----
export const getManualRevenues = (tenantId = getActiveTenantId()) =>
    getCollection<ManualRevenue>(tenantId, 'manualRevenues');

export const saveManualRevenue = (revenue: ManualRevenue, tenantId = getActiveTenantId()) =>
    setDocument(tenantId, 'manualRevenues', revenue.id, revenue);

export const deleteManualRevenue = (id: number, tenantId = getActiveTenantId()) =>
    deleteDocument(tenantId, 'manualRevenues', id);

// ---- Coupons ----
export const getCoupons = (tenantId = getActiveTenantId()) =>
    getCollection<Coupon>(tenantId, 'coupons');

export const saveCoupon = (coupon: Coupon, tenantId = getActiveTenantId()) =>
    setDocument(tenantId, 'coupons', coupon.id, coupon);

export const deleteCouponItem = (id: string, tenantId = getActiveTenantId()) =>
    deleteDocument(tenantId, 'coupons', id);

export const previewCoupon = async (
    codigo: string,
    subtotal: number,
    tenantId = getActiveTenantId()
): Promise<{ coupon: Pick<Coupon, 'codigo' | 'tipo' | 'valor'> | null; error: string | null }> => {
    const coupons = await getCollection<Coupon>(tenantId, 'coupons');
    const coupon = coupons.find(c => c.codigo === codigo);
    if (!coupon) return { coupon: null, error: 'Cupom não encontrado.' };
    if (!coupon.ativo) return { coupon: null, error: 'Cupom inativo.' };
    if (coupon.dataFim && new Date(coupon.dataFim) < new Date()) {
        return { coupon: null, error: 'Cupom expirado.' };
    }
    if (coupon.valorMinimo && subtotal < coupon.valorMinimo) {
        return { coupon: null, error: `Valor mínimo de R$ ${coupon.valorMinimo} não atingido.` };
    }
    return {
        coupon: { codigo: coupon.codigo, tipo: coupon.tipo, valor: coupon.valor },
        error: null,
    };
};

// ---- User Session (localStorage â€” migrar para Firestore futuramente) ----
export interface UserSession {
    email: string;
    uid?: string;
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
    await signOut(auth);
    const lastUser = localStorage.getItem('versiory_last_user');
    if (lastUser) localStorage.removeItem(`versiory_user_${lastUser}`);
    localStorage.removeItem('versiory_last_user');
};

// ---- Admin Session (Firestore) ----
export interface AdminSession {
    isAuthenticated: boolean;
    role?: 'admin' | 'seller' | 'dev';
    tenantId?: string;
    loginTime: number;
    lastActivity: number;
}

export const saveAdminSession = async (session: AdminSession) => {
    const serialized = JSON.stringify(session);
    localStorage.setItem('versiory_admin_session', serialized);
    localStorage.setItem('versiory_admin_session_fallback', serialized);
};

export const getAdminSession = async (): Promise<AdminSession | null> => {
    try {
        const stored = localStorage.getItem('versiory_admin_session_fallback');
        if (!stored) return null;
        const session = JSON.parse(stored) as AdminSession;
        const maxAge = session.role === 'dev' ? 8 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        if (Date.now() - session.loginTime > maxAge) {
            localStorage.removeItem('versiory_admin_session_fallback');
            return null;
        }
        return session;
    } catch (error) {
        console.error('Erro ao recuperar sessão local do painel:', error);
        throw error;
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
    localStorage.removeItem('versiory_admin_session');
    localStorage.removeItem('versiory_admin_session_fallback');
};

// ---- Audit Log (coleÃ§Ã£o global â€” visÃ­vel para dev cross-tenant) ----
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
        await setDoc(ref, { tenantId: entry.tenantId || getActiveTenantId(), ...entry, createdAt: Date.now() });
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

export const getTenantConfig = async (tenantId = getActiveTenantId()): Promise<TenantConfig | null> => {
    const ref = doc(db, 'tenants', tenantId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as TenantConfig : null;
};

export const saveTenantConfig = async (config: TenantConfig, tenantId = getActiveTenantId()) => {
    const ref = doc(db, 'tenants', tenantId);
    await setDoc(ref, config);
};

// ---- WhatsApp da loja ----
export const STORE_WHATSAPP_NUMBER = '5511958540171';
