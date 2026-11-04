import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SmtpSettings } from '../types';
import { getActiveTenantId } from './tenantContext';

const smtpDocPath = () => `tenants/${getActiveTenantId()}/config/smtp`;

export const getSmtpConfigFromFirestore = async (): Promise<SmtpSettings | null> => {
  try {
    const snap = await getDoc(doc(db, smtpDocPath()));
    if (snap.exists()) {
      return snap.data() as SmtpSettings;
    }
    return null;
  } catch (e) {
    console.error('Erro ao carregar SMTP do Firestore:', e);
    return null;
  }
};

export const saveSmtpConfigToFirestore = async (settings: SmtpSettings): Promise<void> => {
  try {
    await setDoc(doc(db, smtpDocPath()), settings, { merge: true });
  } catch (e) {
    console.error('Erro ao salvar SMTP no Firestore:', e);
    throw e;
  }
};

