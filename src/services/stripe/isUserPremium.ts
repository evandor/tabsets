import {getAuth} from "firebase/auth";
import {firebaseApp} from "boot/firebase";

export default async function userHasClaim(claim: string): Promise<boolean> {
  console.log("checking claim", claim)
  const auth = getAuth(firebaseApp);
  const idToken = auth.currentUser?.getIdToken()
  if (!idToken) {
    console.log("no id token found")
    return Promise.resolve(false)
  }
  const decodedToken = await auth.currentUser?.getIdTokenResult()

  console.log("decodedToken", decodedToken)
  console.log("decodedToken", decodedToken?.claims)
  console.log("decodedToken", decodedToken?.claims?.stripeRole)

  return Promise.resolve(decodedToken?.claims?.stripeRole ? true : false)
}
