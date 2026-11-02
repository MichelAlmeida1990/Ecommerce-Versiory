p='components/ProductCard.tsx'
s=open(p,encoding='utf-8').read()
idx=s.find('REFCOM244: Bot')
# find the start of the comment
start=s.rfind('{/*',0,idx)+len('{/*')
# find the end of the button
end=s.find('</button>',idx)+len('</button>')
print(repr(s[start-4:end+2]))
