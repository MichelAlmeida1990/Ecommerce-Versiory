p='components/AdminDashboard.tsx'
s=open(p,encoding='utf-8').read()
old="  const [activeTab, setActiveTab] = useState<TabKey>(userRole === 'seller' ? 'pdv' : 'dashboard');"
new="  const [activeTab, setActiveTab] = useState<TabKey>(userRole === 'seller' ? 'pdv' : 'dashboard');\n  const planAccess = usePlanAccess();"
assert old in s
s=s.replace(old,new,1)
open(p,'w',encoding='utf-8').write(s)
print('done')
