p='components/AdminDashboard.tsx'
s=open(p,encoding='utf-8').read()
lines=s.split(chr(10))
out=[]
for i in range(9580,9640):
    out.append(str(i+1)+' '+lines[i].strip()[:150])
open('tmp_out.txt','w',encoding='utf-8').write(chr(10).join(out))
print('done')
