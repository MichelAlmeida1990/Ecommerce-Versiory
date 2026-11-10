# Status das correções de segurança

## Implementação local

O fluxo novo usa Firebase Authentication para cadastro/login de clientes, verificação de e-mail e redefinição de senha. Os perfis novos são identificados por UID; senhas e hashes não fazem parte do modelo `Customer`. O login do painel exige Firebase Auth e custom claims `role` e `tenantId` (exceto `dev`).

O checkout, atualização/cancelamento de pedidos e consulta de rastreamento foram movidos para Cloud Functions. O checkout valida os dados e atualiza pedido, estoque, cupom, movimento de inventário e agregados do cliente em transação. A prévia de cupom também usa callable e só retorna campos mínimos; o uso e o valor são revalidados no checkout. As Rules locais negam acesso público a pedidos, perfis, carrinhos, rastreamento, cupons, tenant e documentos internos de produtos; catálogo e categorias públicos expõem somente os dados previstos para a vitrine.

## Validação e limites atuais

- Nenhuma regra ou função foi publicada e nenhum dado remoto foi modificado.
- Foi tentada a publicação isolada de `getPublicProducts` (`firebase deploy --only functions:getPublicProducts --project versiory-store`); o CLI recusou por exigir Blaze/Artifact Registry. O CLI também tentou habilitar APIs Cloud Functions, Cloud Build e Artifact Registry; conferir o estado dessas APIs no Console. Nenhuma Function ou Rule foi publicada.
- A vitrine principal está fixada localmente no tenant `versiory-demo`, confirmado pelo usuário como tenant de demonstração. O catálogo seguirá indisponível até a callable estar publicada ou ser substituída por outra solução pública segura.
- O relato de “4 GB do Google Cloud” ainda não foi associado a um serviço, cota ou crédito específico. Não presumir que isso habilite Functions ou evite billing.
- `npm run build` e `npm --prefix functions run build` passaram localmente. O Vite ainda reporta chunks grandes e imports estáticos/dinâmicos duplicados.
- `npx tsc --noEmit` continua falhando por problemas preexistentes do projeto, incluindo `utils/constants` ausente e `PlanId` duplicado; não foram ampliados como parte desta correção.
- `npm run test:rules` está configurado, mas depende de Java para iniciar o Firestore Emulator. Até instalar Java e executar esses testes, as Rules não estão validadas.
- O deploy depende da configuração/verificação dos custom claims administrativos, do tenant ativo, dos templates de e-mail e da configuração antiabuso/App Check.
- Antes de insistir em Functions, decidir entre Blaze com revisão de custos/alertas e a projeção pública Firestore com campos allowlisted para apenas o catálogo. A projeção não substitui o backend seguro de checkout.
- O desconto local hardcoded `PRIMEIRACOMPRA` foi removido para não prometer um desconto que o servidor não concede. Para reativá-lo, cadastrar o cupom no tenant e definir limite/eligibilidade no painel.
- Documentos legados no Firestore podem ainda conter hashes de senha. Não serão removidos automaticamente nesta implementação local; qualquer limpeza remota exige backup e autorização explícita.
- A instalação/atualização de dependências reportou 21 vulnerabilidades (15 moderadas e 6 altas); não foi executado `npm audit fix`.

## Próximos gates

1. Executar os testes de Rules e testes de integração das Functions no Emulator Suite.
2. Configurar e validar contas de admin/vendedor/dev com claims e tenant corretos.
3. Decidir, com backup, como remover os campos `password`/hashes legados sem perder dados que ainda sejam necessários.
4. Validar o fluxo completo num projeto Firebase de teste, incluindo concorrência de estoque, cupom, cadastro, login, reset e rastreamento.
5. Publicar somente após revisar as regras efetivas no Console e preparar rollback.

Não utilizar scripts antigos de SHA-256/default password. Firebase Authentication é a única fonte de autenticação para clientes e painel.
