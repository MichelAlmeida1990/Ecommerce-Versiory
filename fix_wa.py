p='components/AdminDashboard.tsx'
s=open(p,encoding='utf-8').read()
old="const vencimentoFmt = vencimento ? new Date(vencimento).toLocaleDateString('pt-BR') : '-';"
new="const vencimentoFmt = vencimento ? new Date(vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-';"
assert old in s, 'pattern not found'
s=s.replace(old,new)
open(p,'w',encoding='utf-8').write(s)
print('done')
