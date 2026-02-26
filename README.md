<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/18O-qRXrJr8sBNe37UcOPlB-JUgIuB_RS

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
    

## Checklist NF-e (Nota Fiscal Eletrônica)

- [x] Adicionar campos fiscais (NCM, CFOP, CST, peso) ao tipo Product
- [x] Criar serviço de integração com ERP para emissão de NF-e (Sebrae gratuito)
- [x] Adicionar opção de solicitação de nota fiscal no checkout
- [x] Atualizar fluxo de pedido para emitir nota automaticamente
- [x] Gerar arquivo XML/TXT para importação manual no emissor Sebrae
- [x] Documentar instruções para o lojista importar o arquivo no Sebrae

### Como importar o XML no emissor Sebrae

1. Após o cliente solicitar a nota fiscal, o sistema gera um arquivo XML simples e salva localmente.
2. O lojista pode acessar a área do cliente/administrador, baixar o arquivo XML salvo ("versiory_nf_xml").
3. No emissor Sebrae, utilize a opção de importação de pedidos/XML.
4. Importe o arquivo baixado para gerar a NF-e e o DANFE.
5. Finalize o processo conforme as instruções do emissor Sebrae.

**Atenção:** O XML gerado é um exemplo didático. Para emissão oficial, utilize sempre o layout exigido pela SEFAZ e valide com seu contador.
