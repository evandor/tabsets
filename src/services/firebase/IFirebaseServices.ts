import { Auth } from 'firebase/auth/web-extension'
import { Database } from 'firebase/database'
import { Firestore } from 'firebase/firestore'
import { FirebaseStorage } from 'firebase/storage'

interface IFirebaseServices {
  init(): void

  getAuth(): Auth

  getFirestore(): Firestore

  getStorage(): FirebaseStorage

  getDatabase(): Database
}

export default IFirebaseServices
