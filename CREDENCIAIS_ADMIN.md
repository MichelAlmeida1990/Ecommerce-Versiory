# 🔐 Credenciais de Acesso - Painel Administrativo

## Acesso ao Painel Admin
URL: `/admin.html`

---

## ⚡ Perfil: DESENVOLVEDOR (DEV / SUPORTE)

**Senha:** `devsuporte2026` *(ou variável `VITE_DEV_PASSWORD`)*

### Permissões Exclusivas:
- ✅ **Central do Desenvolvedor (`DevPanel.tsx`)**: Gestão completa de tenants e lojas clientes
- ✅ **Gestão de Assinaturas**: Aprovação, extensão rápida (+7, +15, +30 dias) e cancelamento de planos
- ✅ **Visão Multi-tenant**: Monitoramento de status das lojas (Trial, Ativa, Suspensa, Cancelada)
- ✅ **Métricas SaaS**: Acompanhamento de MRR, lojas ativas e em trial
- ✅ **Auditoria Completa**: Visualização de logs de auditoria (`audit_logs`)
- ✅ **Bypass de Billing**: Acesso irrestrito independente do status de fatura da loja
- ✅ **Acesso Técnico**: Abas exclusivas (Assinaturas, Usuários, Logs, Configurações Técnicas)

### Segurança:
- ⏱️ Sessão limitada a 8 horas com encerramento automático
- 🛡️ Registro de logs de auditoria para todas as operações críticas

---

## 👨‍💼 Perfil: ADMINISTRADOR

**Senha:** `versiory2024`

### Permissões:
- ✅ Dashboard (visão geral e métricas)
- ✅ PDV Loja (vendas presenciais)
- ✅ Produtos (criar, editar, excluir)
- ✅ Categorias (gerenciar categorias)
- ✅ Pedidos (visualizar e gerenciar)
- ✅ Clientes (visualizar dados)
- ✅ Rastreamento (gerenciar envios)
- ✅ Estoque (movimentações e controle)
- ✅ Financeiro (receitas, despesas, lucro)
- ✅ Fiscal/NF-e (emissão de notas fiscais)

---

## 🛒 Perfil: VENDEDOR

**Senha:** `vendedor2024`

### Permissões:
- ✅ PDV Loja (realizar vendas)
- ✅ Produtos (somente consulta - não pode editar)
- ✅ Clientes (consultar dados para vendas)
- ✅ Pedidos (consultar histórico)
- ✅ Fiscal/NF-e (emitir notas fiscais)

### Restrições:
- ❌ Não tem acesso ao Dashboard
- ❌ Não pode criar/editar/excluir produtos
- ❌ Não tem acesso a Categorias
- ❌ Não tem acesso a Rastreamento
- ❌ Não tem acesso a Estoque
- ❌ Não tem acesso ao Financeiro

---

## 📝 Notas Importantes

1. **Sessão Persistente**: O login permanece ativo por 24 horas
2. **Segurança**: Todas as ações são monitoradas
3. **Perfil Vendedor**: Ideal para funcionários que operam o PDV
4. **Perfil Admin**: Acesso completo para gestores

---

## 🚀 Como Usar

1. Acesse `/admin.html`
2. Selecione o perfil (Vendedor, Administrador ou Desenvolvedor)
3. Digite a senha correspondente
4. Clique em "Entrar"

---

**Desenvolvido por Versiory Store** 🎯
