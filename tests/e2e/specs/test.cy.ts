describe('SECTEXT', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('shows the gallery and both photo sources', () => {
    cy.contains('h1', 'Keep life in frame.')
    cy.contains('ion-button', 'Take photo').should('be.enabled')
    cy.contains('ion-button', 'Add from device').should('be.enabled')
    cy.contains('Your gallery is ready')
  })
})
