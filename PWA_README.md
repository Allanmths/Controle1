# PWA (Progressive Web App) - Controle de Estoque

## Funcionalidades Implementadas

### 📱 Progressive Web App
- **Instalação**: O aplicativo pode ser instalado no dispositivo como um app nativo
- **Ícones**: Múltiplos tamanhos de ícones para diferentes dispositivos
- **Manifest**: Configuração completa para instalação e aparência
- **Standalone**: Executa como aplicativo independente sem barra do navegador

### 🔄 Modo Offline
- **Service Worker**: Cache inteligente de recursos estáticos
- **IndexedDB**: Armazenamento local para dados offline
- **Indicadores Visuais**: Status de conexão visível nas páginas de contagem
- **Sincronização**: Dados são sincronizados quando a conexão é restaurada

### 📊 Contagem Offline
- **Nova Contagem**: Criar contagens mesmo sem internet
- **Visualizar Contagens**: Acessar contagens salvas localmente
- **Cache de Produtos**: Lista de produtos disponível offline
- **Salvamento Local**: Dados salvos automaticamente no IndexedDB

## Arquivos Criados/Modificados

### Novos Arquivos PWA
```
public/
├── manifest.json              # Configuração PWA
├── offline.html              # Página offline
├── sw.js                     # Service Worker
└── icons/                    # Ícones PWA
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    └── icon-512x512.png

src/
├── hooks/
│   └── useOfflineMode.js     # Hook para modo offline
└── components/
    └── PWAInstallPrompt.jsx  # Prompt de instalação
```

### Arquivos Modificados
- `vite.config.js` - Configuração PWA com vite-plugin-pwa
- `index.html` - Meta tags PWA e registro do Service Worker
- `App.jsx` - Registro do Service Worker e prompt de instalação
- `CountingPage.jsx` - Indicadores de status offline
- `NewCountPage.jsx` - Funcionalidade de contagem offline

## Como Testar

### 1. Instalação PWA
1. Abra o aplicativo no Chrome/Edge
2. Procure pelo ícone de instalação na barra de endereços
3. Clique em "Instalar" quando o prompt aparecer
4. O app será instalado como aplicativo nativo

### 2. Modo Offline
1. Acesse a página de contagem
2. Desconecte a internet (modo avião ou desabilitar WiFi)
3. Note o indicador "Offline" no topo da página
4. Tente criar uma nova contagem - deve funcionar
5. Reconecte a internet - dados serão sincronizados

### 3. Service Worker
1. Abra as ferramentas de desenvolvedor (F12)
2. Vá para Application > Service Workers
3. Verifique se o Service Worker está registrado e ativo
4. Em Application > Storage, veja o IndexedDB com dados salvos

## Funcionalidades por Implementar

### 🚀 Melhorias Futuras
- [ ] Notificações Push
- [ ] Sincronização em Background
- [ ] Cache mais inteligente baseado em uso
- [ ] Compressão de dados offline
- [ ] Atualização automática de dados em background

### 📈 Analytics Offline
- [ ] Rastreamento de uso offline
- [ ] Relatórios de sincronização
- [ ] Métricas de performance offline

## Compatibilidade

### Navegadores Suportados
- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Safari 11.1+
- ✅ Edge 17+

### Dispositivos
- ✅ Android (Chrome, Firefox)
- ✅ iOS (Safari 11.1+)
- ✅ Desktop (Windows, macOS, Linux)

## Comandos de Build

```bash
# Desenvolvimento
npm run dev

# Build de produção com PWA
npm run build

# Preview da build
npm run preview
```

## Estrutura de Cache

### Service Worker Cache
- **Static Assets**: CSS, JS, imagens, fontes
- **Pages**: HTML das principais páginas
- **API Responses**: Respostas da API Firebase (cache estratégico)

### IndexedDB Stores
- **products**: Cache de produtos para uso offline
- **categories**: Categorias de produtos
- **locations**: Localizações de estoque
- **counts**: Contagens criadas offline
- **movements**: Movimentações pendentes de sincronização

## Deployment

O PWA é automaticamente construído durante o processo de build e incluído na pasta `dist/`. Todos os arquivos necessários são copiados para o GitHub Pages durante o deploy.

### Verificação de Deploy
1. Acesse a URL de produção
2. Abra DevTools > Application
3. Verifique se o manifest está carregado
4. Confirme se o Service Worker está registrado
5. Teste a instalação do PWA

## Troubleshooting

### Service Worker não registra
- Verifique se o app está sendo servido via HTTPS (ou localhost)
- Confirme se o arquivo `sw.js` existe na raiz do domínio
- Veja o console para erros de registro

### PWA não instalável
- Verifique se o manifest está correto
- Confirme se os ícones existem
- Certifique-se de que está em HTTPS

### Modo offline não funciona
- Verifique se o IndexedDB está disponível
- Confirme se os dados estão sendo salvos localmente
- Teste a funcionalidade de rede offline

---

**Status**: ✅ PWA totalmente implementado e funcional
**Última atualização**: Janeiro 2025
