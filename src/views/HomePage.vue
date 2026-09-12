<template>
  <IonPage>
    <IonContent :fullscreen="true">

      <div class="page-container">

        <div class="calculator">

          <!-- Application Title -->
          <div class="app-title">
            <span>IONIC</span>
            <h1>Calculator</h1>
          </div>

          <!-- Calculator Display -->
          <div class="display-container">

            <div class="previous-operation">
              {{ operationText }}
            </div>

            <div class="display">
              {{ display }}
            </div>

          </div>

          <!-- Calculator Buttons -->
          <IonGrid class="calculator-grid">

            <!-- FIRST ROW -->
            <IonRow>

              <IonCol size="6">
                <IonButton
                  expand="block"
                  class="calculator-button utility"
                  @click="clearCalculator"
                >
                  C
                </IonButton>
              </IonCol>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button utility"
                  @click="backspace"
                >
                  ⌫
                </IonButton>
              </IonCol>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button operator"
                  @click="selectOperator('/')"
                >
                  ÷
                </IonButton>
              </IonCol>

            </IonRow>

            <!-- SECOND ROW -->
            <IonRow>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button"
                  @click="inputNumber('7')"
                >
                  7
                </IonButton>
              </IonCol>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button"
                  @click="inputNumber('8')"
                >
                  8
                </IonButton>
              </IonCol>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button"
                  @click="inputNumber('9')"
                >
                  9
                </IonButton>
              </IonCol>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button operator"
                  @click="selectOperator('*')"
                >
                  ×
                </IonButton>
              </IonCol>

            </IonRow>

            <!-- THIRD ROW -->
            <IonRow>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button"
                  @click="inputNumber('4')"
                >
                  4
                </IonButton>
              </IonCol>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button"
                  @click="inputNumber('5')"
                >
                  5
                </IonButton>
              </IonCol>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button"
                  @click="inputNumber('6')"
                >
                  6
                </IonButton>
              </IonCol>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button operator"
                  @click="selectOperator('-')"
                >
                  −
                </IonButton>
              </IonCol>

            </IonRow>

            <!-- FOURTH ROW -->
            <IonRow>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button"
                  @click="inputNumber('1')"
                >
                  1
                </IonButton>
              </IonCol>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button"
                  @click="inputNumber('2')"
                >
                  2
                </IonButton>
              </IonCol>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button"
                  @click="inputNumber('3')"
                >
                  3
                </IonButton>
              </IonCol>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button operator"
                  @click="selectOperator('+')"
                >
                  +
                </IonButton>
              </IonCol>

            </IonRow>

            <!-- FIFTH ROW -->
            <IonRow>

              <IonCol size="6">
                <IonButton
                  expand="block"
                  class="calculator-button"
                  @click="inputNumber('0')"
                >
                  0
                </IonButton>
              </IonCol>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button"
                  @click="inputDecimal"
                >
                  .
                </IonButton>
              </IonCol>

              <IonCol size="3">
                <IonButton
                  expand="block"
                  class="calculator-button equals"
                  @click="calculate"
                >
                  =
                </IonButton>
              </IonCol>

            </IonRow>

          </IonGrid>

        </div>

      </div>

    </IonContent>
  </IonPage>
</template>


<script setup lang="ts">

import { computed, ref } from 'vue';

import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton
} from '@ionic/vue';


type Operator = '+' | '-' | '*' | '/';


/*
|--------------------------------------------------------------------------
| Calculator State
|--------------------------------------------------------------------------
*/

const display = ref('0');

const firstNumber = ref<number | null>(null);

const selectedOperator = ref<Operator | null>(null);

const waitingForSecondNumber = ref(false);

const calculationCompleted = ref(false);


/*
|--------------------------------------------------------------------------
| Operator Symbol
|--------------------------------------------------------------------------
*/

const operatorSymbol = computed(() => {

  switch (selectedOperator.value) {

    case '+':
      return '+';

    case '-':
      return '−';

    case '*':
      return '×';

    case '/':
      return '÷';

    default:
      return '';

  }

});


/*
|--------------------------------------------------------------------------
| Text Above Display
|--------------------------------------------------------------------------
*/

const operationText = computed(() => {

  if (
    firstNumber.value === null ||
    selectedOperator.value === null
  ) {

    return 'Ready';

  }

  return `${formatNumber(firstNumber.value)} ${operatorSymbol.value}`;

});


/*
|--------------------------------------------------------------------------
| Number Input
|--------------------------------------------------------------------------
*/

function inputNumber(number: string) {

  if (
    display.value === 'Error' ||
    calculationCompleted.value
  ) {

    display.value = number;

    calculationCompleted.value = false;

    return;

  }


  if (waitingForSecondNumber.value) {

    display.value = number;

    waitingForSecondNumber.value = false;

    return;

  }


  if (display.value === '0') {

    display.value = number;

  } else {

    display.value += number;

  }

}


/*
|--------------------------------------------------------------------------
| Decimal
|--------------------------------------------------------------------------
*/

function inputDecimal() {

  if (
    display.value === 'Error' ||
    waitingForSecondNumber.value ||
    calculationCompleted.value
  ) {

    display.value = '0.';

    waitingForSecondNumber.value = false;

    calculationCompleted.value = false;

    return;

  }


  if (!display.value.includes('.')) {

    display.value += '.';

  }

}


/*
|--------------------------------------------------------------------------
| Select Operator
|--------------------------------------------------------------------------
*/

function selectOperator(operator: Operator) {

  if (display.value === 'Error') {

    return;

  }


  const currentNumber = Number(display.value);


  /*
   * Example:
   *
   * User presses:
   *
   * 10 +
   *
   * and then changes to:
   *
   * 10 ×
   */

  if (
    selectedOperator.value !== null &&
    waitingForSecondNumber.value
  ) {

    selectedOperator.value = operator;

    return;

  }


  /*
   * Store first number.
   */

  if (firstNumber.value === null) {

    firstNumber.value = currentNumber;

  }

  /*
   * Allow chained calculations.
   *
   * Example:
   *
   * 10 + 5 + 2
   */

  else if (selectedOperator.value !== null) {

    const result = performOperation(
      firstNumber.value,
      currentNumber,
      selectedOperator.value
    );


    if (result === null) {

      showError();

      return;

    }


    display.value = formatNumber(result);

    firstNumber.value = result;

  }


  selectedOperator.value = operator;

  waitingForSecondNumber.value = true;

  calculationCompleted.value = false;

}


/*
|--------------------------------------------------------------------------
| Perform Arithmetic
|--------------------------------------------------------------------------
*/

function performOperation(
  first: number,
  second: number,
  operator: Operator
): number | null {

  switch (operator) {

    case '+':

      return first + second;


    case '-':

      return first - second;


    case '*':

      return first * second;


    case '/':

      if (second === 0) {

        return null;

      }

      return first / second;

  }

}


/*
|--------------------------------------------------------------------------
| Calculate Result
|--------------------------------------------------------------------------
*/

function calculate() {

  if (
    firstNumber.value === null ||
    selectedOperator.value === null ||
    waitingForSecondNumber.value
  ) {

    return;

  }


  const secondNumber = Number(display.value);


  const result = performOperation(
    firstNumber.value,
    secondNumber,
    selectedOperator.value
  );


  if (result === null) {

    showError();

    return;

  }


  display.value = formatNumber(result);


  firstNumber.value = null;

  selectedOperator.value = null;

  waitingForSecondNumber.value = false;

  calculationCompleted.value = true;

}


/*
|--------------------------------------------------------------------------
| Clear
|--------------------------------------------------------------------------
*/

function clearCalculator() {

  display.value = '0';

  firstNumber.value = null;

  selectedOperator.value = null;

  waitingForSecondNumber.value = false;

  calculationCompleted.value = false;

}


/*
|--------------------------------------------------------------------------
| Backspace
|--------------------------------------------------------------------------
*/

function backspace() {

  if (waitingForSecondNumber.value) {

    return;

  }


  if (
    display.value === 'Error' ||
    calculationCompleted.value
  ) {

    display.value = '0';

    calculationCompleted.value = false;

    return;

  }


  display.value = display.value.slice(0, -1);


  if (
    display.value === '' ||
    display.value === '-'
  ) {

    display.value = '0';

  }

}


/*
|--------------------------------------------------------------------------
| Display Error
|--------------------------------------------------------------------------
*/

function showError() {

  display.value = 'Error';

  firstNumber.value = null;

  selectedOperator.value = null;

  waitingForSecondNumber.value = false;

  calculationCompleted.value = true;

}


/*
|--------------------------------------------------------------------------
| Format Result
|--------------------------------------------------------------------------
*/

function formatNumber(number: number): string {

  if (!Number.isFinite(number)) {

    return 'Error';

  }


  /*
   * Prevent values like:
   *
   * 0.1 + 0.2
   *
   * becoming:
   *
   * 0.30000000000000004
   */

  return Number(
    number.toPrecision(12)
  ).toString();

}

</script>


<style scoped>

/*
|--------------------------------------------------------------------------
| Ionic Page
|--------------------------------------------------------------------------
*/

ion-content {

  --background: #090b10;

}


/*
|--------------------------------------------------------------------------
| Main Container
|--------------------------------------------------------------------------
*/

.page-container {

  width: 100%;

  min-height: 100%;

  display: flex;

  justify-content: center;

  align-items: center;

  box-sizing: border-box;

  padding:
    calc(24px + env(safe-area-inset-top))
    16px
    calc(24px + env(safe-area-inset-bottom));

}


/*
|--------------------------------------------------------------------------
| Calculator
|--------------------------------------------------------------------------
*/

.calculator {

  width: 100%;

  max-width: 420px;

}


/*
|--------------------------------------------------------------------------
| Application Title
|--------------------------------------------------------------------------
*/

.app-title {

  margin-bottom: 20px;

}


.app-title span {

  color: #3880ff;

  font-size: 0.75rem;

  font-weight: 700;

  letter-spacing: 3px;

}


.app-title h1 {

  margin:

    4px 0 0;

  color: white;

  font-size: 1.7rem;

  font-weight: 600;

}


/*
|--------------------------------------------------------------------------
| Calculator Screen
|--------------------------------------------------------------------------
*/

.display-container {

  min-height: 150px;

  margin-bottom: 18px;

  padding: 25px 20px;

  border: 1px solid rgba(255, 255, 255, 0.08);

  border-radius: 26px;

  background:

    linear-gradient(
      145deg,
      #191d26,
      #101319
    );

  display: flex;

  flex-direction: column;

  justify-content: flex-end;

  align-items: flex-end;

  overflow: hidden;

}


.previous-operation {

  width: 100%;

  margin-bottom: 10px;

  color: #8b93a3;

  text-align: right;

  font-size: 1rem;

}


.display {

  width: 100%;

  color: white;

  text-align: right;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;

  font-size: clamp(
    2.7rem,
    11vw,
    4.2rem
  );

  font-weight: 300;

}


/*
|--------------------------------------------------------------------------
| Ionic Grid
|--------------------------------------------------------------------------
*/

.calculator-grid {

  padding: 0;

}


ion-col {

  padding: 4px;

}


/*
|--------------------------------------------------------------------------
| Calculator Buttons
|--------------------------------------------------------------------------
*/

.calculator-button {

  width: 100%;

  height: 68px;

  margin: 0;

  font-size: 1.35rem;

  font-weight: 600;

  --border-radius: 20px;

  --box-shadow: none;

  --background: #20242c;

  --background-activated: #303640;

  --color: white;

}


/*
|--------------------------------------------------------------------------
| Utility Buttons
|--------------------------------------------------------------------------
*/

.calculator-button.utility {

  --background: #d7d9de;

  --background-activated: #bfc2c8;

  --color: #121419;

}


/*
|--------------------------------------------------------------------------
| Operators
|--------------------------------------------------------------------------
*/

.calculator-button.operator {

  --background: #ff9500;

  --background-activated: #d97f00;

  --color: white;

}


/*
|--------------------------------------------------------------------------
| Equals
|--------------------------------------------------------------------------
*/

.calculator-button.equals {

  --background: #3880ff;

  --background-activated: #2667d8;

  --color: white;

}


/*
|--------------------------------------------------------------------------
| Smaller Phones
|--------------------------------------------------------------------------
*/

@media (max-height: 680px) {

  .display-container {

    min-height: 105px;

    margin-bottom: 10px;

    padding: 15px;

  }


  .calculator-button {

    height: 53px;

  }


  .app-title {

    margin-bottom: 10px;

  }

}

</style>
