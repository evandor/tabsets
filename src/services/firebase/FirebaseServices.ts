import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import {getStorage, FirebaseStorage} from "firebase/storage";
import {getDatabase, Database} from "firebase/database";
import {getAuth, Auth} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

class FirebaseServices {

  private firebaseApp: firebase.app.App = null as unknown as firebase.app.App
  private auth: Auth = null as unknown as Auth
  private firestore: Firestore = null as unknown as Firestore
  private realtimeDb: Database = null as unknown as Database
  private storage: FirebaseStorage = null as unknown as FirebaseStorage

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

    // this.messaging = getMessaging(this.firebaseApp)
    //console.log("got messaging", this.messaging)

    this.storage = getStorage(this.firebaseApp)

    this.realtimeDb = getDatabase(this.firebaseApp)

  }

  getAuth() {
    console.log("returning auth", this.auth)
    return this.auth
  }

  getFirestore() {
    return this.firestore
  }

  getMessaging() {
    return null// this.messaging
  }

  getStorage() {
    return this.storage
  }

  getMessageToken() {
    return null//getToken(this.messaging, {vapidKey: process.env.FIREBASE_MESSAGING_KEY});
  }

  getRealtimeDb() {
    return this.realtimeDb
  }
}

export default new FirebaseServices();
