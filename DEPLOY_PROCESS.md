# Controle de Estoque - Documentação de Deploy

## Configuração Atual do Deploy

O sistema utiliza GitHub Actions para fazer o deploy automático da aplicação para o GitHub Pages. Este documento explica como o deploy está configurado e como resolver problemas comuns.

## Método de Deploy

### Deploy Automático com GitHub Actions

- **Configuração**: `.github/workflows/deploy.yml`
- **Acionamento**: 
  - Automático: A cada push na branch `main`
  - Manual: Via interface do GitHub Actions

### Processo do Deploy Automático

1. GitHub Actions executa o workflow quando é acionado
2. O código é compilado com `npm run build`
3. O arquivo `404.html` é copiado para a pasta `dist` para garantir o funcionamento do SPA
4. Os arquivos compilados são publicados na branch `gh-pages`
5. O GitHub Pages serve o conteúdo da branch `gh-pages`

## Configurações Importantes

### Arquivos de Configuração SPA

1. **404.html** - Redireciona todas as rotas para o SPA
2. **sw.js** - Service Worker com cache das principais rotas
3. **vite.config.js** - Configuração base e historyApiFallback
4. **index.html** - Script de redirecionamento SPA do GitHub Pages

### Rotas e Redirecionamento

O sistema usa duas estratégias para lidar com rotas SPA no GitHub Pages:

1. **404.html**: Intercepta qualquer rota não encontrada e redireciona para a aplicação principal
2. **Script SPA no index.html**: Reconstrói a URL original a partir dos parâmetros de redirecionamento

## Solucionando Problemas

### Problema: Página 404 ao acessar rotas diretamente

**Solução**:
1. Verifique se o arquivo `404.html` está corretamente configurado na raiz do site
2. Confirme se o script SPA está presente no `index.html`
3. Verifique a configuração `basename` do Router no `App.jsx`

### Problema: Deploy sendo executado duas vezes

**Solução**:
1. O deploy agora é configurado com `concurrency: group: pages` para evitar execuções paralelas
2. Não execute `npm run deploy` manualmente se o GitHub Actions estiver configurado

## Melhor Prática

Para adicionar novas funcionalidades:

1. Desenvolva e teste localmente com `npm run dev`
2. Faça commit e push para a branch `main`
3. Deixe o GitHub Actions realizar o deploy automaticamente
4. Verifique o status do deploy na aba "Actions" do GitHub

## Verificação de Deploy

Para verificar se o deploy foi bem-sucedido:

1. Aguarde a conclusão do workflow no GitHub Actions
2. Acesse o site em: https://allanmths.github.io/Controle1/
3. Teste navegação entre rotas, especialmente acesso direto a `/movements` e outras páginas
