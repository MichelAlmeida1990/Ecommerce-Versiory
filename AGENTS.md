# PLANO DE TRABALHO — VERSIORY STORE

Este documento define o fluxo obrigatório para todo trabalho no projeto Versiory. Todas as alterações de código, configuração, segurança e infraestrutura devem passar pelas skills e agentes instalados.

---

## 1. PRINCÍPIOS OBRIGATÓRIOS

- **100% FREE tier (Spark plan)** — Nunca usar Cloud Functions/Blaze. Substituir por Firestore Rules + Firebase Auth + client-side `runTransaction`.
- **Multi-tenant isolado** — Todos os dados em `tenants/{tenantId}/...`. Nunca vazar dados entre tenants.
- **Firebase Auth para tudo** — Admin, seller, dev e clientes usam Firebase Auth com custom claims `{tenantId, role}`. Zero senhas hardcoded.
- **Segurança primeiro** — `firestore.rules` deve ser auditado antes de qualquer deploy. `orders`, `carts`, `customers` nunca públicos.

---

## 2. FLUXO OBRIGATÓRIO PARA CADA TAREFA

Toda feature, bug fix ou refatoração deve seguir esta ordem:

```
1. /brainstorming     → Definir solução e alternativas
2. /plan              → Criar plano detalhado com checklist
3. Implementar        → Código usando os agentes certos
4. /tdd               → Se houver lógica crítica, escrever teste primeiro
5. /security-auditor  → Auditar regras de Firestore e auth (SE tocar em segurança)
6. /review            → Revisar qualidade do código antes de commit
7. /verify            → Confirmar build, typecheck, testes
8. /finish            → Merge, PR ou cleanup da branch
```

---

## 3. AGENTES CUSTOMIZADOS E QUANDO USAR

Definidos em `~/.config/kilo/kilo.jsonc`:

| Agente | Quando usar | Modelo |
|--------|-------------|--------|
| `security-auditor` | Qualquer mudança em `firestore.rules`, `services/firebase.ts`, auth, multi-tenant isolation | Claude Sonnet 4 |
| `checkout-implementer` | Checkout, criação de pedidos, validação de estoque, cupons, carrinho | Claude Opus 4 |
| `test-engineer` | Testes de regras Firestore, testes de integração, TDD | Claude Sonnet 4 |

### Como invocar:
No chat do Kilo, mencionar o agente:
- `@security-auditor revise as regras de firestore.rules`
- `@checkout-implementer implemente checkout seguro sem Cloud Functions`
- `@test-engineer escreva testes para as regras de segurança`

---

## 4. SKILLS INSTALADAS E COMO USAR

Instaladas em `.agents/skills/`:

| Skill | Comando | Para que serve |
|-------|---------|----------------|
| `brainstorming` | `/brainstorming` | Explorar soluções antes de codificar |
| `test-driven-development` | `/tdd` | Escrever teste → código → refatorar |
| `systematic-debugging` | `/debug` | Depuração em 4 fases |
| `writing-plans` | `/plan` | Criar plano de implementação |
| `executing-plans` | `/execute` | Executar plano passo a passo |
| `requesting-code-review` | `/review` | Revisar qualidade antes de commit |
| `verification-before-completion` | `/verify` | Confirmar que está pronto |
| `finishing-a-development-branch` | `/finish` | Merge, PR ou cleanup |
| `security-audit` | (via agente security-auditor) | Auditoria de segurança multi-fase |
| `agent-skills` (addyosmani) | — | Workflows de engenharia (define → plan → build → verify → review → ship) |

---

## 5. CHECKLIST DE SEGURANÇA (P0 — OBRIGATÓRIO)

Antes de qualquer alteração que toque em dados:

- [ ] `firestore.rules` revisado pelo `security-auditor`
- [ ] Nenhuma collection pública (`orders`, `carts`, `customers`) sem restrição de auth
- [ ] Isolamento de tenant verificado: queries sempre filtram por `tenantId`
- [ ] Firebase Auth usado (não senhas hardcoded)
- [ ] Custom claims `{tenantId, role}` válidos
- [ ] Sem Cloud Functions (apenas Spark plan)

---

## 6. ARQUIVOS CRÍTICOS

| Arquivo | Propósito | Quem pode editar |
|---------|-----------|------------------|
| `firestore.rules` | Regras de segurança do Firestore | Apenas com aprovação do `security-auditor` |
| `services/firebase.ts` | Conexão Firebase, helpers, upload de imagem | `checkout-implementer`, `security-auditor` |
| `services/tenantContext.ts` | Resolução do tenant ativo | `security-auditor` |
| `services/tenantService.ts` | Onboarding de tenants, adminUid | `checkout-implementer` |
| `~/.config/kilo/kilo.jsonc` | Config de agentes e MCP | Apenas o desenvolvedor principal |
| `CHECKLIST_GERAL.md` | Checklist de 6 fases do projeto | Atualizado a cada fase concluída |

---

## 7. COMO INICIAR UMA NOVA FEATURE

Exemplo: "Implementar checkout seguro"

```
1. Abrir chat do Kilo
2. @brainstorming — discutir abordagem (Firestore transaction vs Cloud Function)
3. @plan — criar plano com CHECKLIST_GERAL.md (Fase 2: checkout seguro)
4. @checkout-implementer — implementar saveOrder + runTransaction + validação
5. @security-auditor — revisar firestore.rules para orders e carts
6. @test-engineer — escrever testes de regras para orders/carts
7. /review — revisar código
8. /verify — npm run build, tsc, testes
9. /finish — merge na branch main
```

---

## 8. REGRAS DE OURO

1. **Nunca pule a auditoria de segurança** quando tocar em `firestore.rules` ou `services/firebase.ts`.
2. **Nunca use Cloud Functions** — Spark plan não suporta. Use Firestore Rules + client-side transactions.
3. **Sempre use Firebase Auth** — zero senhas hardcoded no código.
4. **Sempre isole por tenant** — todas as queries incluem `tenantId`.
5. **Sempre verifique antes de finalizar** — `/verify` e `/finish` são obrigatórios.

---

Salvo em: `AGENTS.md` (memória persistente para sessões futuras do Kilo).