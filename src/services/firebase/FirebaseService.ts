import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import {getAuth} from "firebase/auth";
import {getFirestore} from 'firebase/firestore';

class FirebaseService {

  initialized = false

  // private firebaseApp: any;

  // constructor(props:object) {
  //   this.firebaseApp = firebase.initializeApp(props)
  // }

  // firebaseApp: any
  //
  // //const firebaseAuth = getAuth(firebaseApp);
  // //const firestore = getFirestore(firebaseApp)
  //
  // auth = () => {
  //   //return firebase.auth()
  // }
  //
  // fBInit = (config: any) => {
  //   this.firebaseApp = firebase.initializeApp(config)
  //   return this.firebaseApp
  // }
  //private firebaseApp: FirebaseApp;

  // fBInit(config: { apiKey: any; appId: any; projectId: any; authDomain: any }) {
  //    return firebase.initializeApp(config)
  // //   //  return this.firebaseApp
  // }

  // static fBInit(config: { apiKey: any; appId: any; projectId: any; authDomain: any }) {
  //   return firebase.initializeApp(config)
  // }
  // getAuth() {
  //   return null//this.firebaseApp.getAuth()
  // }
  private firebaseApp: firebase.app.App = null as unknown as firebase.app.App

  init() {
    this.firebaseApp = firebase.initializeApp({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      appId: process.env.FIREBASE_APP_ID
    })
   // console.log("=====>", this.firebaseApp)
  }

  getAuth() {
    //console.log("=====>", this.firebaseApp)
    return getAuth(this.firebaseApp);
  }

  getFirestore() {
    //console.log("=====>", this.firebaseApp)
    return getFirestore(this.firebaseApp)
  }
}

export default new FirebaseService();
