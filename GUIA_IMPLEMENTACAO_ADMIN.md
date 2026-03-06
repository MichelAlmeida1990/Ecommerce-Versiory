# 📋 GUIA DE IMPLEMENTAÇÃO - ADMIN DASHBOARD

## ✅ JÁ IMPLEMENTADO

1. **ERRCOM040** - Validação de estoque no e-commerce ✅
2. **ERRCOM041** - Validação de quantidade máxima no carrinho ✅
3. **ERRCOM003** - Quebra de linha em descrições ✅
4. **ERRCOM023** - Rastreamento em "Meus Pedidos" ✅ (já estava implementado)
5. **CashRegisterReport.tsx** - Componente de relatório criado ✅

---

## 🔧 IMPLEMENTAÇÕES NECESSÁRIAS NO ADMINDASHBOARD.TSX

### 1. ERRCOM050 - Bloquear venda com caixa fechado

**Localização:** Aba PDV (tab === 'pdv')

**Adicionar no início da aba PDV:**
```typescript
const [currentCashRegister, setCurrentCashRegister] = useState<CashRegister | null>(null);

useEffect(() => {
  const loadCashRegister = () => {
    const saved = localStorage.getItem('versiory_current_cash_register');
    if (saved) {
      setCurrentCashRegister(JSON.parse(saved));
    }
  };
  loadCashRegister();
}, []);

// Antes do formulário de adicionar produtos:
{!currentCashRegister || currentCashRegister.status === 'closed' ? (
  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-8 text-center">
    <div className="text-6xl mb-4">🔒</div>
    <h3 className="text-2xl font-black text-amber-900 mb-2">Caixa Fechado</h3>
    <p className="text-amber-700 mb-6">Abra o caixa para iniciar as vendas</p>
    <button
      onClick={() => setIsOpenCashModalOpen(true)}
      className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-black"
    >
      Abrir Caixa
    </button>
  </div>
) : (
  // Formulário existente de PDV
)}
```

---

### 2. ERRCOM019 - Corrigir mensagem duplicada PDV

**Localização:** Modal de adicionar produto no PDV

**Problema:** Validação de tamanho aparece mesmo após seleção

**Solução:** Verificar se `selectedSize` está vazio antes de mostrar erro

```typescript
// No handlePdvAddProduct, trocar:
if (product.sizes && !selectedSize) {
  alert('⚠️ Selecione um tamanho');
  return;
}

// Por:
if (product.sizes && product.sizes.trim() && !selectedSize) {
  alert('⚠️ Selecione um tamanho');
  return;
}
```

---

### 3. ERRCOM052 - Cores em movimentação de estoque

**Localização:** Modal de inventário (isInventoryModalOpen)

**Adicionar após o select de tamanho:**
```typescript
{inventoryForm.productId && products.find(p => p.id === parseInt(inventoryForm.productId))?.colors && (
  <div>
    <label className="block text-sm font-black text-gray-700 mb-2">Cor</label>
    <select
      value={inventoryForm.selectedColor || ''}
      onChange={event => setInventoryForm(prev => ({ ...prev, selectedColor: event.target.value }))}
      className="w-full px-4 py-3 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
      required={!!inventoryForm.selectedSize}
    >
      <option value="">Selecione uma cor</option>
      {products.find(p => p.id === parseInt(inventoryForm.productId))?.colors?.split(',').map(color => {
        const trimmedColor = color.trim();
        const product = products.find(p => p.id === parseInt(inventoryForm.productId));
        const combKey = inventoryForm.selectedSize ? `${inventoryForm.selectedSize}-${trimmedColor}` : '';
        const colorStock = combKey ? product?.stockBySizeColor?.[combKey] || 0 : 0;

        return (
          <option key={trimmedColor} value={trimmedColor}>
            {trimmedColor} {combKey && `(Estoque: ${colorStock})`}
          </option>
        );
      })}
    </select>
  </div>
)}
```

**Atualizar inventoryForm state:**
```typescript
const [inventoryForm, setInventoryForm] = useState({
  productId: '',
  type: 'in' as 'in' | 'out' | 'adjustment',
  quantity: 1,
  reason: '',
  selectedSize: '',
  selectedColor: ''
});
```

---

### 4. ERRCOM051 - Sistema Completo de Caixa

**Adicionar imports:**
```typescript
import { CashRegister, CashWithdrawal, CashDeposit } from '../types';
import CashRegisterReport from './CashRegisterReport';
```

**Adicionar states:**
```typescript
const [currentCashRegister, setCurrentCashRegister] = useState<CashRegister | null>(null);
const [isOpenCashModalOpen, setIsOpenCashModalOpen] = useState(false);
const [isCloseCashModalOpen, setIsCloseCashModalOpen] = useState(false);
const [isCashReportOpen, setIsCashReportOpen] = useState(false);
const [openCashForm, setOpenCashForm] = useState({ initialAmount: 100 });
const [closeCashForm, setCloseCashForm] = useState({ actualAmount: 0, notes: '' });
```

**Adicionar botões no header da aba PDV:**
```typescript
<div className="flex gap-3 mb-6">
  {!currentCashRegister || currentCashRegister.status === 'closed' ? (
    <button
      onClick={() => setIsOpenCashModalOpen(true)}
      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2"
    >
      🔓 Abrir Caixa
    </button>
  ) : (
    <>
      <div className="bg-green-50 border-2 border-green-300 px-6 py-3 rounded-xl flex items-center gap-2">
        <span className="text-green-600 font-black">✅ Caixa Aberto</span>
        <span className="text-green-800 font-bold">
          desde {new Date(currentCashRegister.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <button
        onClick={() => setIsCloseCashModalOpen(true)}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2"
      >
        🔒 Fechar Caixa
      </button>
    </>
  )}
</div>
```

**Funções de abertura e fechamento:**
```typescript
const handleOpenCash = () => {
  const newCashRegister: CashRegister = {
    id: `CASH-${Date.now()}`,
    openedAt: new Date().toISOString(),
    openedBy: userEmail,
    status: 'open',
    initialAmount: openCashForm.initialAmount,
    expectedAmount: openCashForm.initialAmount,
    totalSales: 0,
    totalOrders: 0,
    salesByPayment: { dinheiro: 0, pix: 0, debito: 0, credito: 0 },
    withdrawals: [],
    deposits: []
  };
  
  localStorage.setItem('versiory_current_cash_register', JSON.stringify(newCashRegister));
  setCurrentCashRegister(newCashRegister);
  setIsOpenCashModalOpen(false);
  alert('✅ Caixa aberto com sucesso!');
};

const handleCloseCash = () => {
  if (!currentCashRegister) return;
  
  const difference = closeCashForm.actualAmount - currentCashRegister.expectedAmount;
  
  const closedCashRegister: CashRegister = {
    ...currentCashRegister,
    status: 'closed',
    closedAt: new Date().toISOString(),
    closedBy: userEmail,
    actualAmount: closeCashForm.actualAmount,
    difference,
    notes: closeCashForm.notes
  };
  
  // Salvar no histórico
  const history = JSON.parse(localStorage.getItem('versiory_cash_history') || '[]');
  history.push(closedCashRegister);
  localStorage.setItem('versiory_cash_history', JSON.stringify(history));
  
  // Limpar caixa atual
  localStorage.removeItem('versiory_current_cash_register');
  
  setCurrentCashRegister(closedCashRegister);
  setIsCloseCashModalOpen(false);
  setIsCashReportOpen(true);
};
```

**Atualizar vendas no caixa (no handlePdvCheckout):**
```typescript
if (currentCashRegister && currentCashRegister.status === 'open') {
  const updatedCash = {
    ...currentCashRegister,
    totalSales: currentCashRegister.totalSales + total,
    totalOrders: currentCashRegister.totalOrders + 1,
    expectedAmount: currentCashRegister.expectedAmount + total,
    salesByPayment: {
      ...currentCashRegister.salesByPayment,
      [paymentMethod]: currentCashRegister.salesByPayment[paymentMethod] + total
    }
  };
  localStorage.setItem('versiory_current_cash_register', JSON.stringify(updatedCash));
  setCurrentCashRegister(updatedCash);
}
```

---

### 5. ERRCOM034 - Busca de produtos (vendedor)

**Localização:** Aba Produtos

**Adicionar antes da tabela:**
```typescript
const [productSearch, setProductSearch] = useState('');

const filteredProducts = products.filter(p => 
  p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
  p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
  p.description.toLowerCase().includes(productSearch.toLowerCase())
);

// Input de busca:
<div className="mb-6">
  <input
    type="text"
    value={productSearch}
    onChange={e => setProductSearch(e.target.value)}
    placeholder="🔍 Buscar por nome, categoria ou descrição..."
    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
  />
</div>

// Usar filteredProducts ao invés de products no map
```

---

### 6. ERRCOM035 - Busca de clientes

**Localização:** Aba Clientes

**Similar ao anterior:**
```typescript
const [customerSearch, setCustomerSearch] = useState('');

const filteredCustomers = customers.filter(c => 
  c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
  c.email.toLowerCase().includes(customerSearch.toLowerCase())
);
```

---

### 7. ERRCOM036 - Coluna data de cadastro

**Localização:** Tabela de clientes

**Adicionar coluna:**
```typescript
<th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase">Data Cadastro</th>

// Na linha:
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('pt-BR') : '-'}
</td>

// Ordenar por mais recentes:
const sortedCustomers = [...filteredCustomers].sort((a, b) => 
  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
);
```

---

### 8. ERRCOM037 - Remover config fiscal (vendedor)

**Localização:** Botão "Configurar Dados Fiscais"

**Adicionar condição:**
```typescript
{userRole !== 'seller' && (
  <button
    onClick={() => setIsFiscalConfigOpen(true)}
    className="..."
  >
    Configurar Dados Fiscais
  </button>
)}
```

---

### 9. ERRCOM038 - Botão Suporte WhatsApp

**Localização:** Header ou sidebar

**Adicionar:**
```typescript
<a
  href="https://wa.me/5511958540171"
  target="_blank"
  rel="noopener noreferrer"
  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2"
>
  💬 Suporte
</a>
```

---

### 10. ERRCOM044 - Botão "Mais Detalhes"

**Localização:** ProductDetail.tsx

**Adicionar após descrição:**
```typescript
const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

<button
  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
  className="mt-4 text-versiory-coral font-bold hover:underline flex items-center gap-2"
>
  {showTechnicalDetails ? '▼' : '▶'} Detalhes Técnicos Completos
</button>

{showTechnicalDetails && (
  <div className="mt-6 bg-slate-50 rounded-2xl p-6">
    <h4 className="font-black text-slate-900 mb-4">Especificações Técnicas</h4>
    <div className="grid grid-cols-2 gap-4 text-sm">
      {product.ncm && (
        <div>
          <p className="text-slate-500 font-medium">NCM:</p>
          <p className="font-bold text-slate-900">{product.ncm}</p>
        </div>
      )}
      {product.gtin && (
        <div>
          <p className="text-slate-500 font-medium">Código de Barras:</p>
          <p className="font-bold text-slate-900">{product.gtin}</p>
        </div>
      )}
      {product.peso && (
        <div>
          <p className="text-slate-500 font-medium">Peso:</p>
          <p className="font-bold text-slate-900">{product.peso} kg</p>
        </div>
      )}
      {product.unidade && (
        <div>
          <p className="text-slate-500 font-medium">Unidade:</p>
          <p className="font-bold text-slate-900">{product.unidade}</p>
        </div>
      )}
    </div>
  </div>
)}
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] ERRCOM050 - Bloquear venda com caixa fechado
- [ ] ERRCOM019 - Corrigir mensagem duplicada PDV
- [ ] ERRCOM052 - Cores em movimentação de estoque
- [ ] ERRCOM051 - Sistema completo de caixa
- [ ] ERRCOM034 - Busca de produtos
- [ ] ERRCOM035 - Busca de clientes
- [ ] ERRCOM036 - Coluna data cadastro
- [ ] ERRCOM037 - Remover config fiscal (vendedor)
- [ ] ERRCOM038 - Botão Suporte WhatsApp
- [ ] ERRCOM044 - Botão "Mais Detalhes"

---

## 🎯 ORDEM RECOMENDADA

1. Implementar sistema de caixa (ERRCOM051 + ERRCOM050)
2. Corrigir bugs do PDV (ERRCOM019)
3. Melhorar inventário (ERRCOM052)
4. Adicionar buscas (ERRCOM034, ERRCOM035)
5. Ajustes de UI (ERRCOM036, ERRCOM037, ERRCOM038, ERRCOM044)

---

**Última atualização:** 05/03/2026
