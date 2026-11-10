# CHECKLIST GERAL — VERSIORY STORE
## Tudo no plano FREE (Spark). Sem Cloud Functions. Sem Blaze.

---

## FASE 0 — Limpeza de dívidas técnicas (1-2 dias)

### 0.1 Remover Cloud Functions (Blaze)
- [ ] Remover `functions/` directory completo
- [ ] Remover seção `functions` de `firebase.json`
- [ ] Remover `firebase-functions` e `firebase-admin` de `functions/package.json`
- [ ] Remover import `getFunctions, httpsCallable` de `services/firebase.ts`
- [ ] Remover `const functions = getFunctions(...)` de `services/firebase.ts`
- [ ] Remover referências a `functions` em `SECURITY-FIXES.md`

### 0.2 Migrar chamadas de Cloud Functions para Firestore direto
- [ ] `getPublicProducts` → `getProducts(tenantId)` já existe via Firestore direto (linha 139)
- [ ] `ensureCustomerProfile` → `saveCustomer()` direto no Firestore
- [ ] `createOrder` → `saveOrder()` direto no Firestore + validação de estoque client-side com `runTransaction`
- [ ] `getMyOrders` → query `orders` filtrando por `customerEmail` ou `uid`
- [ ] `updateMyOrder` → update direto no documento da order com rules de ownership
- [ ] `lookupOrderTracking` → `getOrder()` + `getTrackingItem()` direto
- [ ] `previewCoupon` → `getCoupons()` + validação client-side

### 0.3 Limpar código morto
- [x] Remover `scripts/setDevClaims.cjs` (já executado, claims setados)
- [x] Remover `scripts/getUidByEmail.cjs` (já executado)
- [x] Remover `scripts/migrateTenant.cjs` (migração concluída)
- [x] Remover `scripts/criar_loja_teste.cjs` (onboarding via DevPanel)
- [x] Remover `scripts/seedTenant.cjs` (seed via DevPanel)
- [x] Remover `scripts/create-test-users.cjs` (usuários criados)
- [x] Remover pasta `scripts/` inteira se vazia
- [x] Remover `functions/` se não for mais usado

### 0.4 Corrigir erros de TypeScript existentes
- [x] `utils/constants.ts` — criado com `STORE_WHATSAPP_NUMBER`
- [ ] `types.ts` — resolver `PlanId` duplicate
- [ ] `AdminApp.tsx` — diagnostic logging pode ser removido após validação
- [ ] `tenantContext.ts` — remover logs de debug após validação

### 0.5 Corrigir dev tenantId
- [ ] Mudar `tenantId: ' '` para `tenantId: ''` no usuário dev no Firebase Auth
- [ ] Atualizar `AdminApp.tsx` para tratar dev sem tenantId

---

## FASE 1 — Segurança (Firestore Rules) (2-3 dias)

### 1.1 Regras de produtos e categorias
- [ ] Produtos: leitura pública, escrita apenas admin/seller do tenant
- [ ] Categorias: leitura pública, escrita apenas admin/seller do tenant

### 1.2 Regras de pedidos (orders)
- [ ] Visitante: pode criar pedido com `status: 'pending'` e campos validados
- [ ] Admin/seller do tenant: pode ler/atualizar/deletar pedidos do próprio tenant
- [ ] Cliente autenticado: pode ler apenas seus próprios pedidos (por `uid` ou `customerEmail`)
- [ ] Cliente autenticado: pode atualizar apenas status para `cancelled` ou `return-requested`

### 1.3 Regras de carrinho (carts)
- [ ] Visitante autenticado: pode ler/escrever apenas seu próprio carrinho (por `uid`)
- [ ] Admin/seller: pode ler carrinhos do próprio tenant

### 1.4 Regras de clientes (customers)
- [ ] Visitante autenticado: pode criar seu próprio perfil
- [ ] Cliente autenticado: pode ler/atualizar apenas seu próprio perfil
- [ ] Admin/seller: pode ler todos os clientes do próprio tenant

### 1.5 Regras de tracking
- [ ] Leitura pública por `orderId` + email (para rastreamento de pedidos)
- [ ] Escrita apenas admin/seller do tenant

### 1.6 Regras de cupons
- [ ] Leitura pública (para validação no checkout)
- [ ] Escrita apenas admin/seller do tenant

### 1.7 Testar rules com emulador
- [ ] Instalar Java (para Firestore Emulator)
- [ ] Rodar `npm run test:rules`
- [ ] Criar testes para cada regra acima
- [x] Testes unitários de `tenantContext.ts` — 9/9 passando (tests/tenantContext.test.mjs)

---

## FASE 2 — Checkout seguro sem Cloud Functions (2-3 dias)

### 2.1 Validação de estoque client-side com transaction
- [ ] Implementar `runTransaction` no checkout para verificar estoque
- [ ] Decrementar estoque atomicamente
- [ ] Rollback em caso de falha

### 2.2 Validação de preço client-side
- [ ] Buscar preço real do produto no Firestore antes de criar pedido
- [ ] Calcular total no client com preços do banco
- [ ] Comparar total calculado vs total enviado

### 2.3 Validação de cupom client-side
- [ ] Buscar cupom no Firestore
- [ ] Validar validade, uso máximo, valor mínimo
- [ ] Aplicar desconto calculado no client

### 2.4 Criação de pedido
- [ ] `createCustomerOrder()` → usar `saveOrder()` + `runTransaction` para estoque
- [ ] Gerar ID de pedido único (UUID ou timestamp + random)
- [ ] Salvar pedido com `status: 'pending'`

### 2.5 Integração com WhatsApp
- [ ] Gerar link WhatsApp com resumo do pedido
- [ ] Enviar para número da loja (`STORE_WHATSAPP_NUMBER`)

---

## FASE 3 — Migração de imagens para Firebase Storage (1-2 dias)

### 3.1 Configurar Firebase Storage
- [ ] Adicionar `getStorage` ao `services/firebase.ts`
- [ ] Criar regras de Storage (leitura pública, escrita apenas admin/seller do tenant)

### 3.2 Migrar upload de imagens
- [ ] Substituir Cloudinary por Firebase Storage em `uploadImageObj()`
- [ ] Manter Cloudinary como fallback (opcional)
- [ ] Testar upload de produto com imagem

### 3.3 Migrar imagens existentes (opcional)
- [ ] Script para migrar imagens do Cloudinary para Firebase Storage
- [ ] Atualizar URLs nos documentos de produtos

---

## FASE 4 — Autenticação de clientes (1-2 dias)

### 4.1 Migrar clientes para Firebase Auth
- [ ] Remover campo `password` de `Customer` type
- [ ] Usar `createUserWithEmailAndPassword` no registro
- [ ] Usar `signInWithEmailAndPassword` no login
- [ ] Manter `ensureCustomerProfile` como criação de perfil no Firestore

### 4.2 Restringir acesso a dados de clientes
- [ ] Regras de `customers` baseadas em `uid` do Firebase Auth
- [ ] Regras de `orders` baseadas em `uid` ou `customerEmail`
- [ ] Regras de `carts` baseadas em `uid`

---

## FASE 5 — Funcionalidades restantes (2-3 dias)

### 5.1 Rastreamento de pedidos
- [ ] `lookupOrderTracking` → query direta no Firestore
- [ ] Validar `orderId` + `email` no client
- [ ] Buscar tracking item vinculado

### 5.2 Cancelamento e devolução de pedidos
- [ ] `updateCustomerOrder` → update direto no documento
- [ ] Validar ownership (cliente só pode cancelar seus próprios pedidos)
- [ ] Atualizar estoque ao cancelar

### 5.3 Cupons
- [ ] `previewCoupon` → query direta + validação client-side
- [ ] Validar: ativo, dentro da validade, uso máximo, valor mínimo
- [ ] Incrementar contador de uso

### 5.4 Notificações por email (opcional, free)
- [ ] Usar EmailJS ou Firebase Extension (Trigger Email) — ambos free tier
- [ ] Email de confirmação de pedido
- [ ] Email de atualização de status

---

## FASE 6 — Polimento e testes (1-2 dias)

### 6.1 Build e typecheck
- [x] `npm run build` sem erros
- [ ] `npx tsc --noEmit` sem erros (erros pré-existentes em types.ts, PlanGuard, AdminDashboard)
- [ ] `npm run lint` sem erros

### 6.2 Testes
- [ ] Testes de regras do Firestore (`npm run test:rules`)
- [x] Testes unitários de serviços críticos (tenantContext: 9/9 passando)
- [ ] Teste manual de fluxo completo: cadastro → login → compra → rastreamento

### 6.3 Limpeza final
- [ ] Remover logs de debug de `AdminApp.tsx`, `tenantContext.ts`
- [ ] Remover código morto e imports não usados
- [ ] Atualizar documentação (README, CHECKLIST_MUDANCAS.md)

### 6.4 Deploy
- [ ] Deploy das rules: `firebase deploy --only firestore:rules`
- [ ] Deploy do frontend (Vercel/Netlify — free tier)
- [ ] Verificar que tudo funciona em produção

---

## RESUMO DE CUSTOS (tudo FREE)

| Serviço | Plano | Limite Free |
|---------|-------|-------------|
| Firebase Auth | Spark | 10K verificações/mês |
| Firestore | Spark | 1GB storage, 50K reads/dia, 20K writes/dia |
| Firebase Storage | Spark | 5GB storage, 1GB download/dia |
| Firebase Hosting | Spark | 10GB/mês transferência |
| Vercel/Netlify | Free | 100GB/mês bandwidth |
| Cloudinary | Free | 25GB storage, 25GB bandwidth/mês |

**Total: $0/mês** ✅

---

## ORDEM DE EXECUÇÃO RECOMENDADA

1. **FASE 0** (limpeza) → 1-2 dias
2. **FASE 1** (segurança/rules) → 2-3 dias
3. **FASE 2** (checkout seguro) → 2-3 dias
4. **FASE 3** (imagens Storage) → 1-2 dias
5. **FASE 4** (auth clientes) → 1-2 dias
6. **FASE 5** (funcionalidades) → 2-3 dias
7. **FASE 6** (polimento/deploy) → 1-2 dias

**Total estimado: 10-15 dias de trabalho**

---

## ARQUIVOS CRÍTICOS A MODIFICAR

| Arquivo | Mudança |
|---------|---------|
| `services/firebase.ts` | Remover functions, migrar para Firestore direto |
| `firestore.rules` | Reescrever com regras seguras por collection |
| `types.ts` | Remover `password` de Customer, fix PlanId duplicate |
| `AdminApp.tsx` | Remover logs de debug |
| `tenantContext.ts` | Remover logs de debug |
| `firebase.json` | Remover seção functions |
| `package.json` | Remover firebase-functions, firebase-admin (se não usado) |
, "filePath">
C:\Users\miche\OneDrive\Área de Trabalho\copy-of-versiory-store---transformando-ideias-em-sucesso\CHECKLIST_GERAL.md