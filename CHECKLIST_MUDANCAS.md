# Checklist de Mudanças Propostas / Implementadas

## A. Acesso do Developer (Dev)

### 🔴 P0 — Fundação / Segurança
- [x] Perfil `dev` adicionado (senha `devsuporte2026`, bypass de billing) — `AdminApp.tsx`
- [x] Migrar autenticação de senha hardcoded para Firebase Auth (fundação adicionada)
- [x] 2FA (TOTP) obrigatório para `dev`
- [x] Sessão curta (8h) para dev
- [x] Remover segredos do frontend (SMTP pass → Firestore)
- [x] Remover senhas do código-fonte (env vars + fundação Firebase Auth)
- [x] Audit Log (`audit_logs`) visível apenas para `dev`
- [x] Matriz de permissões centralizada (admin/seller/dev)

### 🟠 P1 — Painel do Developer
- [x] **Central do Desenvolvedor (`DevPanel.tsx`)** — aba "⚡ Dev" exclusiva, aberta por padrão no login dev:
  - [x] Cadastro de lojas clientes (tenants): ID único, nome, responsável, e-mail, WhatsApp, plano, valor mensal, dia de vencimento (`tenantService.ts`, coleção `tenants` no Firestore)
  - [x] Status por loja: Trial / Ativa / Suspensa / Cancelada — ativar/suspender com 1 clique
  - [x] Extensão rápida de acesso (+7/+15/+30 dias) — reativa a loja e registra confirmação de pagamento
  - [x] Dados de acesso por loja (senhas 2FA, contas) + anotações de suporte
  - [x] Busca (loja/dono/e-mail) e filtro por status
  - [x] Métricas: MRR das lojas ativas, lojas ativas, em trial, pendências (suspensas + a aprovar)
  - [x] Gestão de solicitações de assinatura da loja virtual: aprovar/renovar por 1 mês (com expiração), excluir
- [x] Gestão de Usuários e Lojas (reset de senha, bloqueio, impersonation)
- [x] Configuração de E-mail (SMTP) global + templates transacionais + teste de envio + fila/retry
- [ ] Configurações da Loja (dados, logo, tema, domínio, fuso, moeda, fiscal, certificado A1, CSC, série)
- [x] Backups (export/import, agendamento, restore com confirmação)
- [x] Feature Flags / Plan Gating (ligar/desligar módulos por loja/plano, override, tela de upgrade)
- [x] Abas exclusivas para `dev` (Assinaturas, Usuários, Logs, Config. Técnicas)

### 🟡 P2 — Operação e Observabilidade
- [ ] Logs de erro do frontend + API
- [ ] Saúde das integrações (ML, Shopee, payment, SMTP) com status
- [ ] Métricas de uso (DAU, vendas/dia, pedidos, tempo de resposta)
- [ ] Ferramentas de suporte (busca global, reenvio de e-mail, reprocessar webhook, reemitir NF-e, limpar cache)
- [ ] Comunicação (avisos/banners globais, histórico de notificações)

### 🟢 P3 — Comercial / Analytics
- [ ] Dashboard do Developer (MRR, ARR, churn, LTV, CAC, lojas ativas) — *parcial: MRR e contagens por status já exibidos no DevPanel*
- [ ] Gestão de Planos e Preços (CRUD, versionamento, cupons, trials)
- [ ] Marketplace de integrações (ativar/desativar por loja, logs de sync)

### Quick wins
- [x] `dev` recebe visão de vendedor + bypass de billing (`AdminApp.tsx`)
- [x] Dar ao `dev` abas exclusivas de suporte
- [x] Enforçar planos em `usePlanAccess.hasModule` (hoje retorna `true`)
- [x] Mover SMTP do `localStorage` para Firestore
- [x] Preencher aba "Assinaturas" com dados reais
- [x] Commit e push no remoto (`main`, commit `fa8a7e8` — feat(dev): Central do Desenvolvedor)
- [x] Documentar perfil `dev` em `CREDENCIAIS_ADMIN.md`

---

## B. Visual do E-commerce (storefront)

### ✅ Implementado
- [x] Card de produto: fundo branco, borda sutil, imagem square com `object-cover` + lazy load
- [x] Badge de desconto automático (-X%)
- [x] Categoria no canto superior direito
- [x] Botão de favorito (coração) funcional com persistência em `localStorage`
- [x] Rating com 5 estrelas
- [x] "Preço Premium" removido; preço protagonista + preço riscado (de/por)
- [x] Botão circular `+` duplicado removido → "Ver detalhes" + "Adicionar"
- [x] Announcement bar (frete grátis + cupom)
- [x] Grid com gap responsivo
- [x] Empty state ilustrado + "Limpar filtros"
- [x] Header: logo responsivo + ícone de busca mobile + drawer de busca
- [x] Modal "Ver detalhes": fundo branco, tipografia ajustada, scroll interno na coluna de info, coração funcional

### 🟡 P1 — Visual
- [x] Filtros avançados (faixa de preço, atalhos de valor, em estoque e ordenação)
- [x] Carrinho drawer com resumo/cupom/frete
- [x] Página de produto com galeria + zoom + variantes com estoque
- [x] Trust badges próximos ao CTA
- [x] Skeleton loading nos cards
- [x] Seções: Novidades, Mais Vendidos, Vistos recentemente
- [x] Breadcrumb na página de produto
- [x] Empty states ilustrados (carrinho vazio e busca sem resultados)
- [x] Busca com autocomplete/sugestões
- [x] Modal mobile: imagem com altura fixa + info scrollável

### 🟢 P2 — Visual
- [ ] PWA / instalável
- [ ] SEO (meta tags, Open Graph, sitemap, URLs amigáveis)
- [ ] Performance (WebP, cache, code-splitting)
- [ ] Categorias com ícones/imagens

---

## C. Segurança (transversal)
- [ ] SHA-256 → bcrypt/Firebase Auth
- [ ] Recuperação de senha por e-mail
- [x] Logs de auditoria
- [ ] 2FA

---

## Infra / Google Cloud (400GB disponível)
- [ ] Migrar imagens de produtos de base64 para Cloud Storage (reduz tamanho do Firestore, melhora performance)
- [ ] Backups automatizados do Firestore para Cloud Storage
- [ ] Backend de e-mail/SMTP em Cloud Run (remover credenciais do frontend)
- [ ] CDN para assets estáticos
- Capacidade estimada: com estrutura atual (Firestore + localStorage), suporta dezenas de lojas pequenas; com Cloud Storage + otimização, centenas. Limitante atual: tamanho do Firestore por loja e base64 de imagens.

## Correções recentes
- [x] Tenant context central (getActiveTenantId) criado — resolve impersonation → sessão → subdomínio → default
- [x] smtpConfig, subscriptionService, sessionsService migrados para tenant path dinâmico
- [x] firebase.ts: default tenantId agora usa getActiveTenantId() (resolveTenant indefinido corrigido)
- [x] Firestore rules: leitura de customers restrita a admin/dev; fallback por UID para coleções admin
- [x] REFCOM242: "Data da Venda" renomeado para "Data Emissão + hora" no Checkout WhatsApp
- [x] Segunda Loja de Teste: botão "+ Loja de Teste" no DevPanel chama `onboardTenant` (tenant `loja-teste-2`)

