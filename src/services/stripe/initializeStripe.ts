import {Stripe, loadStripe} from "@stripe/stripe-js"

let stripePromise: Stripe | null

const initializeStripe = async () => {
  if (!stripePromise) {
    stripePromise = await loadStripe("pk_test_51Liaq8CRr6mfm8sfWjPJwrWRfcP1DDZxuruR6TaccotBFN4ugOlqpXGvaEcLpLOgfeLrK1hR1eCHLaGFSnxFvder00en9ZYYrd")
  }
  return stripePromise
}

export default initializeStripe
