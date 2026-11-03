# Plano Multi-Tenant — Separação de Lojas

## Objetivo
Suportar muitas lojas (tenants) com isolamento total de dados, conteúdo e configurações, sem mistura entre clientes.

## Estratégia Recomendada: Multi-Tenant com Tenant ID

### 1. Identificação do Tenant
- Cada loja tem um `tenantId` único (slug), ex.: `loja-abc`.
- Usuário logado carrega `tenantId` na sessão.
- Todas as operações de dados filtram por `tenantId`.

### 2. Isolamento de Dados (Firestore)
- Opção A (recomendada): coleções por tenant: `tenants/{tenantId}/products`, `tenants/{tenantId}/orders`, etc.
- Opção B: coleção única com campo `tenantId` + regras de segurança Firestore filtrando por `request.auth.token.tenantId`.
- Usar Opção A para simplicidade e performance; Opção B se preferir queries cross-tenant (admin global).

### 3. Storage (Imagens)
- Bucket por tenant ou prefixo: `gs://bucket/{tenantId}/products/...`.
- Regras de segurança do Storage filtrando por tenant.

### 4. Autenticação
- Firebase Auth com custom claims: `tenantId` e `role` (admin/seller/dev).
- Dev (superadmin) tem acesso cross-tenant.

### 5. Frontend
- Roteamento por subdomínio ou path: `loja-abc.versiory.com` ou `versiory.com/loja-abc`.
- Storefront lê `tenantId` do contexto e carrega apenas dados daquela loja.

### 6. Configurações por Loja
- Cada tenant tem seu próprio documento em `tenants/{tenantId}/config` (logo, tema, domínio, SMTP, etc.).
- Feature flags e planos por tenant (já existe DevPanel).

### 7. Capacidade
- Com Firestore + Cloud Storage: centenas de lojas pequenas/médias.
- Limitante: tamanho do documento Firestore (1MB) — evitar base64 (migrar para Storage).
- Para milhares de lojas: considerar sharding ou banco dedicado por tier.

### 8. Migração do Estado Atual
- Hoje os dados ficam em localStorage (monousuário). Migrar para Firestore com tenantId.
- Criar script de migração: ler localStorage → criar tenant → gravar no Firestore.

### 9. Segurança
- Regras Firestore: `allow read, write: if request.auth.token.tenantId == tenantId || request.auth.token.role == 'dev'`.
- Nunca confiar em tenantId vindo do cliente sem validação no backend.

### 10. Próximos Passos
1. Adicionar `tenantId` ao modelo de usuário e sessão.
2. Refatorar serviços (firebase.ts) para filtrar por tenantId.
3. Migrar imagens para Cloud Storage.
4. Implementar roteamento por tenant no storefront.
5. Testar isolamento com 2 lojas de teste.
