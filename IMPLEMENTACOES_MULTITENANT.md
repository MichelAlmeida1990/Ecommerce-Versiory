# VERSIORY STORE — Registro de Implementações e Próximos Passos

**Última atualização:** Novembro 2026  
**Versão do projeto:** 2.9.3

---

## ✅ O QUE FOI FEITO

### [BUGFIX] AdminDashboard.tsx — Tela Branca
- Arquivo estava com 0 bytes (apagado acidentalmente)
- Restaurado do histórico `.history/components/AdminDashboard_20260616130324.tsx`
- Corrigidos 4 erros que causavam tela branca:
  - `showRevenue is not defined` — variável removida mas ainda usada na linha 1057
  - `reserved` faltando em `STATUS_COLORS` e `STATUS_LABELS`
  - `openingAt` não existia no tipo — corrigido para `openedAt`
  - `OrderInstallment` não exportado — removido do import

### [BUGFIX] Role Dev — Redirecionava para Vendedor
- Tipo da prop `userRole` só aceitava `'admin' | 'seller'` — adicionado `'dev'`
- Tab inicial para `dev` corrigida para `settings` (antes ia para `pdv`)
- Título do painel exibe "Suporte Dev" quando role é `dev`
- Tabs visíveis para `dev`: apenas `Configurações | Fiscal/NF-e | Marketplaces`

### [FEAT] Multi-Tenant — Separação de Lojas

#### Firestore
- Todas as coleções migradas da raiz para `tenants/{tenantId}/`
- **2035 documentos** migrados para `tenants/versiory-demo/`
- Coleções migradas:
  - products (53), orders (522), customers (149), categories (14)
  - coupons (1), expenses (12), inventoryMovements (1243)
  - manualRevenues (28), tracking (7), carts (4)
  - adminSessions (1), userSessions (1)
- Documento `tenants/versiory-demo` criado com config da loja

#### firebase.ts — Refatorado
- Todas as funções aceitam `tenantId` como parâmetro opcional
- `DEFAULT_TENANT_ID = 'versiory-demo'` como fallback
- Helper `tenantCol(tenantId, col)` gera o path correto
- Adicionado `getTenantConfig` e `saveTenantConfig`
- `TenantConfig` interface criada
- `signInAdmin` e `signOutAdmin` exportados

#### Regras de Segurança Firestore
- Leitura pública: `products`, `categories`, `coupons`, `tracking`
- Leitura/escrita pública: `customers`, `orders`, `carts` (e-commerce sem login)
- Acesso autenticado por tenant: demais coleções
- Acesso dev cross-tenant: role `dev` acessa qualquer tenant
- Coleções raiz antigas: bloqueadas (`allow read, write: if false`)

#### Firebase Authentication
- Ativado com provedor **E-mail/senha**
- Usuário admin criado: `michelpaulo06@hotmail.com`
- Custom claims definidos via Firebase Admin SDK:
  - `tenantId: 'versiory-demo'`
  - `role: 'admin'`

### [FEAT] Login Admin via Firebase Auth
- `AdminLogin.tsx` — campo de e-mail adicionado para role `admin`
- `AdminApp.tsx` — login admin usa `signInWithEmailAndPassword`
- Seller e Dev continuam com senha local (sem Firebase Auth)
- Logout chama `signOutAdmin()` para invalidar token Firebase
- Erros tratados: `auth/invalid-credential`, `auth/too-many-requests`
- Senha hardcoded `ADMIN_PASSWORD` removida do código

### [FIX] Build — CSS Inline
- `<style>` inline removido do `index.html` e `admin.html`
- `<script type="importmap">` removido do `index.html`
- Estilos migrados para `index.css`
- Build passou sem erros

### [SEC] Segurança
- `serviceAccountKey.json` adicionado ao `.gitignore`
- `versiory-store-firebase-adminsdk-*.json` adicionado ao `.gitignore`
- Regras Firestore fechadas (antes estavam `allow read, write: if true`)

---

## 🔴 PENDENTE — CRÍTICO

### [P1] Permission-Denied no Painel Admin
**Problema:** Após login Firebase Auth, o Firestore ainda bloqueia algumas coleções do admin (`expenses`, `manualRevenues`, `smtpConfig`, `subscriptions`).  
**Causa:** As regras exigem `request.auth.token.tenantId == tenantId` mas o custom claim só é aplicado no próximo login após ser definido. Pode haver delay de propagação.  
**Solução:** Verificar se o token tem os claims corretos e ajustar as regras para aceitar o UID diretamente como fallback.

### [P2] smtpConfig e subscriptionService — Coleções não migradas
**Problema:** `smtpConfig.ts` e `subscriptionService.ts` ainda leem de coleções raiz.  
**Solução:** Migrar para `tenants/{tenantId}/smtpConfig` e `tenants/{tenantId}/subscriptions`.

---

## 🟡 PRÓXIMOS PASSOS — PRIORITÁRIOS

### [REFCOM242] Campos de Data — Contas a Receber
- Renomear campo `Data da Venda` para `Data Emissão + hora` (fixo, não editável)
- Campo `Data de Vencimento` permanece editável
- Notificação WhatsApp deve usar `Data de Vencimento`, não `Data da Venda`

### [FEAT] Segunda Loja de Teste
- Criar `tenants/loja-teste-2` no Firestore
- Criar usuário Firebase Auth para o admin da segunda loja
- Definir custom claims com `tenantId: 'loja-teste-2'`
- Validar isolamento total de dados entre as duas lojas

### [FEAT] Pós-venda — Reorganização de Abas
- Remover aba `Marketplaces` da lista principal
- Criar aba `Pós-venda` com subabas: `Marketplaces | Mensagens | Devoluções | Assinaturas`
- Mover `MarketplaceSettings` para dentro do módulo Pós-venda

---

## 🟢 PRÓXIMOS PASSOS — MELHORIAS

### [FEAT] Onboarding de Nova Loja
- Tela de cadastro que cria automaticamente:
  - Documento `tenants/{tenantId}`
  - Usuário Firebase Auth
  - Custom claims
  - Coleções iniciais (categorias padrão, config)

### [FEAT] Subdomínio por Tenant
- Wildcard DNS `*.versiory.com`
- Frontend detecta `window.location.hostname` e extrai `tenantId`
- Ex: `loja-abc.versiory.com` → `tenantId = 'loja-abc'`

### [FEAT] Login Seller via Firebase Auth
- Criar usuário Firebase Auth para cada vendedor
- Custom claims com `role: 'seller'` e `tenantId`
- Remover senha hardcoded `SELLER_PASSWORD`

### [FEAT] Login Dev via Firebase Auth
- Criar usuário Firebase Auth para suporte dev
- Custom claims com `role: 'dev'` (sem tenantId — acesso cross-tenant)
- Remover senha hardcoded `DEV_PASSWORD`

### [MELHORIA] Migrar Imagens Base64 para Cloud Storage
- Produtos ainda podem ter imagens base64 no Firestore
- Migrar para Cloud Storage com prefixo `{tenantId}/products/{id}`
- Cloudinary já está ativo — novas imagens já vão para lá

### [MELHORIA] Migrar Sessões para Firestore
- `AdminSession` e `UserSession` ainda usam localStorage
- Migrar para `tenants/{tenantId}/sessions/{userId}`
- Permite invalidar sessões remotamente

---

## 📋 CREDENCIAIS E CONFIGURAÇÕES

### Firebase Project
- **Project ID:** `versiory-store`
- **Auth Domain:** `versiory-store.firebaseapp.com`
- **Console:** https://console.firebase.google.com/project/versiory-store

### Tenant Atual
- **Tenant ID:** `versiory-demo`
- **Admin email:** `michelpaulo06@hotmail.com`
- **Firestore path:** `tenants/versiory-demo/`

### Senhas Locais (temporárias — migrar para Firebase Auth)
- **Seller:** `vendedor2024` (variável `VITE_SELLER_PASSWORD`)
- **Dev:** `devsuporte2026` (variável `VITE_DEV_PASSWORD`)

### Deploy
- **Plataforma:** Vercel
- **Repositório:** https://github.com/MichelAlmeida1990/Ecommerce-Versiory
- **Branch principal:** `main`

---

## 🗂️ ARQUIVOS IMPORTANTES

```
services/
  firebase.ts              → funções Firestore multi-tenant
  accountsPayableReceivable.ts → Contas a Receber/Pagar (localStorage)

components/
  AdminDashboard.tsx       → painel admin (restaurado + role dev)
  AdminLogin.tsx           → login com email para admin
  
AdminApp.tsx               → orquestrador do painel admin
firestore.rules            → regras de segurança documentadas
.gitignore                 → chaves de serviço protegidas
```

---

*Documento gerado automaticamente pelo assistente Amazon Q.*
