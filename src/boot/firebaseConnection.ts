//import FirebaseService from '../services/firebase/FirebaseService'

import FirebaseService from "src/services/firebase/FirebaseService";
import {boot} from "quasar/wrappers";

// export default async () => {
//
//   const clientCredentials = {
//     apiKey: process.env.FIREBASE_API_KEY,
//     authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//     projectId: process.env.FIREBASE_PROJECT_ID,
//     appId: process.env.FIREBASE_APP_ID
//   }
//
//   const app = FirebaseService.fBInit(clientCredentials)
//
//   // Validation that our service structure is working
//   // with an initialize Firebase application and auth instance.
//   //console.log('Firebase App Instantiation:', app)
//   //console.log('Firebase Auth Module:', firebaseServices.auth())
// }
export default boot(({app}) => {

  // const clientCredentials =

  //let qw = FirebaseService.fBInit(clientCredentials)

})

