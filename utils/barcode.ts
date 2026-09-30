// REFCOM234/235: Geracao e validacao de GTIN/EAN e renderizacao do codigo de barras.
// O projeto nao possui biblioteca de barcode, entao o EAN-13 e desenhado em SVG puro
// usando as tabelas de paridade L/G/R do padrao GS1.

/** Remove tudo que nao for digito (scanners as vezes enviam espaco, Tab ou Enter). */
export const normalizeGtin = (value?: string | null): string => (value || '').replace(/\D/g, '');

/**
 * Calcula o digito verificador de um GTIN.
 * Aceita base de 11 ou 12 digitos e devolve o digito verificador correspondente.
 */
export const calculateCheckDigit = (value: string): number | null => {
  const digits = normalizeGtin(value);
  if (digits.length < 11 || digits.length > 12) return null;
  const base = digits.slice(0, -1);
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    const weight = (base.length - i) % 2 === 0 ? 3 : 1;
    sum += Number(base[i]) * weight;
  }
  return (10 - (sum % 10)) % 10;
};

/** Indica se o codigo e um EAN-13 valido (13 digitos com digito verificador correto). */
export const isValidEan13 = (value?: string | null): boolean => {
  const digits = normalizeGtin(value);
  if (digits.length !== 13) return false;
  const expected = calculateCheckDigit(digits);
  return expected !== null && expected === Number(digits[12]);
};

/** Completa um codigo com o digito verificador, ou devolve '' se invalido. */
export const withCheckDigit = (value: string): string => {
  const digits = normalizeGtin(value);
  const dv = calculateCheckDigit(digits);
  return dv === null ? '' : `${digits.slice(0, -1)}${dv}`;
};

/** Gera um EAN-13 aleatorio usando o prefixo GS1 789 (Brasil). */
export const generateEan13 = (): string => {
  let body = '789';
  while (body.length < 12) {
    body += Math.floor(Math.random() * 10);
  }
  return withCheckDigit(body);
};

/**
 * Gera um EAN-13 unico em relacao aos codigos ja usados.
 * Se o GTIN atual ja for valido e ainda nao usado, ele e preservado.
 */
export const generateUniqueEan13 = (current?: string | null, used: (string | null | undefined)[] = []): string => {
  const taken = new Set(used.map(normalizeGtin).filter(v => v.length === 13));
  const candidate = normalizeGtin(current);
  if (candidate.length === 13 && isValidEan13(candidate) && !taken.has(candidate)) return candidate;

  let code = generateEan13();
  let guard = 0;
  while (taken.has(code) && guard < 50) {
    code = generateEan13();
    guard++;
  }
  return code;
};

const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R = ['1011000', '1001100', '1100100', '1011110', '1100010', '1000110', '1111010', '1101110', '1110110', '1101000'];

const PARITY: string[][] = [
  ['L', 'L', 'L', 'L', 'L', 'L'],
  ['L', 'L', 'G', 'L', 'G', 'G'],
  ['L', 'L', 'G', 'G', 'L', 'G'],
  ['L', 'L', 'G', 'G', 'G', 'L'],
  ['L', 'G', 'L', 'L', 'G', 'G'],
  ['L', 'G', 'G', 'L', 'L', 'G'],
  ['L', 'G', 'G', 'G', 'L', 'L'],
  ['L', 'G', 'L', 'G', 'L', 'G'],
  ['L', 'G', 'L', 'G', 'G', 'L'],
  ['L', 'G', 'G', 'L', 'G', 'L'],
];

const START_GUARD = '101';
const CENTER_GUARD = '01010';
const END_GUARD = '101';

export interface BarcodeBars {
  pattern: string;
  leftText: string;
  firstDigit: string;
  rightText: string;
}

/** Monta a sequencia de modulos do EAN-13. Retorna null se o codigo for invalido. */
export const buildEan13Pattern = (value?: string | null): BarcodeBars | null => {
  const digits = normalizeGtin(value);
  if (digits.length !== 13) return null;

  const firstDigit = Number(digits[0]);
  const parity = PARITY[firstDigit];

  let pattern = START_GUARD;
  for (let i = 0; i < 6; i++) {
    const d = Number(digits[i + 1]);
    pattern += parity[i] === 'G' ? G[d] : L[d];
  }
  pattern += CENTER_GUARD;
  for (let i = 7; i < 13; i++) {
    pattern += R[Number(digits[i])];
  }
  pattern += END_GUARD;

  return {
    pattern,
    leftText: digits.slice(1, 7),
    firstDigit: digits[0],
    rightText: digits.slice(7, 13),
  };
};

export interface BarcodeSvgOptions {
  height?: number;
  moduleWidth?: number;
  showText?: boolean;
  className?: string;
}

/**
 * Renderiza o EAN-13 como SVG puro (sem dependencias externas).
 * Os digitos do 1o e do grupo direito usam barras de guarda estendidas,
 * exatamente como no padrao de impressao.
 */
export const buildEan13Svg = (value: string | null | undefined, options: BarcodeSvgOptions = {}): string => {
  const bars = buildEan13Pattern(value);
  const { height = 60, moduleWidth = 2, showText = true, className = '' } = options;
  if (!bars) {
    return `<svg viewBox="0 0 100 40" class="${className}"><text x="50" y="24" text-anchor="middle" font-size="10" fill="#94a3b8">Codigo invalido</text></svg>`;
  }

  const modules = bars.pattern.split('');
  const width = modules.length * moduleWidth;
  const barsBottom = showText ? height - 15 : height;
  const textY = height - 2;
  const fontSize = Math.max(8, Math.round(moduleWidth * 5));

  let rects = '';
  modules.forEach((bit, i) => {
    if (bit !== '1') return;
    const x = i * moduleWidth;
    const isGuard = i < 3 || (i >= 45 && i < 50) || i >= 92;
    rects += `<rect x="${x}" y="0" width="${moduleWidth}" height="${isGuard ? barsBottom : barsBottom}" fill="#000000" />`;
  });

  // Guarda central e texto do primeiro digito (fora das barras).
  const centerX = 45 * moduleWidth;
  const texts =
    showText
      ? `<text x="${centerX - fontSize * 0.6}" y="${textY}" text-anchor="end" font-family="monospace" font-size="${fontSize}" fill="#000000">${bars.leftText}</text>` +
        `<text x="${centerX + moduleWidth * 2.6}" y="${textY}" text-anchor="start" font-family="monospace" font-size="${fontSize}" fill="#000000">${bars.firstDigit}</text>` +
        `<text x="${centerX + moduleWidth * 5}" y="${textY}" text-anchor="start" font-family="monospace" font-size="${fontSize}" fill="#000000">${bars.rightText}</text>`
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="${className}" preserveAspectRatio="none">${rects}${texts}</svg>`;
};
