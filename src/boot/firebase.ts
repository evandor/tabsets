// https://firebase.google.com/docs/auth/web/firebaseui?authuser=0
import {boot} from 'quasar/wrappers'

import {initializeApp} from "firebase/app";
import {getAuth, connectAuthEmulator} from "firebase/auth";
import { getPerformance } from "firebase/performance";

import * as firebaseui from 'firebaseui'

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
//export default boot(async (/* { app, router, ... } */) => {
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const perf = getPerformance(app);

let firebaseAuth
let ui

try {
  // we need the .env file with the credentials to be available (not checked in git!!)
  firebaseAuth = getAuth(app);


  // https://firebase.google.com/docs/emulator-suite/connect_auth#web-version-9
  // export FIREBASE_AUTH_EMULATOR_HOST="localhost:9099" does not seem to work...
  //connectAuthEmulator(firebaseAuth, "http://localhost:9099");
  ui = new firebaseui.auth.AuthUI(firebaseAuth);
} catch (err) {
  console.log("firebase not active")
}

export {firebaseAuth, ui}
