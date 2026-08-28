import { AccountReceivable, AccountPayable } from '../types';

const RECEIVABLE_KEY = 'versiory_accounts_receivable';
const PAYABLE_KEY = 'versiory_accounts_payable';

export const getAccountsReceivable = (): AccountReceivable[] => {
  const stored = localStorage.getItem(RECEIVABLE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveAccountsReceivable = (items: AccountReceivable[]): void => {
  localStorage.setItem(RECEIVABLE_KEY, JSON.stringify(items));
};

export const addAccountReceivable = (item: AccountReceivable): void => {
  const items = getAccountsReceivable();
  items.push(item);
  saveAccountsReceivable(items);
};

export const updateAccountReceivable = (id: string, updates: Partial<AccountReceivable>): void => {
  const items = getAccountsReceivable().map(item => item.id === id ? { ...item, ...updates } : item);
  saveAccountsReceivable(items);
};

export const deleteAccountReceivable = (id: string): void => {
  saveAccountsReceivable(getAccountsReceivable().filter(item => item.id !== id));
};

export const getAccountsPayable = (): AccountPayable[] => {
  const stored = localStorage.getItem(PAYABLE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveAccountsPayable = (items: AccountPayable[]): void => {
  localStorage.setItem(PAYABLE_KEY, JSON.stringify(items));
};

export const addAccountPayable = (item: AccountPayable): void => {
  const items = getAccountsPayable();
  items.push(item);
  saveAccountsPayable(items);
};

export const updateAccountPayable = (id: string, updates: Partial<AccountPayable>): void => {
  const items = getAccountsPayable().map(item => item.id === id ? { ...item, ...updates } : item);
  saveAccountsPayable(items);
};

export const deleteAccountPayable = (id: string): void => {
  saveAccountsPayable(getAccountsPayable().filter(item => item.id !== id));
};
