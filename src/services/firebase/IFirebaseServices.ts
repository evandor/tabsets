import { Auth } from 'firebase/auth/web-extension'
import { Firestore } from 'firebase/firestore'
import { FirebaseStorage } from 'firebase/storage'

interface IFirebaseServices {
  init(): void

  getAuth(): Auth

  getFirestore(): Firestore

  getStorage(): FirebaseStorage
}

export default IFirebaseServices
