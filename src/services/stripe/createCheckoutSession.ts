import getStripe from "./initializeStripe"
import {collection, getDoc, doc, onSnapshot, setDoc, addDoc} from "firebase/firestore";
import {firestore} from "boot/firebase";

export async function createCheckoutSession(uid: string) {
  //     await setDoc(doc(firestore, "users", credentials.user.uid), {
  const cos = collection(firestore, "users", uid, "checkout_sessions")
  const checkoutSessionRef = await addDoc(cos, {
    price:"price_1OWd4pCRr6mfm8sfBfcpGMtl",
    success_url: window.location.origin,
    cancel_url: window.location.origin
  })
  console.log("creating checkout session", checkoutSessionRef)
  // const checkoutSessionRef = addDoc(firestore, "users", uid, "checkout_sessions", {
  //   price:"price_1OWMMzCRr6mfm8sfmdhEphQ6",
  //   success_url: window.location.origin,
  //   cancel_url: window.location.origin
  // })


  onSnapshot(checkoutSessionRef, async (snap:any) => {
    console.log("here!!!", snap)
    const {sessionId} = snap.data()
    console.log("here!!!", sessionId)
    if (sessionId) {
      const stripe = await getStripe()
      console.log("got stripe", stripe)
      stripe?.redirectToCheckout({sessionId})
    }
  })

}
