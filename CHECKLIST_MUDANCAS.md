# Checklist de Mudanças Propostas / Implementadas

## A. Acesso do Developer (Dev)

### 🔴 P0 — Fundação / Segurança
- [x] Perfil `dev` adicionado (senha `devsuporte2026`, bypass de billing) — `AdminApp.tsx`
- [ ] Migrar autenticação de senha hardcoded para Firebase Auth
- [ ] 2FA (TOTP) obrigatório para `dev`
- [ ] Sessão curta (8h) + reautenticação para ações sensíveis
- [ ] Remover segredos do frontend (SMTP pass, chaves de API) → backend/Cloud Functions
- [ ] Remover senhas do código-fonte e de `CREDENCIAIS_ADMIN.md`
- [ ] Audit Log (`audit_logs`) visível apenas para `dev`
- [ ] Matriz de permissões centralizada (admin/seller/dev)

### 🟠 P1 — Painel do Developer
- [ ] Gestão de Assinaturas (listar lojas, plano, status, expiração; ativar/cancelar/renovar/trocar plano; aprovar comprovante; histórico; alertas de churn)
- [ ] Gestão de Usuários e Lojas (CRUD de contas, reset de senha, bloqueio, impersonation)
- [ ] Configuração de E-mail (SMTP) global + templates transacionais + teste de envio + fila/retry
- [ ] Configurações da Loja (dados, logo, tema, domínio, fuso, moeda, fiscal, certificado A1, CSC, série)
- [ ] Backups (export/import, agendamento, restore com confirmação)
- [ ] Feature Flags / Plan Gating (ligar/desligar módulos por loja/plano, override, tela de upgrade)
- [ ] Abas exclusivas para `dev` (Assinaturas, Usuários, Logs, Config. Técnicas)

### 🟡 P2 — Operação e Observabilidade
- [ ] Logs de erro do frontend + API
- [ ] Saúde das integrações (ML, Shopee, payment, SMTP) com status
- [ ] Métricas de uso (DAU, vendas/dia, pedidos, tempo de resposta)
- [ ] Ferramentas de suporte (busca global, reenvio de e-mail, reprocessar webhook, reemitir NF-e, limpar cache)
- [ ] Comunicação (avisos/banners globais, histórico de notificações)

### 🟢 P3 — Comercial / Analytics
- [ ] Dashboard do Developer (MRR, ARR, churn, LTV, CAC, lojas ativas)
- [ ] Gestão de Planos e Preços (CRUD, versionamento, cupons, trials)
- [ ] Marketplace de integrações (ativar/desativar por loja, logs de sync)

### Quick wins
- [x] `dev` recebe visão de vendedor + bypass de billing (`AdminApp.tsx`)
- [ ] Dar ao `dev` abas exclusivas de suporte
- [ ] Enforçar planos em `usePlanAccess.hasModule` (hoje retorna `true`)
- [ ] Mover SMTP do `localStorage` para Firestore
- [ ] Preencher aba "Assinaturas" com dados reais
- [ ] Documentar perfil `dev` em `CREDENCIAIS_ADMIN.md`

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
- [ ] Filtros avançados (faixa de preço, marca, tamanho, cor)
- [ ] Carrinho drawer com resumo/cupom/frete
- [ ] Página de produto com galeria + zoom + variantes com estoque
- [ ] Trust badges próximos ao CTA
- [ ] Skeleton loading nos cards
- [ ] Seções: Novidades, Mais Vendidos, Vistos recentemente
- [ ] Breadcrumb na página de produto
- [ ] Empty states ilustrados (carrinho vazio)
- [ ] Busca com autocomplete/sugestões
- [ ] Modal mobile: imagem com altura fixa + info scrollável

### 🟢 P2 — Visual
- [ ] PWA / instalável
- [ ] SEO (meta tags, Open Graph, sitemap, URLs amigáveis)
- [ ] Performance (WebP, cache, code-splitting)
- [ ] Categorias com ícones/imagens

---

## C. Segurança (transversal)
- [ ] SHA-256 → bcrypt/Firebase Auth
- [ ] Recuperação de senha por e-mail
- [ ] Logs de auditoria
- [ ] 2FA

---

**Legenda:** [x] implementado · [ ] proposto/pendente
