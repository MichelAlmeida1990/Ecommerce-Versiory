import { db } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Subscription } from '../types';

const COLLECTION = 'subscriptions';

export const getSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const q = query(collection(db, COLLECTION), orderBy('requestedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Subscription));
  } catch (e) {
    console.error('Erro ao carregar assinaturas:', e);
    return [];
  }
};

export const saveSubscription = async (sub: Subscription): Promise<void> => {
  const ref = doc(db, COLLECTION, sub.id);
  await setDoc(ref, sub, { merge: true });
};

export const updateSubscription = async (id: string, data: Partial<Subscription>): Promise<void> => {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, data as any);
};

export const deleteSubscription = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};

export const approveSubscription = async (id: string, approvedBy: string): Promise<void> => {
  const now = new Date().toISOString();
  await updateSubscription(id, {
    status: 'active',
    paidAt: now,
    startsAt: now,
    approvedBy
  });
};

export const cancelSubscription = async (id: string): Promise<void> => {
  await updateSubscription(id, { status: 'cancelled' });
};
