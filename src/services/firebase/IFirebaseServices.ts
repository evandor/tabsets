import { Auth } from 'firebase/auth/web-extension'
import { FirebaseStorage } from 'firebase/storage'

interface IFirebaseServices {
  init(): void

  getAuth(): Auth

  getFirestore(): void

  getStorage(): FirebaseStorage
}

export default IFirebaseServices
