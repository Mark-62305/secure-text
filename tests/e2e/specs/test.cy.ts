describe('SECTEXT', () => {
  beforeEach(() => cy.visit('/'))

  it('encrypts and decrypts with the Caesar cipher', () => {
    cy.get('[data-testid="source-text"]').type('Attack at Dawn!')
    cy.get('[data-testid="shift"]').clear().type('3')
    cy.get('[data-testid="process-button"]').click()
    cy.get('[data-testid="result-text"]').should('have.value', 'Dwwdfn dw Gdzq!')

    cy.contains('button', 'Use as input').click()
    cy.get('[data-testid="process-button"]').click()
    cy.get('[data-testid="result-text"]').should('have.value', 'Attack at Dawn!')
  })

  it('encrypts and decrypts with the Vigenère cipher', () => {
    cy.get('[data-testid="vigenere-cipher"]').click()
    cy.get('[data-testid="source-text"]').type('ATTACKATDAWN')
    cy.get('[data-testid="keyword"]').type('LEMON')
    cy.get('[data-testid="process-button"]').click()
    cy.get('[data-testid="result-text"]').should('have.value', 'LXFOPVEFRNHR')

    cy.contains('button', 'Use as input').click()
    cy.get('[data-testid="process-button"]').click()
    cy.get('[data-testid="result-text"]').should('have.value', 'ATTACKATDAWN')
  })

  it('encrypts and decrypts with AES-256-GCM', () => {
    cy.get('[data-testid="aes-cipher"]').click()
    cy.get('[data-testid="source-text"]').type('A confidential message')
    cy.get('[data-testid="password"]').type('Strong-password!42')
    cy.get('[data-testid="process-button"]').click()
    cy.get('[data-testid="result-text"]')
      .invoke('val')
      .should('match', /^sectext:aes-gcm:v1:/)

    cy.contains('button', 'Use as input').click()
    cy.get('[data-testid="process-button"]').click()
    cy.get('[data-testid="result-text"]').should('have.value', 'A confidential message')
  })
})
