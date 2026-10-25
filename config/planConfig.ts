export type PlanId = 'start' | 'go' | 'max';

export const PLAN_HIERARCHY: Record<PlanId, number> = {
  start: 1,
  go: 2,
  max: 3
} as const;

export const PLAN_MODULES: Record<PlanId, string[]> = {
  start: ['dashboard', 'pdv', 'nfce', 'produtos', 'pedidos', 'etiquetas'],
  go:   ['dashboard', 'pdv', 'nfce', 'produtos', 'pedidos', 'etiquetas', 'usuarios_permissoes', 'clientes', 'estoque', 'financeiro'],
  max:  ['dashboard', 'pdv', 'nfce', 'produtos', 'pedidos', 'etiquetas', 'usuarios_permissoes', 'clientes', 'estoque', 'financeiro', 'curva_abc', 'ecommerce', 'nfe', 'marketplace', 'categorias', 'cupons', 'rastreamento', 'assistente_virtual']
} as const;

export const PLAN_LABELS: Record<PlanId, string> = {
  start: 'Start',
  go: 'Go',
  max: 'Max'
};

export const PLAN_PRICES: Record<PlanId, number> = {
  start: 49.9,
  go: 99.9,
  max: 199.9
};
