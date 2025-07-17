# Sistema de Controle de Estoque

Sistema web completo para controle de estoque desenvolvido em React com Firebase como backend.

## 🚀 Funcionalidades

- **Autenticação**: Sistema de login e cadastro de usuários
- **Gestão de Produtos**: CRUD completo com categorias e fornecedores
- **Controle de Estoque**: Entrada, saída e transferência de produtos
- **Relatórios**: Análises ABC, estoque morto, valorização e movimentações
- **Contagens**: Sistema de inventário e auditoria
- **Dashboard**: Visão geral com gráficos e métricas
- **Multi-usuário**: Diferentes níveis de permissão

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, React Router, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Bibliotecas**: 
  - Chart.js para gráficos
  - React Hot Toast para notificações
  - jsPDF para relatórios em PDF
  - Papa Parse para importação CSV
  - React Icons para ícones

## 📋 Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn
- Conta no Firebase

## 🔧 Instalação e Configuração

1. **Clone o repositório**
   ```bash
   git clone https://github.com/Allanmths/Controle1.git
   cd Controle1
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o Firebase**
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative Authentication (Email/Password)
   - Ative Firestore Database
   - Copie as configurações do projeto
   - Atualize o arquivo `firebase-config.js` com suas configurações

4. **Execute o projeto em desenvolvimento**
   ```bash
   npm run dev
   ```

5. **Build para produção**
   ```bash
   npm run build:prod
   ```

## 🌐 Deploy no GitHub Pages

O projeto está configurado para deploy automático no GitHub Pages através do GitHub Actions.

### Configuração Automática
- A cada push na branch `main`, o projeto é automaticamente construído e implantado
- Acesse: `https://allanmths.github.io/Controle1/`

### Deploy Manual
```bash
npm run build:prod
npm run deploy
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── reports/        # Componentes de relatórios
│   └── __tests__/      # Testes dos componentes
├── context/            # Contextos React (Auth, Settings)
├── hooks/              # Custom hooks
├── pages/              # Páginas principais
├── services/           # Serviços (Firebase)
└── utils/              # Utilitários e helpers
```

## 🔐 Configuração de Segurança do Firebase

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📱 Principais Funcionalidades

### Gestão de Produtos
- Cadastro completo com código, nome, categoria, fornecedor
- Upload de imagens
- Controle de estoque mínimo
- Importação em lote via CSV

### Movimentações
- Entrada de mercadorias
- Saída por venda ou perda
- Transferência entre locais
- Histórico completo de movimentações

### Relatórios
- **Análise ABC**: Classificação de produtos por importância
- **Estoque Morto**: Produtos sem movimentação
- **Valorização**: Valor total do estoque
- **Movimentações**: Histórico detalhado

### Contagens
- Criação de inventários
- Comparação com estoque teórico
- Relatórios de divergências
- Auditoria de contagens

## 🚀 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Build para produção
- `npm run build:prod` - Build otimizado para produção
- `npm run preview` - Preview do build local
- `npm run test` - Executa testes
- `npm run cypress:open` - Abre o Cypress para testes E2E
- `npm run deploy` - Deploy para GitHub Pages

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (opcional, configurações estão no firebase-config.js):

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através do GitHub Issues ou email.

---

Desenvolvido com ❤️ by [Allanmths](https://github.com/Allanmths)
