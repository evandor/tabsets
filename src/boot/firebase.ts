// https://firebase.google.com/docs/auth/web/firebaseui?authuser=0
import {boot} from 'quasar/wrappers'

import {initializeApp} from "firebase/app";
import {getAuth} from "firebase/auth";

import * as firebaseui from 'firebaseui'

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
//export default boot(async (/* { app, router, ... } */) => {
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Firebase Authentication and get a reference to the service
const firebaseAuth = getAuth(app);

var ui = new firebaseui.auth.AuthUI(firebaseAuth);


//})

export {firebaseAuth, ui}
