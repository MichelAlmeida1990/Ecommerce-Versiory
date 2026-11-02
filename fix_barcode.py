p='utils/barcode.ts'
s=open(p,encoding='utf-8').read()
old="""export const calculateCheckDigit = (value: string): number | null => {
  const digits = normalizeGtin(value);
  if (digits.length < 11 || digits.length > 12) return null;
  const base = digits.slice(0, -1);
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    const weight = (base.length - i) % 2 === 0 ? 3 : 1;
    sum += Number(base[i]) * weight;
  }
  return (10 - (sum % 10)) % 10;
};"""
new="""export const calculateCheckDigit = (value: string): number | null => {
  const digits = normalizeGtin(value);
  if (digits.length < 12 || digits.length > 13) return null;
  const base = digits.length === 13 ? digits.slice(0, 12) : digits;
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    const weight = (base.length - i) % 2 === 0 ? 3 : 1;
    sum += Number(base[i]) * weight;
  }
  return (10 - (sum % 10)) % 10;
};"""
assert old in s, 'calc not found'
s=s.replace(old,new)
old2="""export const withCheckDigit = (value: string): string => {
  const digits = normalizeGtin(value);
  const dv = calculateCheckDigit(digits);
  return dv === null ? '' : `${digits.slice(0, -1)}${dv}`;
};"""
new2="""export const withCheckDigit = (value: string): string => {
  const digits = normalizeGtin(value);
  const dv = calculateCheckDigit(digits);
  if (dv === null) return '';
  const body = digits.length === 13 ? digits.slice(0, 12) : digits;
  return `${body}${dv}`;
};"""
assert old2 in s, 'withCheckDigit not found'
s=s.replace(old2,new2)
open(p,'w',encoding='utf-8').write(s)
print('done')
