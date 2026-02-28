// Base de NCMs mais comuns por categoria

export interface NCMOption {
  code: string;
  description: string;
  category: string;
}

export const NCM_DATABASE: NCMOption[] = [
  // ELETRÔNICOS
  { code: '8517.12.31', description: 'Smartphones', category: 'Eletrônicos' },
  { code: '8471.30.12', description: 'Notebooks e Laptops', category: 'Eletrônicos' },
  { code: '8528.72.10', description: 'Monitores e TVs LCD/LED', category: 'Eletrônicos' },
  { code: '8518.21.00', description: 'Caixas de som', category: 'Eletrônicos' },
  { code: '8518.30.00', description: 'Fones de ouvido', category: 'Eletrônicos' },
  { code: '8471.60.52', description: 'Teclados', category: 'Eletrônicos' },
  { code: '8471.60.53', description: 'Mouse', category: 'Eletrônicos' },
  { code: '8523.51.10', description: 'Pen drives', category: 'Eletrônicos' },
  { code: '8504.40.10', description: 'Carregadores', category: 'Eletrônicos' },
  { code: '8507.60.00', description: 'Baterias de lítio', category: 'Eletrônicos' },

  // MODA - ROUPAS
  { code: '6109.10.00', description: 'Camisetas de malha de algodão', category: 'Moda' },
  { code: '6110.20.00', description: 'Blusas/Suéteres de malha de algodão', category: 'Moda' },
  { code: '6110.30.00', description: 'Blusas/Suéteres de fibras sintéticas', category: 'Moda' },
  { code: '6203.42.00', description: 'Calças de algodão (masculinas)', category: 'Moda' },
  { code: '6204.62.00', description: 'Calças de algodão (femininas)', category: 'Moda' },
  { code: '6203.43.00', description: 'Calças jeans (masculinas)', category: 'Moda' },
  { code: '6204.63.00', description: 'Calças jeans (femininas)', category: 'Moda' },
  { code: '6211.43.00', description: 'Vestidos de fibras sintéticas', category: 'Moda' },
  { code: '6204.42.00', description: 'Vestidos de algodão', category: 'Moda' },
  { code: '6115.10.00', description: 'Meias de malha', category: 'Moda' },

  // MODA - CALÇADOS
  { code: '6403.99.00', description: 'Calçados de couro', category: 'Moda' },
  { code: '6404.19.00', description: 'Tênis esportivos', category: 'Moda' },
  { code: '6404.11.00', description: 'Calçados esportivos', category: 'Moda' },
  { code: '6405.20.00', description: 'Chinelos', category: 'Moda' },

  // MODA - ACESSÓRIOS
  { code: '4202.22.10', description: 'Bolsas de couro', category: 'Moda' },
  { code: '4202.92.00', description: 'Mochilas', category: 'Moda' },
  { code: '6505.00.90', description: 'Bonés e chapéus', category: 'Moda' },
  { code: '7113.19.00', description: 'Bijuterias', category: 'Moda' },
  { code: '9102.11.00', description: 'Relógios de pulso', category: 'Moda' },

  // CASA - MÓVEIS
  { code: '9403.60.00', description: 'Móveis de madeira', category: 'Casa' },
  { code: '9403.70.00', description: 'Móveis de plástico', category: 'Casa' },
  { code: '9404.10.00', description: 'Colchões', category: 'Casa' },
  { code: '9404.90.00', description: 'Travesseiros', category: 'Casa' },

  // CASA - UTENSÍLIOS
  { code: '6302.60.00', description: 'Toalhas de banho', category: 'Casa' },
  { code: '6302.31.00', description: 'Lençóis de algodão', category: 'Casa' },
  { code: '6304.91.00', description: 'Cortinas', category: 'Casa' },
  { code: '6911.10.10', description: 'Louças de porcelana', category: 'Casa' },
  { code: '7013.37.00', description: 'Copos de vidro', category: 'Casa' },
  { code: '8516.60.00', description: 'Fornos elétricos', category: 'Casa' },
  { code: '8516.71.00', description: 'Cafeteiras elétricas', category: 'Casa' },

  // ESPORTES
  { code: '9506.62.00', description: 'Bolas de futebol', category: 'Esportes' },
  { code: '9506.61.00', description: 'Bolas de tênis', category: 'Esportes' },
  { code: '9506.91.00', description: 'Equipamentos de musculação', category: 'Esportes' },
  { code: '9506.11.00', description: 'Esquis', category: 'Esportes' },
  { code: '9506.70.00', description: 'Patins', category: 'Esportes' },
  { code: '8712.00.10', description: 'Bicicletas', category: 'Esportes' },
  { code: '9506.99.00', description: 'Outros artigos esportivos', category: 'Esportes' },

  // GENÉRICO
  { code: '3926.90.90', description: 'Outros artigos de plástico', category: 'Outros' },
  { code: '4911.91.00', description: 'Impressos diversos', category: 'Outros' },
  { code: '9619.00.00', description: 'Fraldas', category: 'Outros' }
];

export const getNCMsByCategory = (category: string): NCMOption[] => {
  return NCM_DATABASE.filter(ncm => 
    ncm.category.toLowerCase() === category.toLowerCase()
  );
};

export const searchNCM = (query: string): NCMOption[] => {
  const lowerQuery = query.toLowerCase();
  return NCM_DATABASE.filter(ncm =>
    ncm.code.includes(lowerQuery) ||
    ncm.description.toLowerCase().includes(lowerQuery) ||
    ncm.category.toLowerCase().includes(lowerQuery)
  );
};

export const getDefaultNCMForCategory = (category: string): string => {
  const ncms = getNCMsByCategory(category);
  return ncms.length > 0 ? ncms[0].code : '3926.90.90'; // Genérico como fallback
};
