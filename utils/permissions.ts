// Centralized permission matrix for admin/seller/dev roles.
export type Role = 'admin' | 'seller' | 'dev';

export type Permission =
  | 'dashboard.view'
  | 'pdv.use'
  | 'products.manage'
  | 'orders.manage'
  | 'customers.manage'
  | 'inventory.manage'
  | 'financial.view'
  | 'fiscal.manage'
  | 'labels.print'
  | 'marketplace.manage'
  | 'coupons.manage'
  | 'subscriptions.manage'
  | 'settings.manage'
  | 'dev.panel'
  | 'dev.auditLogs'
  | 'dev.users'
  | 'dev.smtp'
  | 'dev.backups';

const ALL: Permission[] = [
  'dashboard.view', 'pdv.use', 'products.manage', 'orders.manage', 'customers.manage',
  'inventory.manage', 'financial.view', 'fiscal.manage', 'labels.print', 'marketplace.manage',
  'coupons.manage', 'subscriptions.manage', 'settings.manage', 'dev.panel', 'dev.auditLogs',
  'dev.users', 'dev.smtp', 'dev.backups',
];

const ADMIN: Permission[] = ALL.filter(p => !p.startsWith('dev.'));
const DEV: Permission[] = ALL;
const SELLER: Permission[] = ['dashboard.view', 'pdv.use', 'orders.manage', 'customers.manage'];

const MATRIX: Record<Role, Permission[]> = {
  admin: ADMIN,
  seller: SELLER,
  dev: DEV,
};

export const hasPermission = (role: Role | string, permission: Permission): boolean => {
  const r = (role as Role) || 'seller';
  return (MATRIX[r] || []).includes(permission);
};

export const permissionsFor = (role: Role | string): Permission[] => MATRIX[(role as Role)] || [];
