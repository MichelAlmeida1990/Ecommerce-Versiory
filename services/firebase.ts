import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    setDoc,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot
} from "firebase/firestore";
import {
    Product,
    Order,
    Customer,
    CategoryItem,
    TrackingItem,
    InventoryMovement,
    Expense
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

// ---- Cloudinary Setup ----
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dq1hw3zyq/image/upload";
const CLOUDINARY_PRESET = "tojuttxp";

export const uploadImageObj = async (base64String: string, fileName: string): Promise<string> => {
    if (!base64String) return '';
    if (base64String.startsWith('http')) return base64String;

    const formData = new FormData();
    formData.append('file', base64String);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    // We append the fileName just as context, Cloudinary handles unique naming
    formData.append('context', `original_filename=${fileName}`);

    try {
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Cloudinary error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw error;
    }
};

// ---- Firestore Generic Helpers ----

async function getCollection<T>(path: string): Promise<T[]> {
    const q = query(collection(db, path));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
}

// Since we are using number/string IDs, we use setDoc to specify the document ID
async function setDocument(path: string, id: string | number, data: any) {
    const docRef = doc(db, path, String(id));
    await setDoc(docRef, data);
}

async function deleteDocument(path: string, id: string | number) {
    const docRef = doc(db, path, String(id));
    await deleteDoc(docRef);
}

// ---- Products ----
export const getProducts = () => getCollection<Product>("products");
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
    const q = query(collection(db, "products"));
    return onSnapshot(q, (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Product));
        callback(products);
    });
};

export const saveProduct = async (product: Product, base64Image?: string) => {
    let imageUrl = product.image;
    if (base64Image && base64Image.startsWith('data:image')) {
        imageUrl = await uploadImageObj(base64Image, `product_${product.id}_${Date.now()}`);
    }

    // Processar array de imagens secundárias
    const uploadedImages: string[] = [];
    if (product.images && product.images.length > 0) {
        for (const img of product.images) {
            if (img && img.startsWith('data:image')) {
                const url = await uploadImageObj(img, `product_${product.id}_gallery_${Date.now()}`);
                uploadedImages.push(url);
            } else if (img) {
                uploadedImages.push(img);
            }
        }
    }

    const productData = {
        ...product,
        image: imageUrl,
        images: uploadedImages
    };
    await setDocument("products", product.id, productData);
    return productData;
};


export const deleteProductItem = (id: number) => deleteDocument("products", id);


// ---- Categories ----
export const getCategories = () => getCollection<CategoryItem>("categories");
export const saveCategory = (category: CategoryItem) => setDocument("categories", category.id, category);
export const deleteCategoryItem = (id: string) => deleteDocument("categories", id);

// ---- Orders ----
export const getOrders = async (): Promise<Order[]> => {
    // Sort by date descending
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data() } as Order));
};
export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ ...doc.data() } as Order));
        callback(orders);
    });
};
export const saveOrder = (order: Order) => setDocument("orders", order.id, order);
export const getOrder = async (id: string): Promise<Order | null> => {
    const docRef = doc(db, "orders", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as Order;
    }
    return null;
};

// ---- Customers ----
export const getCustomers = () => getCollection<Customer>("customers");
export const saveCustomer = (customer: Customer) => setDocument("customers", customer.id, customer);

// ---- Cart Persistence ----
export const saveCart = async (email: string, items: any[]) => {
    await setDocument("carts", email, { items, updatedAt: Date.now() });
};

export const getCart = async (email: string): Promise<any[]> => {
    const docRef = doc(db, "carts", email);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().items || [];
    }
    return [];
};

// ---- Tracking ----
export const getTracking = () => getCollection<TrackingItem>("tracking");
export const saveTrackingItem = (tracking: TrackingItem) => setDocument("tracking", tracking.orderId, tracking);
export const getTrackingItem = async (orderId: string): Promise<TrackingItem | null> => {
    const docRef = doc(db, "tracking", orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as TrackingItem;
    }
    return null;
};

// ---- Inventory Movements ----
export const getInventoryMovements = async (): Promise<InventoryMovement[]> => {
    const q = query(collection(db, "inventoryMovements"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data() } as InventoryMovement));
};
export const subscribeToInventoryMovements = (callback: (movements: InventoryMovement[]) => void) => {
    const q = query(collection(db, "inventoryMovements"), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const movements = snapshot.docs.map(doc => ({ ...doc.data() } as InventoryMovement));
        callback(movements);
    });
};
export const saveInventoryMovement = (movement: InventoryMovement) => setDocument("inventoryMovements", movement.id, movement);

// ---- Expenses ----
export const getExpenses = async (): Promise<Expense[]> => {
    const q = query(collection(db, "expenses"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data() } as Expense));
};
export const subscribeToExpenses = (callback: (expenses: Expense[]) => void) => {
    const q = query(collection(db, "expenses"), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const expenses = snapshot.docs.map(doc => ({ ...doc.data() } as Expense));
        callback(expenses);
    });
};
export const saveExpense = (expense: Expense) => setDocument("expenses", expense.id, expense);
export const deleteExpense = (id: number) => deleteDocument("expenses", id);

// ---- User Session ----
// Cada usuário tem sua própria sessão baseada no email

export interface UserSession {
    email: string;
    name?: string;
    phone?: string;
    cpfCnpj?: string;
    address?: string;
    loginTime: number;
}

export const saveUserSession = async (session: UserSession) => {
    const sessionData = {
        ...session,
        loginTime: session.loginTime || Date.now()
    };
    // Usar email como chave única para cada usuário
    localStorage.setItem(`versiory_user_${session.email}`, JSON.stringify(sessionData));
    // Salvar também qual é o último usuário logado
    localStorage.setItem('versiory_last_user', session.email);
};

export const getUserSession = async (): Promise<UserSession | null> => {
    try {
        // Buscar o último usuário logado
        const lastUser = localStorage.getItem('versiory_last_user');
        if (!lastUser) return null;

        const sessionData = localStorage.getItem(`versiory_user_${lastUser}`);
        if (!sessionData) return null;

        return JSON.parse(sessionData) as UserSession;
    } catch (error) {
        console.error('Erro ao buscar sessão:', error);
        return null;
    }
};

export const clearUserSession = async () => {
    const lastUser = localStorage.getItem('versiory_last_user');
    if (lastUser) {
        localStorage.removeItem(`versiory_user_${lastUser}`);
    }
    localStorage.removeItem('versiory_last_user');
};

// ---- Admin Session ----
const ADMIN_SESSION_KEY = "versiory_admin_session";

export interface AdminSession {
    isAuthenticated: boolean;
    role?: 'admin' | 'seller';
    loginTime: number;
    lastActivity: number;
}

export const saveAdminSession = async (session: AdminSession) => {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
};

export const getAdminSession = async (): Promise<AdminSession | null> => {
    try {
        const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
        if (sessionData) {
            const session = JSON.parse(sessionData) as AdminSession;
            // Verificar se a sessão é válida (ex: menos de 24h)
            const isExpired = Date.now() - session.loginTime > 24 * 60 * 60 * 1000;
            if (isExpired) {
                localStorage.removeItem(ADMIN_SESSION_KEY);
                return null;
            }
            return session;
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar sessão admin:', error);
        return null;
    }
};

export const updateAdminActivity = async () => {
    try {
        const session = await getAdminSession();
        if (session && session.isAuthenticated) {
            await saveAdminSession({
                ...session,
                lastActivity: Date.now()
            });
        }
    } catch (error) {
        console.error('Erro ao atualizar atividade admin:', error);
    }
};

export const clearAdminSession = async () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
};

// ---- Coupons (ERRCOM124) ----
import { Coupon } from '../types';

export const getCoupons = () => getCollection<Coupon>('coupons');

export const saveCoupon = (coupon: Coupon) => setDocument('coupons', coupon.id, coupon);

export const deleteCouponItem = (id: string) => deleteDocument('coupons', id);

/**
 * Valida e consome um cupom.
 * Retorna o objeto coupon se válido, ou null se inválido (com mensagem de erro).
 */
export const validateAndUseCoupon = async (
    codigo: string
): Promise<{ coupon: Coupon | null; error: string | null }> => {
    try {
        const coupons = await getCoupons();
        const coupon = coupons.find(
            c => c.codigo.toUpperCase() === codigo.toUpperCase()
        );

        if (!coupon) return { coupon: null, error: 'Cupom inválido ou expirado' };
        if (!coupon.ativo) return { coupon: null, error: 'Cupom inválido ou expirado' };

        const now = new Date();
        const inicio = new Date(coupon.dataInicio);
        const fim = new Date(coupon.dataFim);
        fim.setHours(23, 59, 59, 999); // incluir o dia inteiro

        if (now < inicio || now > fim) {
            return { coupon: null, error: 'Cupom fora do período de validade' };
        }

        if (coupon.usosRealizados >= coupon.usoMaximo) {
            return { coupon: null, error: 'Limite de usos do cupom atingido' };
        }

        // Incrementar uso — salvar de volta no Firestore
        const updated: Coupon = { ...coupon, usosRealizados: coupon.usosRealizados + 1 };
        await saveCoupon(updated);

        return { coupon: updated, error: null };
    } catch (err) {
        console.error('Erro ao validar cupom:', err);
        return { coupon: null, error: 'Erro ao validar cupom. Tente novamente.' };
    }
};


