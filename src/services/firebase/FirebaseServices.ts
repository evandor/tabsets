import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import {getAuth, Auth} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import {getMessaging, Messaging, getToken, onMessage} from "firebase/messaging";

class FirebaseServices {

  private initialized = false

  private firebaseApp: firebase.app.App = null as unknown as firebase.app.App
  private auth: Auth = null as unknown as Auth
  private firestore: Firestore = null as unknown as Firestore
  private messaging: Messaging = null as unknown as Messaging

  init() {
    // if (this.initialized) {
    //   console.log("FirebaseServices already initialized")
    //   return
    // }
    this.initialized = true

    console.log("initializing FirebaseServices")
    this.firebaseApp = firebase.initializeApp({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      appId: process.env.FIREBASE_APP_ID,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
    })
    this.auth = getAuth(this.firebaseApp)
    console.log("got auth", this.auth)

    // https://firebase.google.com/docs/firestore/manage-data/enable-offline#web-modular-api
    initializeFirestore(this.firebaseApp, {
      localCache:
        persistentLocalCache({tabManager: persistentMultipleTabManager()})
    })
    this.firestore = getFirestore(this.firebaseApp)
    console.log("got firestore", this.firestore)

    this.messaging = getMessaging(this.firebaseApp)
    console.log("got messaging", this.messaging)



    onMessage(this.messaging, (payload: any) => {
      console.log(' ===> Message received. ', payload);
      // ...
    });
  }

  getAuth() {
    return this.auth
  }

  getFirestore() {
    return this.firestore
  }

  getMessaging() {
    // console.log("getMessaging", this.firebaseApp)
    // if (!this.messaging) {
    //   this.firebaseApp = firebase.initializeApp({
    //     apiKey: process.env.FIREBASE_API_KEY,
    //     authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    //     projectId: process.env.FIREBASE_PROJECT_ID,
    //     appId: process.env.FIREBASE_APP_ID,
    //     messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
    //   })
    //   console.log("hier")
    //   return getMessaging(this.firebaseApp)
    // }
    return this.messaging
  }

  getMessageToken() {
    return getToken(this.messaging, {vapidKey: process.env.FIREBASE_MESSAGING_KEY});
  }
}

export default new FirebaseServices();
