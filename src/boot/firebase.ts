// https://firebase.google.com/docs/auth/web/firebaseui?authuser=0
import {boot} from 'quasar/wrappers'

import {initializeApp} from "firebase/app";
import {getAuth, connectAuthEmulator} from "firebase/auth";
// import 'firebase/auth';

import * as firebaseui from 'firebaseui'
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
//export default boot(async (/* { app, router, ... } */) => {
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let firebaseAuth
let ui

try {
  firebaseAuth = getAuth(app);
  //firebaseAuth.useEmulator("http://localhost:9099");

  // https://firebase.google.com/docs/emulator-suite/connect_auth#web-version-9
  // export FIREBASE_AUTH_EMULATOR_HOST="localhost:9099" does not seem to work...
  //connectAuthEmulator(firebaseAuth, "http://localhost:9099");
  ui = new firebaseui.auth.AuthUI(firebaseAuth);
} catch (err) {
  console.log("firebase not active")
}


export {firebaseAuth, ui}
