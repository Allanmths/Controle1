/// <reference types="cypress" />

describe('Login Flow', () => {
  beforeEach(() => {
    // Visita a página de login antes de cada teste
    // A rota base já está configurada em cypress.config.js
    cy.visit('/auth');
  });

  it('should display the login page correctly', () => {
    cy.contains('h2', 'Acesse sua conta').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').and('contain', 'Entrar');
  });

  it('should show an error for invalid credentials', () => {
    cy.get('input[type="email"]').type('wrong@email.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    // A mensagem de erro vem do estado `error` no AuthPage.jsx
    // e é exibida em um parágrafo com a classe 'text-red-500'
    cy.get('.text-red-500').should('be.visible').and('contain', 'Usuário não encontrado');
  });

  it('should allow a user to log in and redirect to the home page', () => {
    const email = Cypress.env('CYPRESS_TEST_USER_EMAIL');
    const password = Cypress.env('CYPRESS_TEST_USER_PASSWORD');

    // Preenche o formulário de login
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Após o login, o usuário é redirecionado para a rota raiz ('/')
    // que renderiza a HomePage.
    // Verificamos a URL e um elemento específico da HomePage.
    cy.url().should('not.include', '/auth');
    cy.url().should('match', /\/$/); // Deve estar na rota raiz
    cy.contains('h2', 'Dashboard').should('be.visible'); // Título na HomePage
  });

  it('should allow a logged-in user to log out', () => {
    const email = Cypress.env('CYPRESS_TEST_USER_EMAIL');
    const password = Cypress.env('CYPRESS_TEST_USER_PASSWORD');

    // Faz o login primeiro
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Aguarda o redirecionamento para a HomePage
    cy.url().should('not.include', '/auth');
    cy.contains('h2', 'Dashboard').should('be.visible');

    // Encontra e clica no botão de logout.
    // O botão está no MainLayout, dentro do UserMenu.
    // Vamos assumir que o botão de logout é o último item de um menu dropdown
    // que aparece após clicar no avatar do usuário.
    cy.get('[data-testid="user-avatar"]').click(); // Clica no avatar para abrir o menu
    cy.contains('button', 'Sair').click(); // Clica no botão "Sair"

    // Verifica se o usuário foi redirecionado de volta para a página de login
    cy.url().should('include', '/auth');
    cy.contains('h2', 'Acesse sua conta').should('be.visible');
  });
});
