describe('Ionic calculator', () => {
  const press = (...labels: string[]) => {
    labels.forEach((label) => cy.contains('ion-button', label).click())
  }

  const expectDisplay = (value: string) => {
    cy.get('.display').should('have.text', value)
  }

  beforeEach(() => {
    cy.visit('/')
  })

  it('adds 7 + 3', () => {
    press('7', '+', '3', '=')
    expectDisplay('10')
  })

  it('multiplies 12 x 5', () => {
    press('1', '2', '×', '5', '=')
    expectDisplay('60')
  })

  it('divides 100 by 4', () => {
    press('1', '0', '0', '÷', '4', '=')
    expectDisplay('25')
  })

  it('subtracts 30 from 25', () => {
    press('2', '5', '−', '3', '0', '=')
    expectDisplay('-5')
  })

  it('adds decimal values', () => {
    press('1', '2', '.', '5', '+', '3', '.', '5', '=')
    expectDisplay('16')
  })

  it('shows Error when dividing by zero', () => {
    press('1', '0', '÷', '0', '=')
    expectDisplay('Error')
  })

  it('removes the final digit with backspace', () => {
    press('1', '2', '3', '4', '5', '⌫')
    expectDisplay('1234')
  })
})
