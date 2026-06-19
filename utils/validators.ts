export const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned.charAt(i)) * (10 - i);
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned.charAt(i)) * (11 - i);
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit === parseInt(cleaned.charAt(10));
};

export const validateCNPJ = (cnpj: string): boolean => {
  // REFCOM180: Ajustar validação para aceitar CNPJ alfanumérico (padrão AA.AAA.AAA/AAAA-DV)
  // Raiz (8 primeiros): letras e números
  // Filial/Ordem (4 seguintes): letras e números
  // Dígito Verificador (2 últimos): numérico
  const cleaned = cnpj.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleaned.length !== 14) return false;

  // Verificar se os últimos 2 caracteres são numéricos (dígito verificador)
  const digits = cleaned.substring(12);
  if (!/^\d{2}$/.test(digits)) return false;

  // Verificar se todos os caracteres são iguais (inválido)
  if (/^([a-zA-Z0-9])\1+$/.test(cleaned)) return false;

  // Para CNPJ alfanumérico, apenas validar formato e dígitos verificadores
  // Converter letras para valores numéricos para cálculo do dígito verificador
  // A=10, B=11, ..., Z=35
  const charToValue = (char: string): number => {
    if (/\d/.test(char)) return parseInt(char);
    return char.charCodeAt(0) - 55; // A=10, B=11, ..., Z=35
  };

  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  let sum = 0;
  let pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += charToValue(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += charToValue(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
};

export const validateCPFOrCNPJ = (doc: string): { valid: boolean; type: 'CPF' | 'CNPJ' | null } => {
  const cleaned = doc.replace(/\D/g, '');
  if (cleaned.length === 11) return { valid: validateCPF(cleaned), type: 'CPF' };
  if (cleaned.length === 14) return { valid: validateCNPJ(cleaned), type: 'CNPJ' };
  return { valid: false, type: null };
};
