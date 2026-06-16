# 📋 CHECKLIST DE CORREÇÕES - REFCOM

## 🎯 FASE 01 - Correções Críticas e Funcionais

---

## 🔴 CRÍTICOS (Impedem operação correta)

### REFCOM135 - Vendas Parceladas (E-commerce)
**Prioridade:** 🔴 CRÍTICA  
**Status:** 🟡 Parcialmente Implementado  
**Descrição:** Sistema não exibe quantidade de parcelas em vários pontos do e-commerce e admin  
**Pontos identificados:**
- No checkout do site, ao imprimir o CUPOM, não aparece a quantidade de parcela selecionada
- Mensagem WhatsApp não apresenta a quantidade de parcelas selecionada
- Em Meus Pedidos/Histórico/Detalhe do pedido no site, não aparece a quantidade de parcelas
- Na opção "Baixar Recibo" no detalhamento do pedido, não aparece forma de pagamento CRÉDITO nem parcelas
- No detalhamento do pedido no Admin, não aparecem as parcelas da venda e-commerce
- Na impressão do pedido no Admin, não aparece forma de pagamento nem quantidade de parcelas (aparece "A combinar")
- No card Vendas Online no Dashboard, não registra forma de pagamento finalizada em crédito

**Solução:**
1. Garantir que `installments` e `installmentDetails` sejam salvos corretamente no pedido
2. Exibir informações de parcelamento em todos os pontos citados
3. Atualizar card Vendas Online para mostrar forma de pagamento correta

**Arquivos:**
- `components/Checkout.tsx` (salvar parcelas no pedido)
- `components/CustomerOrders.tsx` (exibir parcelas no detalhe)
- `utils/receiptGenerator.ts` (gerar recibo com parcelas)
- `components/AdminDashboard.tsx` (exibir parcelas no admin e impressão)
- `types.ts` (garantir tipos corretos)

---

### REFCOM138 - Divergência de Valores Preço E-commerce
**Prioridade:** 🔴 CRÍTICA  
**Status:** 🟡 Parcialmente Implementado  
**Descrição:** Sistema apresenta valores padrão incorretos do campo Preço E-commerce em 3 pontos  
**Pontos identificados:**
- No detalhe do produto na vitrine do site aparece valor padrão [R$ 559,90] deve aparecer [R$ 355,55]
- No carrinho, o detalhe do produto aparece valor padrão [559,90] errado deve aparecer Preço E-commerce [355,55]
- Na impressão do cupom pelo site o valor do item aparece [459,99] preço do PDV, correto é Preço E-commerce [335,55]

**Solução:**
1. Garantir que `priceEcommerce` seja usado consistentemente em todo o e-commerce
2. Validar que carrinho usa `priceEcommerce` para cálculos
3. Atualizar gerador de cupom para usar preço correto

**Arquivos:**
- `components/ProductDetail.tsx` (exibir priceEcommerce)
- `components/ProductCard.tsx` (exibir priceEcommerce)
- `components/Cart.tsx` (usar priceEcommerce nos cálculos)
- `utils/receiptGenerator.ts` (usar priceEcommerce no cupom)

---

### REFCOM172 - Divergência Saldo Atual na tela do PDV Loja
**Prioridade:** 🔴 CRÍTICA  
**Status:** ❌ Pendente  
**Descrição:** Saldo Atual no PDV apresenta valores incorretos após cancelamentos, especialmente em PIX  
**Cenário identificado:**
- Após vendas em todas finalizadoras, ao tentar cancelar pedido apresenta erro
- Necessário atualizar página para prosseguir com cancelamento
- Venda em dinheiro cancelada é estornada corretamente
- A partir de venda em PIX cancelada, Saldo Atual apresenta divergência
- Leitura X continua correta tanto nas vendas quanto nos estornos
- Divergência ocorre com outras finalizadoras também

**Solução:**
1. Ajustar lógica de cálculo do Saldo Atual no PDV Loja
2. Tratar corretamente cancelamentos e estornos em todas finalizadoras
3. Sincronizar cálculos do PDV com os cálculos da Leitura X

**Arquivos:**
- `components/AdminDashboard.tsx` (lógica de saldo PDV)

---

## 🟡 IMPORTANTES (Afetam experiência)

### REFCOM156 - Clientes: Abertura de Detalhes do Pedido
**Prioridade:** 🟡 ALTA  
**Status:** ❌ Pendente  
**Descrição:** Ao clicar na quantidade de pedidos vinculados ao cliente, sistema não realiza nenhuma ação  
**Impacto:** Lojista não consegue entender histórico de compras do cliente para criar estratégias de vendas  

**Solução:**
1. Ao clicar na quantidade de pedidos → abrir lista de pedidos vinculados ao cliente
2. Ao selecionar um pedido → abrir tela de detalhamento do pedido

**Arquivos:**
- `components/AdminDashboard.tsx` (aba Clientes)

---

### REFCOM166 - Criação do Cadastro de Clientes
**Prioridade:** 🟡 ALTA  
**Status:** ❌ Pendente  
**Descrição:** Não existe tela dedicada para gerenciamento de cadastro de clientes  
**Impacto:**
- Dificuldade em manter dados de clientes atualizados sem interferir em vendas
- Risco de duplicidade de cadastros e inconsistência de informações
- Ao realizar venda e informar CPF/CNPJ ou nome, sistema não carrega dados automaticamente

**Solução:**
1. Criar tela exclusiva para inclusão, edição e gerenciamento de dados cadastrais
2. Integrar com checkout: ao informar CPF/CNPJ ou nome, carregar dados automaticamente
3. Permitir edição de dados sem computar como venda no PDV

**Arquivos:**
- `components/AdminDashboard.tsx` (nova aba Clientes ou modal)
- `types.ts` (tipos de cliente)

---

### REFCOM167 - Pedido: Descrição Orçamento
**Prioridade:** 🟡 ALTA  
**Status:** 🟡 Parcialmente Implementado  
**Descrição:** Indicador "ORÇAMENTO" aparece na frente do número do pedido, mas deveria estar no cabeçalho  
**Impacto:** Não há indicação visual clara para diferenciar pedidos que são Orçamento sem aplicar filtro  

**Solução:**
1. Mover indicador "ORÇAMENTO" para o cabeçalho do grid dos pedidos
2. Garantir exibição clara e visível para referência rápida

**Arquivos:**
- `components/AdminDashboard.tsx` (grid de pedidos)

---

### REFCOM169 - Funcionalidade Retire na Loja no Checkout do Site
**Prioridade:** 🟡 ALTA  
**Status:** ❌ Pendente  
**Descrição:** Não existe opção de Retire na Loja nos dados de entrega do checkout  
**Impacto:** Usuário não consegue optar por retirada na loja com preço diferenciado  

**Solução:**
1. Adicionar opção "Retire na Loja" no checkout
2. Quando selecionado, usar campo Preço PDV Loja (R$) do produto
3. Exibir endereço da loja para retirada com mini tela Google Maps
4. Adicionar parâmetro no cadastro do produto: "Ative Preço Retira na Loja"

**Regra de negócio:**
- Venda finalizada via WhatsApp, PIX, Débito ou Crédito: usar Preço E-commerce
- Opção Retire na Loja: usar Preço PDV Loja

**Arquivos:**
- `components/Checkout.tsx` (adicionar opção Retire na Loja)
- `types.ts` (adicionar campo no tipo Product)
- `components/AdminDashboard.tsx` (cadastro de produto)

---

### REFCOM170 - Duplicidade de Botão Falar do Pedido no Detalhe do Pedido
**Prioridade:** 🟡 ALTA  
**Status:** ❌ Pendente  
**Descrição:** No detalhamento do pedido no e-commerce, existe duplicidade do botão FALAR DO PEDIDO  

**Solução:**
1. Remover botão duplicado
2. Manter apenas um botão de suporte via WhatsApp

**Arquivos:**
- `components/CustomerOrders.tsx` (detalhe do pedido)

---

### REFCOM171 - Impressão em PDF da Leitura X sem Informações
**Prioridade:** 🟡 ALTA  
**Status:** ❌ Pendente  
**Descrição:** PDF da Leitura X não apresenta CANCELAMENTOS, DESCONTOS e DETALHES DO SALDO EM CAIXA  
**Impacto:** Relatório impresso incompleto em relação ao exibido em tela  

**Solução:**
1. Ajustar rotina de geração do PDF para incluir Cancelamentos (valor e quantidade)
2. Incluir Descontos aplicados no período
3. Incluir Detalhes descritivos do saldo em caixa

**Arquivos:**
- `components/AdminDashboard.tsx` (geração de PDF Leitura X)
- `utils/cashReportGenerator.ts` (se existir)

---

### REFCOM173 - Restrição de Atualização de Status para Pedidos de Origem Orçamento
**Prioridade:** 🟡 ALTA  
**Status:** ❌ Pendente  
**Descrição:** Sistema permite atualizar status de pedidos com origem ORÇAMENTO sem conversão em venda  
**Impacto:** Possibilidade de manipulação incorreta de pedidos sem registro de conversão  

**Solução:**
1. Bloquear alteração de status em pedidos com origem ORÇAMENTO
2. Exigir conversão em venda pelo PDV antes de permitir alteração de status
3. Após conversão, permitir atualização para status normais

**Arquivos:**
- `components/AdminDashboard.tsx` (lógica de atualização de status)

---

### REFCOM174 - Ajuste dos Filtros por Tipo e Forma de Pagamento no Financeiro
**Prioridade:** 🟡 ALTA  
**Status:** ❌ Pendente  
**Descrição:** Cards do financeiro não são atualizados consistentemente com transações recentes ao usar filtros  
**Cenários identificados:**
- Filtro período + Forma de pagamento PIX: transações recentes corretas, cards incorretos
- Filtro período + Tipo Despesas: transações recentes corretas, cards incorretos

**Solução:**
1. Aplicar mesmos parâmetros de filtro em transações recentes e cards
2. Garantir consistência entre valores exibidos

**Arquivos:**
- `components/AdminDashboard.tsx` (módulo financeiro)

---

## 🟢 MELHORIAS (Funcionalidades novas)

### REFCOM175 - Ajuste de Idioma nos Campos Origem e Status
**Prioridade:** 🟢 MÉDIA  
**Status:** ❌ Pendente  
**Descrição:** Campos Origem e Status aparecem em inglês em impressões  
**Pontos identificados:**
- Na impressão do recibo PDV Loja, campo Origem aparece em inglês
- Na impressão do pedido, campo Status aparece em inglês

**Solução:**
1. Ajustar rotina de impressão para exibir Origem em português no recibo PDV
2. Ajustar rotina de impressão para exibir Status em português na impressão do pedido

**Arquivos:**
- `utils/receiptGenerator.ts` (recibo PDV)
- `components/AdminDashboard.tsx` (impressão pedido)

---

### REFCOM175 - Estrutura de Configuração – Cadastro de Condições de Pagamento
**Prioridade:** 🟢 MÉDIA  
**Status:** ❌ Pendente  
**Descrição:** Sistema não possui estrutura clara para configuração de condições de pagamento parceladas  
**Impacto:**
- Falta de controle automatizado sobre contas a receber
- Dificuldade em conciliar vendas parceladas com fluxo financeiro real
- Risco de inconsistência entre vendas realizadas e valores recebidos

**Solução:**
1. Criar tela para definir regras de parcelamento (30, 60, 90 dias)
2. Vincular condições ao produto/forma de pagamento
3. Geração automática de contas a receber em ABERTO
4. Baixa com taxa da administradora configurável
5. Suporte para diferentes administradoras (Cielo, Rede, Getnet, Stone)

**Campos necessários:**
- Taxa Débito (%)
- Taxa Crédito à vista (%)
- Taxa Crédito parcelado por número de parcelas (%)
- Taxa PIX (%)
- Taxa antecipação (%)
- Prazo de recebimento (dias)

**Arquivos:**
- `components/AdminDashboard.tsx` (nova aba Configurações Financeiras)
- `types.ts` (tipos de condições de pagamento)
- `services/fiscalConfig.ts` (ou novo service para configurações)

---

## 📊 RESUMO

| Prioridade | Total | Concluídos | Parcial | Pendentes |
|------------|-------|------------|---------|-----------|
| 🔴 Críticos | 3 | 0 | 2 | 1 |
| 🟡 Importantes | 8 | 0 | 1 | 7 |
| 🟢 Melhorias | 2 | 0 | 0 | 2 |
| **TOTAL** | **13** | **0** | **3** | **10** |

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

### Fase 1 - Críticos (Parcelamento e Preços)
1. REFCOM135 - Vendas Parceladas (E-commerce)
2. REFCOM138 - Divergência de Valores Preço E-commerce
3. REFCOM172 - Divergência Saldo Atual PDV

### Fase 2 - Importantes (UX e Funcionalidades)
4. REFCOM156 - Clientes: Abertura de Detalhes do Pedido
5. REFCOM167 - Pedido: Descrição Orçamento
6. REFCOM170 - Duplicidade de Botão Falar do Pedido
7. REFCOM173 - Restrição de Atualização de Status Orçamento
8. REFCOM174 - Ajuste dos Filtros Financeiro
9. REFCOM171 - Impressão PDF Leitura X
10. REFCOM169 - Funcionalidade Retire na Loja

### Fase 3 - Melhorias (Configurações)
11. REFCOM175 - Ajuste de Idioma nos Campos
12. REFCOM166 - Criação do Cadastro de Clientes
13. REFCOM175 - Estrutura de Configuração de Pagamento

---

## 📝 NOTAS TÉCNICAS

- **Preços:** Sempre usar `priceEcommerce` para e-commerce e `pricePOS` para PDV Loja
- **Parcelamento:** Garantir que `installments` e `installmentDetails` sejam salvos e exibidos consistentemente
- **Orçamentos:** Bloquear alteração de status em pedidos `isBudget === true`
- **Filtros Financeiros:** Aplicar mesmos filtros em cards e transações recentes
- **Idioma:** Usar mapeamento de tradução para campos exibidos em impressões

---

**Última atualização:** 16/06/2026  
**Responsável:** Equipe de Desenvolvimento Versiory
