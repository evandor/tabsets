import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import {getStorage} from "firebase/storage";
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

  private firebaseApp: firebase.app.App = null as unknown as firebase.app.App
  private auth: Auth = null as unknown as Auth
  private firestore: Firestore = null as unknown as Firestore
  private messaging: Messaging = null as unknown as Messaging
  private storage: Messaging = null as unknown as Messaging

  init() {

    if (!process.env.USE_FIREBASE) {
      return
    }
    console.log("initializing FirebaseServices")
    this.firebaseApp = firebase.initializeApp({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      appId: process.env.FIREBASE_APP_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
    })
    this.auth = getAuth(this.firebaseApp)
    //console.log("got auth", this.auth)

    // https://firebase.google.com/docs/firestore/manage-data/enable-offline#web-modular-api
    initializeFirestore(this.firebaseApp, {
      localCache:
        persistentLocalCache({tabManager: persistentMultipleTabManager()})
    })
    this.firestore = getFirestore(this.firebaseApp)
    //console.log("got firestore", this.firestore)

    //this.messaging = getMessaging(this.firebaseApp)
    //console.log("got messaging", this.messaging)

    this.storage = getStorage(this.firebaseApp)

  }

  getAuth() {
    console.log("returning auth", this.auth)
    return this.auth
  }

  getFirestore() {
    return this.firestore
  }

  getMessaging() {
    return this.messaging
  }

  getStorage() {
    return this.storage
  }

  getMessageToken() {
    return getToken(this.messaging, {vapidKey: process.env.FIREBASE_MESSAGING_KEY});
  }
}

export default new FirebaseServices();
