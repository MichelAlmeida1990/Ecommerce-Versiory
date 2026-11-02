p='components/ProductCard.tsx'
s=open(p,encoding='utf-8').read()
idx=s.find('REFCOM244: Bot')
print(idx)
print(repr(s[idx:idx+260]))
