p='components/ProductCard.tsx'
s=open(p,encoding='utf-8').read()
old=""" {/* REFCOM244: Botão [+Detalhes] - acesso direto às guias de tamanhos, medidas e detalhes técnicos */}
            <button
              onClick={() => navigate(`/product/${product.id}#detalhes`)}
              className="text-[10px] font-black uppercase tracking-widest text-versiory-coral hover:text-versiory-ink transition-colors text-right"
            >
              [+Detalhes]
            </button>
"""
# Use the actual text from file
idx=s.find('REFCOM244: Bot')
start=s.rfind('{/*',0,idx)
end=s.find('</button>',idx)+len('</button>')
# include trailing newline
while end < len(s) and s[end]=='\n':
    end+=1
s=s[:start]+s[end:]
open(p,'w',encoding='utf-8').write(s)
print('done')
