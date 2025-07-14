describe('Fluxo da Página de Estoque', () => {
  it('deve permitir que um usuário faça login e navegue até a página de estoque', () => {
    // Visita a página inicial (que deve ser a de login)
    cy.visit('/');

    // Encontra os campos de email e senha, e o botão de login.
    // Substitua 'seu-email-de-teste@exemplo.com' e 'sua-senha-de-teste' por credenciais válidas.
    cy.get('input[type="email"]').type('allanmths@gmail.com');
    cy.get('input[type="password"]').type('Matheus!.11');
    cy.get('button[type="submit"]').click();

    // Aguarda o redirecionamento e verifica se estamos no dashboard
    cy.url().should('include', '/dashboard');

    // Encontra o link para a página de estoque e clica nele
    // O seletor [href*="stock"] é uma forma robusta de encontrar o link
    cy.get('a[href*="stock"]').click();

    // Verifica se a URL agora é a da página de estoque
    cy.url().should('include', '/stock');

    // Verifica se o título da página de estoque está visível
    cy.contains('h1', 'Controle de Estoque').should('be.visible');
  });
});
