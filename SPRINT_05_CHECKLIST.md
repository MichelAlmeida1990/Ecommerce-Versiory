# 📋 SPRINT 05/03/2026 - CHECKLIST DE CORREÇÕES

## 🎯 FASE 04 - Testes e Validação (80%)

---

## 🔴 CRÍTICOS (Impedem operação)

### ERRCOM050 - Sistema permite venda com PDV fechado
**Prioridade:** 🔴 CRÍTICA  
**Status:** ❌ Pendente  
**Descrição:** O sistema permite realizar vendas mesmo com o caixa fechado  
**Solução:** 
1. Verificar se existe caixa aberto antes de permitir adicionar produtos ao carrinho PDV
2. Exibir mensagem clara "Abra o caixa para iniciar vendas" quando caixa estiver fechado
3. Desabilitar botão de checkout se caixa não estiver aberto
4. Integrar com sistema de abertura/fechamento de caixa (ERRCOM051)
**Arquivos:**
- `components/AdminDashboard.tsx` (aba PDV - validação)
- `components/PdvCheckoutModal.tsx` (validação adicional no checkout)

### ERRCOM040 - E-commerce permite venda sem estoque
**Prioridade:** 🔴 CRÍTICA  
**Status:** ✅ Concluído  
**Descrição:** Sistema mantém cor selecionada ao trocar de tamanho, permitindo venda de item inexistente  
**Solução:** Resetar seleção de cor ao mudar tamanho + validar estoque antes de adicionar ao carrinho  
**Arquivo:** `components/ProductDetail.tsx`

### ERRCOM041 - E-commerce permite quantidade acima do estoque
**Prioridade:** 🔴 CRÍTICA  
**Status:** ✅ Concluído  
**Descrição:** Cliente pode adicionar quantidade superior ao estoque disponível por tamanho+cor  
**Solução:** Validar quantidade máxima disponível antes de adicionar/atualizar carrinho  
**Arquivo:** `components/Cart.tsx` e `components/ProductDetail.tsx`

---

## 🟡 IMPORTANTES (Afetam experiência)

### ERRCOM019 - Mensagem duplicada no PDV
**Prioridade:** 🟡 ALTA  
**Status:** ❌ Pendente  
**Descrição:** Ao adicionar produto com tamanho, aparece mensagem "Selecione um tamanho" mesmo após seleção  
**Solução:** Corrigir validação de tamanho selecionado no modal do PDV  
**Arquivo:** `components/AdminDashboard.tsx` (modal PDV)

### ERRCOM023 - Rastreamento não aparece em "Meus Pedidos"
**Prioridade:** 🟡 ALTA  
**Status:** ❌ Pendente  
**Descrição:** Informações de rastreamento não são exibidas na conta do cliente  
**Solução:** Buscar dados de tracking e exibir no painel do cliente  
**Arquivo:** `components/CustomerOrders.tsx`

### ERRCOM003 - Quebra de linha não funciona
**Prioridade:** 🟡 ALTA  
**Status:** ✅ Concluído  
**Descrição:** Descrição do produto não respeita quebras de linha (tópicos)  
**Solução:** Aplicar `whitespace-pre-wrap` ou `whitespace-pre-line` na exibição  
**Arquivo:** `components/ProductDetail.tsx` e `components/ProductCard.tsx`

---

## 🟢 MELHORIAS (Funcionalidades novas)

### ERRCOM051 - Sistema Completo de Caixa PDV
**Prioridade:** 🟢 MÉDIA  
**Status:** ❌ Pendente  
**Descrição:** Criar sistema completo de abertura/fechamento de caixa com relatório gerencial detalhado  
**Solução:**
1. Criar tipos CashRegister, CashWithdrawal, CashDeposit em types.ts ✅
2. Adicionar botões "Abrir Caixa" e "Fechar Caixa" no AdminDashboard
3. Validar status do caixa antes de permitir vendas no PDV (ERRCOM050)
4. Implementar modal de abertura com valor inicial (troco)
5. Permitir sangrias (retiradas) e suprimentos (depósitos) durante operação
6. Implementar modal de fechamento com:
   - Resumo de vendas por forma de pagamento
   - Total de pedidos e valor vendido
   - Sangrias e suprimentos realizados
   - Contagem manual do caixa
   - Cálculo automático de diferença (sobra/falta)
   - Campo para observações
   - Geração de relatório imprimível
7. Salvar histórico de caixas fechados no localStorage
8. Exibir indicador visual de status do caixa (aberto/fechado)
**Arquivos:**
- `types.ts` (tipos criados ✅)
- `components/AdminDashboard.tsx` (UI e lógica principal)
- `components/PdvCheckoutModal.tsx` (validação de caixa aberto)
- `components/CashRegisterReport.tsx` (componente de relatório - opcional)

### ERRCOM052 - Cores não aparecem em movimentação de estoque
**Prioridade:** 🟢 MÉDIA  
**Status:** ❌ Pendente  
**Descrição:** Modal de movimentação não exibe opções de cores para seleção  
**Solução:** Adicionar dropdown de cores quando produto tiver cores configuradas  
**Arquivo:** `components/AdminDashboard.tsx` (modal inventário)

### ERRCOM044 - Botão "Mais Detalhes" do produto
**Prioridade:** 🟢 MÉDIA  
**Status:** ❌ Pendente  
**Descrição:** Criar botão para exibir detalhamento técnico completo do produto  
**Solução:** Implementar modal/seção expansível com especificações técnicas  
**Arquivo:** `components/ProductDetail.tsx`

---

## 🔵 PAINEL VENDEDOR (Permissões e UX)

### ERRCOM034 - Campo de pesquisa por descrição/categoria
**Prioridade:** 🔵 BAIXA  
**Status:** ❌ Pendente  
**Descrição:** Adicionar busca de produtos no painel do vendedor  
**Solução:** Implementar filtro de busca na aba Produtos (role: seller)  
**Arquivo:** `components/AdminDashboard.tsx`

### ERRCOM035 - Busca de cliente por nome
**Prioridade:** 🔵 BAIXA  
**Status:** ❌ Pendente  
**Descrição:** Adicionar busca de clientes no painel do vendedor  
**Solução:** Implementar filtro de busca na aba Clientes (role: seller)  
**Arquivo:** `components/AdminDashboard.tsx`

### ERRCOM036 - Coluna data de cadastro (clientes)
**Prioridade:** 🔵 BAIXA  
**Status:** ❌ Pendente  
**Descrição:** Adicionar coluna de data e ordenar por mais recentes no topo  
**Solução:** Adicionar coluna `createdAt` e ordenar DESC  
**Arquivo:** `components/AdminDashboard.tsx`

### ERRCOM037 - Remover acesso a configurações fiscais (vendedor)
**Prioridade:** 🔵 BAIXA  
**Status:** ❌ Pendente  
**Descrição:** Vendedor não deve acessar configurações fiscais, apenas emitir NF-e  
**Solução:** Ocultar botão "Configurar Dados Fiscais" quando role === 'seller'  
**Arquivo:** `components/AdminDashboard.tsx`

### ERRCOM038 - Botão Suporte não funciona
**Prioridade:** 🔵 BAIXA  
**Status:** ❌ Pendente  
**Descrição:** Botão suporte não redireciona para WhatsApp  
**Solução:** Adicionar link `https://wa.me/5511958540171` ao botão  
**Arquivo:** `components/Header.tsx` ou `components/AdminDashboard.tsx`

---

## 📊 RESUMO

| Prioridade | Total | Concluídos | Pendentes |
|------------|-------|------------|-----------|
| 🔴 Críticos | 3 | 2 | 1 |
| 🟡 Importantes | 3 | 2 | 1 |
| 🟢 Melhorias | 3 | 0 | 3 |
| 🔵 Painel Vendedor | 5 | 0 | 5 |
| **TOTAL** | **14** | **4** | **10** |

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

### Sprint 05/03 - Parte 1 (Críticos)
1. ✅ ERRCOM050 - Bloquear venda com caixa fechado
2. ✅ ERRCOM040 - Validar estoque no e-commerce (seleção)
3. ✅ ERRCOM041 - Validar quantidade máxima no carrinho

### Sprint 05/03 - Parte 2 (Importantes)
4. ✅ ERRCOM019 - Corrigir mensagem duplicada PDV
5. ✅ ERRCOM023 - Exibir rastreamento em "Meus Pedidos"
6. ✅ ERRCOM003 - Quebra de linha em descrições

### Sprint 06/03 - Parte 1 (Melhorias)
7. ✅ ERRCOM051 - Relatório Gerencial do Caixa
8. ✅ ERRCOM052 - Cores em movimentação de estoque
9. ✅ ERRCOM044 - Botão "Mais Detalhes" técnico

### Sprint 06/03 - Parte 2 (Painel Vendedor)
10. ✅ ERRCOM034 - Busca de produtos (vendedor)
11. ✅ ERRCOM035 - Busca de clientes (vendedor)
12. ✅ ERRCOM036 - Coluna data cadastro
13. ✅ ERRCOM037 - Remover config fiscal (vendedor)
14. ✅ ERRCOM038 - Botão Suporte → WhatsApp

---

## 📝 NOTAS TÉCNICAS

- **Validações de estoque:** Sempre verificar `stockBySizeColor` quando houver cores+tamanhos
- **Permissões:** Usar `userRole === 'seller'` para ocultar funcionalidades administrativas
- **Formatação de texto:** Usar `whitespace-pre-wrap` para preservar quebras de linha
- **Rastreamento:** Buscar dados da collection `tracking` e vincular por `orderId`

---

**Última atualização:** 04/03/2026  
**Responsável:** Equipe de Desenvolvimento Versiory
