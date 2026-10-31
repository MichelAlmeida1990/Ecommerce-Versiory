import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SmtpSettings } from '../types';

const SMTP_DOC = 'config/smtp';

export const getSmtpConfigFromFirestore = async (): Promise<SmtpSettings | null> => {
  try {
    const snap = await getDoc(doc(db, SMTP_DOC));
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
    await setDoc(doc(db, SMTP_DOC), settings, { merge: true });
  } catch (e) {
    console.error('Erro ao salvar SMTP no Firestore:', e);
    throw e;
  }
};
