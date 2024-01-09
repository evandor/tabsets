import {boot} from 'quasar/wrappers'

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
//export default boot(async (/* { app, router, ... } */) => {


import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import {getAuth} from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
//import { getRemoteConfig } from "firebase/remote-config";


const clientCredentials = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  appId: process.env.FIREBASE_APP_ID
}

console.log("initializing firebase")
const firebaseApp = firebase.initializeApp(clientCredentials)
const firebaseAuth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp)
//const remoteConfig = getRemoteConfig(app);

//const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
//const emailAuthProvider = firebase.auth.EmailAuthProvider.PROVIDER_ID;
const githubAuthProvider = new firebase.auth.GithubAuthProvider()


export {firebaseApp, firebaseAuth, firestore, githubAuthProvider};


//})
