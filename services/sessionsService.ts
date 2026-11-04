import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getActiveTenantId } from './tenantContext';

export interface AdminSession {
  isAuthenticated: boolean;
  role: 'admin' | 'seller' | 'dev';
  loginTime: number;
  lastActivity: number;
  userId?: string;
}

const SESSION_DOC = (userId: string) => `tenants/${getActiveTenantId()}/sessions/${userId}`;

export const saveAdminSession = async (session: AdminSession): Promise<void> => {
  if (!session.userId) return;
  await setDoc(doc(db, SESSION_DOC(session.userId)), session, { merge: true });
};

export const loadAdminSession = async (userId: string): Promise<AdminSession | null> => {
  const snap = await getDoc(doc(db, SESSION_DOC(userId)));
  return snap.exists() ? (snap.data() as AdminSession) : null;
};

export const clearAdminSession = async (userId: string): Promise<void> => {
  await deleteDoc(doc(db, SESSION_DOC(userId)));
};

