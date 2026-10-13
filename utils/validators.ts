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
  const cleaned = doc.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleaned.length === 11) return { valid: validateCPF(cleaned), type: 'CPF' };
  if (cleaned.length === 14) return { valid: validateCNPJ(cleaned), type: 'CNPJ' };
  return { valid: false, type: null };
};

// REFCOM240: Data de Nascimento no e-commerce (Minha Conta > Meu Perfil).
// O campo é digitado em DD/MM/AAAA, mas gravado sempre em YYYY-MM-DD, formato
// canônico usado pelo ADM, pelo Checkout, pelo PDV e pelo filtro de aniversariantes.

/** Aplica a máscara DD/MM/AAAA conforme o usuário digita. */
export const maskBirthDate = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

/** Converte DD/MM/AAAA (ou YYYY-MM-DD) para o formato canônico YYYY-MM-DD. */
export const toIsoBirthDate = (value: string): string => {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
};

/** Converte YYYY-MM-DD para o formato de exibição DD/MM/AAAA. */
export const toBrazilianBirthDate = (value?: string | null): string => {
  if (!value) return '';
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value.trim();
  return `${match[3]}/${match[2]}/${match[1]}`;
};

export type BirthDateError = 'incomplete' | 'invalid' | 'future' | null;

/**
 * Valida a data de nascimento digitada em DD/MM/AAAA.
 * Aceita apenas datas reais e não permite datas futuras.
 */
export const validateBirthDate = (value: string): { valid: boolean; error: BirthDateError } => {
  const raw = (value || '').trim();
  if (!raw) return { valid: true, error: null };

  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return { valid: false, error: 'incomplete' };

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12) return { valid: false, error: 'invalid' };
  if (day < 1 || day > 31) return { valid: false, error: 'invalid' };

  const date = new Date(year, month - 1, day);
  // Barreira contra overflow: 31/02 viraria 03/03 em algumas engines.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { valid: false, error: 'invalid' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date.getTime() >= today.getTime()) return { valid: false, error: 'future' };

  return { valid: true, error: null };
};

export const BIRTH_DATE_ERROR_MESSAGES: Record<Exclude<BirthDateError, null>, string> = {
  incomplete: 'Informe a data de nascimento no formato DD/MM/AAAA.',
  invalid: 'Data de nascimento inválida. Confira o dia, o mês e o ano.',
  future: 'A data de nascimento não pode ser futura.',
};

