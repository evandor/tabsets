import { initializeApp } from 'firebase/app'
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth/web-extension'
import { connectDatabaseEmulator, Database, getDatabase } from 'firebase/database'
import { connectFirestoreEmulator, Firestore, getFirestore, initializeFirestore } from 'firebase/firestore'
import { connectStorageEmulator, FirebaseStorage, getStorage } from 'firebase/storage'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'
import { useUiStore } from 'src/ui/stores/uiStore'

class FirebaseCloudServices implements IFirebaseServices {
  private firebaseApp: any = null //firebase.app.App = null as unknown as firebase.app.App
  private auth: Auth = null as unknown as Auth
  private firestore: Firestore = null as unknown as Firestore
  // private messaging: Messaging = null as unknown as Messaging
  private storage: FirebaseStorage = null as unknown as FirebaseStorage
  private database: Database = null as unknown as Database

  // private realtimeDb: Database = null as unknown as Database

  private firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY as string,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN as string,
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    appId: process.env.FIREBASE_APP_ID as string,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET as string,
    databaseURL: process.env.FIREBASE_DATABASE_URL as string,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID as string,
  }

  init() {
    // console.log('initializing FirebaseServices')
    this.firebaseApp = initializeApp(this.firebaseConfig)
    this.auth = getAuth(this.firebaseApp)
    if (process.env.TABSETS_STAGE === 'EMULATOR') {
      useUiStore().setWatermark('emulator')
      // console.warn('using firebase emulators for auth, storage and firestore')
      connectAuthEmulator(this.auth, 'http://127.0.0.1:9099', {disableWarnings: true})
      const db = getFirestore()
      connectFirestoreEmulator(db, '127.0.0.1', 8080)
      connectStorageEmulator(getStorage(), '127.0.0.1', 9199)
      connectDatabaseEmulator(getDatabase(), '127.0.0.1', 9000)
    } else if (process.env.TABSETS_STAGE?.toLowerCase() !== 'prd') {
      useUiStore().setWatermark(process.env.TABSETS_STAGE || '???')
    }

    // https://firebase.google.com/docs/firestore/manage-data/enable-offline#web-modular-api
    // initializeFirestore(this.firebaseApp, {
    //   localCache:
    //     persistentLocalCache({tabManager: persistentMultipleTabManager()})
    // })
    initializeFirestore(this.firebaseApp, {})
    this.firestore = getFirestore(this.firebaseApp)
    this.storage = getStorage(this.firebaseApp)
    this.database = getDatabase(this.firebaseApp)
    //console.log('initializing FirebaseServices -- done')
  }

  getAuth() {
    return this.auth
  }

  getFirestore(): Firestore {
    return this.firestore
  }

  getStorage(): FirebaseStorage {
    return this.storage
  }

  getDatabase(): Database {
    return this.database
  }
}

export default new FirebaseCloudServices()
