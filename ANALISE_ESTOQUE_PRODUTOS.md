# Análise de Consistência: Estoque vs Produtos

## Data da Análise
${new Date().toLocaleDateString('pt-BR')}

## Resumo Executivo
A aba de **Estoque** e a aba de **Produtos** estão usando a mesma fonte de dados (`products`), o que é correto. No entanto, existem **inconsistências críticas** na atualização de estoque por tamanho durante vendas no PDV.

---

## ✅ Pontos Positivos

### 1. Fonte de Dados Unificada
- Ambas as abas consultam o array `products` das props
- Mudanças em uma aba refletem na outra automaticamente
- Os cálculos de estatísticas estão corretos

### 2. Cálculos de Inventário Corretos
```typescript
const inventoryStats = useMemo(() => {
  const totalStockValue = products.reduce(
    (sum, product) => sum + (product.price * (product.stock || 0)), 0
  );
  const lowStockItems = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 10).length;
  const outOfStockItems = products.filter(p => (p.stock || 0) === 0).length;
  const totalItemsInStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  return { totalStockValue, lowStockItems, outOfStockItems, totalItemsInStock };
}, [products]);
```
✅ Todos os cálculos estão corretos

### 3. Movimentação Manual de Estoque
A função `handleInventorySubmit` atualiza corretamente tanto `stock` quanto `stockBySize`:
```typescript
if (inventoryForm.selectedSize && product.sizes) {
  // Atualiza stockBySize[tamanho]
  newStockBySize[inventoryForm.selectedSize] = newSizeStock;
  // Atualiza stock geral
  newStock = currentStock + diff;
}
```
✅ Funciona corretamente

---

## ❌ Problemas Críticos Identificados

### 1. **CRÍTICO: PDV não atualiza stockBySize ao vender**

**Localização**: `handlePdvCheckoutSubmit` (linha ~1050)

**Problema**:
```typescript
for (const item of pdvCart) {
  const productIndex = updatedProducts.findIndex(p => p.id === item.product.id);
  if (productIndex !== -1) {
    const p = updatedProducts[productIndex];
    const newStock = Math.max(0, (p.stock || 0) - item.quantity);
    const saved = await saveProduct({ ...p, stock: newStock });
    updatedProducts[productIndex] = saved;
  }
}
```

**Consequência**:
- Quando vende um produto com tamanho "M", diminui o estoque geral
- MAS o `stockBySize.M` continua com o valor antigo
- Isso causa **DESSINCRONIA** entre estoque geral e estoque por tamanho

**Exemplo do problema**:
```
Antes da venda:
- stock: 30
- stockBySize: { P: 10, M: 10, G: 10 }

Venda de 2 unidades tamanho M:
- stock: 28 ✅ (correto)
- stockBySize: { P: 10, M: 10, G: 10 } ❌ (deveria ser M: 8)
```

### 2. **MÉDIO: Relatório CSV não detalha tamanhos**

**Localização**: `generateInventoryReport`

**Problema**:
```typescript
const report = products.map(product => ({
  ID: product.id,
  Produto: product.name,
  Categoria: product.category,
  'Estoque Atual': product.stock || 0,
  'Estoque Minimo': 10,
  'Valor Unitario': product.price.toFixed(2),
  'Valor Total': ((product.stock || 0) * product.price).toFixed(2)
}));
```

**Consequência**:
- O relatório não mostra estoque por tamanho
- Dificulta análise detalhada de produtos com variações

### 3. **BAIXO: Validação de sincronização**

Não existe validação para garantir que:
```typescript
product.stock === sum(Object.values(product.stockBySize))
```

---

## 🔧 Correções Necessárias

### Correção 1: Atualizar stockBySize no PDV (CRÍTICO)

**Substituir** o trecho em `handlePdvCheckoutSubmit`:

```typescript
// ANTES (ERRADO):
for (const item of pdvCart) {
  const productIndex = updatedProducts.findIndex(p => p.id === item.product.id);
  if (productIndex !== -1) {
    const p = updatedProducts[productIndex];
    const newStock = Math.max(0, (p.stock || 0) - item.quantity);
    const saved = await saveProduct({ ...p, stock: newStock });
    updatedProducts[productIndex] = saved;
  }
}

// DEPOIS (CORRETO):
for (const item of pdvCart) {
  const productIndex = updatedProducts.findIndex(p => p.id === item.product.id);
  if (productIndex !== -1) {
    const p = updatedProducts[productIndex];
    let newStock = Math.max(0, (p.stock || 0) - item.quantity);
    let updatedProduct = { ...p, stock: newStock };
    
    // Se tem tamanho selecionado, atualizar stockBySize também
    if (item.selectedSize && p.stockBySize) {
      const currentSizeStock = p.stockBySize[item.selectedSize] || 0;
      const newSizeStock = Math.max(0, currentSizeStock - item.quantity);
      updatedProduct.stockBySize = {
        ...p.stockBySize,
        [item.selectedSize]: newSizeStock
      };
    }
    
    const saved = await saveProduct(updatedProduct);
    updatedProducts[productIndex] = saved;
  }
}
```

### Correção 2: Melhorar relatório CSV

```typescript
const generateInventoryReport = () => {
  const report: any[] = [];
  
  products.forEach(product => {
    if (product.sizes && product.stockBySize) {
      // Produto com tamanhos - uma linha por tamanho
      product.sizes.split(',').forEach(size => {
        const trimmedSize = size.trim();
        const sizeStock = product.stockBySize?.[trimmedSize] || 0;
        report.push({
          ID: product.id,
          Produto: product.name,
          Tamanho: trimmedSize,
          Categoria: product.category,
          'Estoque Atual': sizeStock,
          'Estoque Minimo': 10,
          'Valor Unitario': product.price.toFixed(2),
          'Valor Total': (sizeStock * product.price).toFixed(2)
        });
      });
    } else {
      // Produto sem tamanhos
      report.push({
        ID: product.id,
        Produto: product.name,
        Tamanho: '-',
        Categoria: product.category,
        'Estoque Atual': product.stock || 0,
        'Estoque Minimo': 10,
        'Valor Unitario': product.price.toFixed(2),
        'Valor Total': ((product.stock || 0) * product.price).toFixed(2)
      });
    }
  });
  
  downloadCsv(`relatorio_estoque_${new Date().toISOString().split('T')[0]}.csv`, report);
};
```

### Correção 3: Adicionar validação de sincronização

```typescript
// Adicionar função de validação
const validateStockConsistency = (product: Product): boolean => {
  if (!product.sizes || !product.stockBySize) return true;
  
  const totalBySize = Object.values(product.stockBySize).reduce((sum, qty) => sum + qty, 0);
  const stockGeneral = product.stock || 0;
  
  if (totalBySize !== stockGeneral) {
    console.warn(`Inconsistência detectada no produto ${product.id}:`, {
      stockGeral: stockGeneral,
      somaPorTamanho: totalBySize,
      diferenca: Math.abs(totalBySize - stockGeneral)
    });
    return false;
  }
  
  return true;
};

// Usar no useEffect ou em um botão de diagnóstico
useEffect(() => {
  products.forEach(validateStockConsistency);
}, [products]);
```

---

## 📊 Impacto das Correções

| Correção | Prioridade | Impacto | Esforço |
|----------|-----------|---------|---------|
| Atualizar stockBySize no PDV | 🔴 CRÍTICA | Alto | Médio |
| Melhorar relatório CSV | 🟡 MÉDIA | Médio | Baixo |
| Validação de sincronização | 🟢 BAIXA | Baixo | Baixo |

---

## Conclusão

A estrutura de dados está correta, mas há uma **falha crítica** na atualização de estoque por tamanho durante vendas no PDV. Isso pode causar:

1. Estoque por tamanho incorreto
2. Vendas de tamanhos esgotados
3. Relatórios imprecisos
4. Dificuldade em reposição de estoque

**Recomendação**: Implementar a Correção 1 imediatamente antes de realizar mais vendas no PDV.
