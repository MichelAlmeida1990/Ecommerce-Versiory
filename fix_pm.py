p='components/AdminDashboard.tsx'
s=open(p,encoding='utf-8').read()
old="byMethod[entry.paymentMethod] = (byMethod[entry.paymentMethod] || 0) + entry.amount;"
new="const pm = (entry.paymentMethod || '').trim().toLowerCase();\nconst normalized = pm === 'credito' || pm === 'crédito' ? 'Crédito' : pm === 'debito' || pm === 'débito' ? 'Débito' : pm === 'pix' ? 'PIX' : pm === 'dinheiro' ? 'Dinheiro' : entry.paymentMethod || 'Outros';\nbyMethod[normalized] = (byMethod[normalized] || 0) + entry.amount;"
assert old in s
s=s.replace(old,new)
open(p,'w',encoding='utf-8').write(s)
print('done')
