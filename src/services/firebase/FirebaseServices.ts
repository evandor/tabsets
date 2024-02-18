import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import {getAuth, Auth} from "firebase/auth";
import {getFirestore, Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager  } from 'firebase/firestore';
import {getMessaging} from "firebase/messaging";

class FirebaseServices {

  private firebaseApp: firebase.app.App = null as unknown as firebase.app.App
  private auth: Auth = null as unknown as Auth
  private firestore: Firestore = null as unknown as Firestore

  init() {
    this.firebaseApp = firebase.initializeApp({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      appId: process.env.FIREBASE_APP_ID
    })
    this.auth = getAuth(this.firebaseApp)
    // https://firebase.google.com/docs/firestore/manage-data/enable-offline#web-modular-api
    initializeFirestore(this.firebaseApp, {localCache:
        persistentLocalCache({tabManager: persistentMultipleTabManager()})
    })
    this.firestore = getFirestore(this.firebaseApp)
  }

  getAuth() {
    return this.auth
  }

  getFirestore() {
    return this.firestore
  }

  getMessaging() {
    return getMessaging(this.firebaseApp)
  }
}

export default new FirebaseServices();
