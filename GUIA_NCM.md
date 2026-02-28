# 📚 GUIA COMPLETO: NCM - Nomenclatura Comum do Mercosul

## ✅ IMPLEMENTAÇÃO CONCLUÍDA

O sistema agora possui **sugestão automática de NCM** baseada na categoria do produto!

---

## 🎯 O QUE É NCM?

**NCM** = Nomenclatura Comum do Mercosul

É um código de **8 dígitos** obrigatório para emissão de NF-e que identifica a natureza das mercadorias.

### Formato: `0000.00.00`

**Exemplo:** `6110.20.00` (Blusas de malha de algodão)

---

## 🚀 COMO FUNCIONA NO SISTEMA

### 1. **Sugestão Automática**
Ao cadastrar um produto, o sistema:
- Detecta a categoria selecionada
- Sugere automaticamente NCMs relacionados
- Preenche o campo com a opção mais comum

### 2. **Dropdown Inteligente**
- Lista de NCMs pré-cadastrados por categoria
- Descrição completa de cada código
- Opção de digitar manualmente se necessário

### 3. **Validação**
- Verifica se o NCM tem 8 dígitos
- Alerta visual se estiver incorreto
- Impede emissão de NF-e sem NCM

---

## 📋 NCMs DISPONÍVEIS NO SISTEMA

### ELETRÔNICOS
- `8517.12.31` - Smartphones
- `8471.30.12` - Notebooks e Laptops
- `8528.72.10` - Monitores e TVs LCD/LED
- `8518.21.00` - Caixas de som
- `8518.30.00` - Fones de ouvido
- `8471.60.52` - Teclados
- `8471.60.53` - Mouse
- `8523.51.10` - Pen drives

### MODA - ROUPAS
- `6109.10.00` - Camisetas de malha de algodão
- `6110.20.00` - Blusas/Suéteres de malha de algodão ⭐
- `6110.30.00` - Blusas/Suéteres de fibras sintéticas
- `6203.42.00` - Calças de algodão (masculinas)
- `6204.62.00` - Calças de algodão (femininas)
- `6203.43.00` - Calças jeans (masculinas)
- `6204.63.00` - Calças jeans (femininas)
- `6211.43.00` - Vestidos de fibras sintéticas
- `6115.10.00` - Meias de malha

### MODA - CALÇADOS
- `6403.99.00` - Calçados de couro
- `6404.19.00` - Tênis esportivos
- `6404.11.00` - Calçados esportivos
- `6405.20.00` - Chinelos

### MODA - ACESSÓRIOS
- `4202.22.10` - Bolsas de couro
- `4202.92.00` - Mochilas
- `6505.00.90` - Bonés e chapéus
- `7113.19.00` - Bijuterias
- `9102.11.00` - Relógios de pulso

### CASA - MÓVEIS
- `9403.60.00` - Móveis de madeira
- `9403.70.00` - Móveis de plástico
- `9404.10.00` - Colchões
- `9404.90.00` - Travesseiros

### CASA - UTENSÍLIOS
- `6302.60.00` - Toalhas de banho
- `6302.31.00` - Lençóis de algodão
- `6304.91.00` - Cortinas
- `6911.10.10` - Louças de porcelana
- `7013.37.00` - Copos de vidro
- `8516.60.00` - Fornos elétricos
- `8516.71.00` - Cafeteiras elétricas

### ESPORTES
- `9506.62.00` - Bolas de futebol
- `9506.61.00` - Bolas de tênis
- `9506.91.00` - Equipamentos de musculação
- `9506.70.00` - Patins
- `8712.00.10` - Bicicletas
- `9506.99.00` - Outros artigos esportivos

---

## 🔍 COMO USAR NO SISTEMA

### Passo 1: Cadastrar Produto
1. Vá em **Produtos** → **+ Novo Produto**
2. Preencha nome, categoria, preço, etc.

### Passo 2: Dados Fiscais
3. Role até a seção **"Dados Fiscais (NF-e)"**
4. O sistema já sugeriu um NCM automaticamente!
5. Você pode:
   - ✅ Aceitar a sugestão
   - 🔄 Escolher outro NCM do dropdown
   - ✏️ Digitar manualmente

### Passo 3: Validação
6. O sistema valida se o NCM tem 8 dígitos
7. Exibe alerta se estiver incorreto
8. Salve o produto

---

## ⚠️ IMPORTANTE

### NCM Incorreto Pode Causar:
- ❌ Rejeição da NF-e pela SEFAZ
- ❌ Multas fiscais
- ❌ Problemas com fiscalização
- ❌ Cálculo incorreto de impostos

### Sempre Consulte Seu Contador!
O sistema sugere NCMs comuns, mas **apenas seu contador** pode confirmar o código correto para seu produto específico.

---

## 🆘 DÚVIDAS FREQUENTES

### 1. "Meu produto não se encaixa em nenhum NCM sugerido"
**R:** Digite manualmente ou consulte a tabela completa em:
- https://www.gov.br/receitafederal/pt-br

### 2. "Posso usar o mesmo NCM para produtos similares?"
**R:** Sim, se forem da mesma natureza. Ex: todas as camisetas de algodão podem usar `6109.10.00`

### 3. "E se eu errar o NCM?"
**R:** A SEFAZ pode rejeitar a NF-e. Sempre valide com seu contador antes de emitir em produção.

### 4. "Preciso cadastrar NCM para todos os produtos?"
**R:** SIM! É obrigatório para emissão de NF-e. Produtos sem NCM não poderão gerar nota fiscal.

---

## 🎓 ESTRUTURA DO NCM

### Exemplo: `6110.20.00`

- **61** = Capítulo (Vestuário de malha)
- **10** = Posição (Suéteres, pulôveres, cardigãs)
- **20** = Subposição (De algodão)
- **00** = Item (Especificação)

---

## 📞 RECURSOS ÚTEIS

- **Consulta NCM Oficial:** https://www.gov.br/receitafederal/pt-br
- **Tabela TIPI:** https://www.gov.br/produtividade-e-comercio-exterior/pt-br
- **Seu Contador:** Sempre a melhor fonte!

---

## ✅ CHECKLIST ANTES DE EMITIR NF-e

- [ ] Todos os produtos têm NCM cadastrado
- [ ] NCM validado com contador
- [ ] Origem da mercadoria preenchida (0=Nacional, 1=Estrangeira)
- [ ] CFOP correto (5102 para venda dentro do estado)
- [ ] CST configurado
- [ ] Unidade de medida definida (UN, KG, PC)
- [ ] Dados fiscais da empresa configurados

---

**Sistema pronto para uso! Cadastre seus produtos com NCM e emita NF-e com segurança!** 🎉
