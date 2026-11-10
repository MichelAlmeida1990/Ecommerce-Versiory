# Checklist de Mudanças Propostas / Implementadas

## A. Acesso do Developer (Dev)

### 🔴 P0 — Fundação / Segurança
- [ ] Provisionar contas administrativas no Firebase Auth com custom claims `role` e `tenantId`; senha hardcoded não é mais aceita.
- [ ] Exigir MFA real para `dev` (o antigo campo TOTP local não era um segundo fator; foi removido).
- [ ] Aplicar e testar expiração efetiva de sessão administrativa (a sessão local não é autorização).
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
- [x] Migrar os fluxos ativos de autenticação para Firebase Auth; remover hashes do modelo e scripts de senha padrão.
- [ ] Fazer backup e tratar os hashes/documentos legados no Firestore; nenhuma limpeza remota foi autorizada.
- [x] Recuperação de senha por e-mail via Firebase Auth.
- [x] Restringir gravação de audit logs a usuários autorizados por tenant.
- [ ] Implementar MFA real para `dev`.

### 🔴 P0 — Correção de segurança pré-lançamento (escopo aprovado)

**Objetivo:** remover acessos públicos indevidos e gravações críticas confiadas ao navegador antes de usar dados reais. Manter os IDs/caminhos de tenant existentes (por exemplo, `versiory-demo`); não publicar regras restritas antes de adaptar e testar os fluxos afetados.

**Implementação local aplicada; liberação ainda bloqueada.** Cadastro/login/reset, Rules, callables de catálogo/cupom/checkout/pedidos/rastreamento e painel sem senhas hardcoded foram adaptados. `npm run build` e `npm --prefix functions run build` passaram. `npm run test:rules` não inicia sem Java; `npx tsc --noEmit` encontra 62 erros preexistentes no projeto (incluindo `utils/constants` ausente e `PlanId` duplicado). Nenhuma regra/função foi publicada e nenhum dado remoto foi modificado. Os itens abaixo são gates de validação e implantação, não autorização para publicar.

**Decisão de vitrine:** a página inicial pública é o mostruário comercial da Versiory e deve carregar o catálogo do tenant `versiory-demo`, identificado pelo usuário como a loja de demonstração de `michelpaulo06@hotmail.com`. Não escolher o tenant da vitrine pela sessão local ou impersonação. Lojas clientes devem receber catálogo/URL próprios depois.

**Bloqueio de publicação:** o Firebase CLI autenticado com a conta `contadev506@gmail.com` tentou publicar apenas `getPublicProducts` em `versiory-store`; o deploy foi recusado porque o projeto precisa do plano Blaze para habilitar Artifact Registry. A chamada também tentou habilitar as APIs Cloud Functions, Cloud Build e Artifact Registry; conferir o estado no Console. Nenhuma Function foi publicada por esse comando e nenhuma regra foi implantada. O usuário informou que havia uma expectativa inicial de 4 GB Google Cloud, mas não foi identificado a qual serviço ou oferta essa capacidade se referia.

**Opções registradas (decidir antes de qualquer novo deploy):**
- [ ] Confirmar no Console qual serviço/conta oferecia os “4 GB”; armazenamento disponível não equivale a cota gratuita de execução nem remove o requisito Blaze das Cloud Functions.
- [ ] Se evitar billing for prioridade, avaliar projeção pública Firestore: coleção separada (`storefrontProducts`) contendo somente campos seguros da vitrine, leitura pública e escrita restrita a staff; atualizar a projeção pelos fluxos administrativos e cobrir criação/edição/remoção com testes. Isso pode servir o catálogo público sem callable, dentro das cotas Firestore, mas não substitui backend transacional de checkout/pedidos.
- [ ] Se manter Cloud Functions, habilitar Blaze somente após aprovação do responsável financeiro, configurar alertas de orçamento e revisar limites/custos de Cloud Functions, Cloud Build, Artifact Registry, rede e Firestore. Alertas não são limite rígido de cobrança.
- [ ] Não usar os 4 GB como justificativa para publicar ou ativar billing sem identificar recurso, região, cota e condições da oferta.

#### C.1 Identidade e autenticação
- [ ] Migrar cadastro, login, recuperação e redefinição de senha de clientes para Firebase Authentication.
- [ ] Como as contas atuais são fictícias, recriar contas de teste; não migrar senhas nem hashes do Firestore para produção.
- [ ] Associar o perfil Firestore do cliente ao UID autenticado; remover `password` e hashes do modelo/documentos.
- [ ] Atualizar a loja e o painel para carregar o perfil do cliente autenticado sem listar a coleção `customers` publicamente.
- [ ] Restringir leitura/edição do perfil do cliente ao próprio UID; permitir acesso administrativo somente com tenant e role autorizados.
- [ ] Remover senhas de fallback de vendedor/dev validadas no frontend; exigir Firebase Auth e claims para acesso ao painel.
- [ ] Preservar os `tenantId` e roles dos usuários administrativos; validar login de admin, vendedor e dev após a mudança.

#### C.2 Checkout seguro no backend
- [ ] Configurar Firebase Cloud Functions no projeto, com runtime/dependências suportados e configuração local versionada.
- [ ] Escolher e aprovar modelo de execução/billing após esclarecer a oferta de 4 GB; Functions em Blaze versus projeção pública Firestore para vitrine (esta última não resolve checkout seguro).
- [ ] Implementar função de checkout que aceite compra de visitante e, quando aplicável, identidade Firebase autenticada.
- [ ] Validar no servidor tenant ativo/permitido, campos aceitos, produtos, quantidades, variações, preços, descontos e cupons; não confiar em totais ou estoque calculados no navegador.
- [ ] Calcular valores usando dados atuais do Firestore e validar estoque geral e por tamanho/cor.
- [ ] Gravar pedido, decremento de estoque, uso de cupom, movimento de inventário e agregados do cliente numa operação transacional/atômica.
- [ ] Garantir que falha ou concorrência não deixe pedido sem baixa correspondente nem permita estoque negativo.
- [ ] Validar formato e tamanho dos dados recebidos e adicionar proteção contra abuso (App Check, limites/monitoramento ou controles equivalentes, conforme compatibilidade da loja).
- [ ] Adaptar `Checkout.tsx` para chamar a função e tratar erros sem gravar diretamente pedidos, clientes, cupons ou estoque.
- [ ] Se a campanha `PRIMEIRACOMPRA` for mantida, cadastrá-la como cupom do tenant com limite/eligibilidade definidos; o desconto hardcoded apenas no navegador foi removido.
- [ ] Retornar à loja apenas confirmação e dados mínimos necessários; não expor o documento privado completo do pedido.

#### C.3 Carrinho, rastreamento e dados públicos
- [ ] Manter carrinho de visitante apenas no dispositivo; não usar e-mail como controle de acesso/ID de carrinho remoto.
- [ ] Para clientes autenticados, vincular carrinho ao UID e permitir acesso somente ao proprietário e às roles administrativas autorizadas.
- [ ] Substituir a busca pública de pedido completo por consulta de rastreamento que devolva apenas status e dados de entrega estritamente necessários.
- [ ] Exigir verificação adicional para rastreamento (além de ID previsível do pedido) e limitar tentativas/abuso.
- [ ] Revisar campos do documento de tenant; retirar leitura pública de dados de proprietário, cobrança, contato e anotações de suporte.
- [ ] Separar configuração pública da vitrine (somente campos não sensíveis) dos documentos administrativos do tenant.
- [ ] Rever criação pública de `audit_logs`; exigir autenticação ou encaminhar registros do cliente por backend com validação e limites.

#### C.4 Regras Firestore e isolamento multi-tenant
- [ ] Substituir permissões públicas de leitura/escrita de `orders`, `customers` e `carts` por regras específicas e mínimas.
- [ ] Manter leitura pública apenas dos dados da vitrine que precisam ser públicos (por exemplo, produtos/categorias ativos e campos não sensíveis).
- [ ] Exigir autenticação, `tenantId` correto e role permitida para gravações administrativas; não autorizar escrita somente porque o token contém um tenant.
- [ ] Remover ou restringir a regra genérica de subcoleções; usar allowlist por coleção e negar acesso por padrão.
- [ ] Manter acesso cross-tenant de `dev` explícito, limitado e testado.
- [ ] Lembrar que o Admin SDK das Cloud Functions ignora Firestore Rules: implementar autorização equivalente dentro de cada função.
- [ ] Confirmar no Firebase Console que as regras testadas são as regras publicadas no projeto correto; não fazer publicação manual antes dos gates de teste.

#### C.5 Credenciais, testes e liberação
- [ ] Verificar que chaves de conta de serviço não estejam em Git, frontend, build, relatórios ou diretórios sincronizados/compartilhados; rotacionar credenciais caso tenham sido expostas.
- [ ] Configurar Firebase Emulator Suite e testes automatizados para Firestore Rules e funções.
- [ ] Testar permissões permitidas e negadas para visitante, cliente, admin do próprio tenant, usuário de outro tenant e dev.
- [ ] Cobrir acesso negado a pedidos, clientes, carrinhos e documentos privados de outro usuário/tenant.
- [ ] Cobrir tentativa de escrita de catálogo por usuário sem role autorizada e tentativa de manipular preço, desconto, quantidade ou status de pedido.
- [ ] Testar corrida de duas compras pelo mesmo estoque e falhas no checkout; confirmar consistência de pedido, estoque, cupom e movimento.
- [ ] Testar ponta a ponta: compra visitante, cadastro/login/reset do cliente, carrinho autenticado, painel por role, pedido e rastreamento.
- [ ] Adicionar comandos de teste/typecheck/lint necessários e executar build + testes no CI antes do deploy.
- [ ] Implantar primeiro em ambiente de teste; validar no Console e só liberar produção após todos os testes e revisão do rollback.
- [ ] Atualizar este checklist com evidências/resultados; só marcar itens concluídos após validação reproduzível.

**Critério de saída P0:** nenhum fluxo público lê ou altera documentos privados; pedidos e estoque são validados no servidor; isolamento de tenant/role tem testes positivos e negativos; autenticação de painel e clientes funciona sem fallback de senha local; regras e funções foram verificadas no ambiente de teste.

**Análise detalhada:** [ANALISE_SEGURANCA_E_CHECKLISTS.md](./ANALISE_SEGURANCA_E_CHECKLISTS.md).

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
- Histórico substituído: regras atuais usam UID/claims por tenant; a leitura pública de produtos foi movida para uma projeção sem campos financeiros.
- [x] REFCOM242: "Data da Venda" renomeado para "Data Emissão + hora" no Checkout WhatsApp
- [x] Segunda Loja de Teste: botão "+ Loja de Teste" no DevPanel chama `onboardTenant` (tenant `loja-teste-2`)
- [x] **Bug de tenant em acesso via IP (192.168.x.x):** `getActiveTenantId()` interpretava o IP como subdomínio de tenant → resolvia para `"192"` → 0 produtos. Corrigido: hostnames IP são ignorados no fallback de subdomínio.
- [x] **Diagnóstico de auth/tenant:** logs `[AdminApp]` e `[tenantContext]` adicionados para rastrear UID, claims, tenant ativo e contagem de produtos.
- [x] **Seller salva `tenantId`** na sessão admin (tenant determinístico).
- [x] **Scripts de suporte:** `scripts/listTenantsProducts.cjs` e `scripts/getUidByEmail.cjs` para inspecionar tenants/produtos e UIDs/custom claims.
- **Migração de autenticação administrativa (implementação local):** `AdminApp` exige Firebase Auth e custom claims sem fallback; ainda falta provisionar/verificar claims reais e testar cada role/tenant.
