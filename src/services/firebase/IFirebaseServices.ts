import { FirebaseStorage } from 'firebase/storage'

interface IFirebaseServices {
  init(): void

  getAuth(): void

  getFirestore(): void

  getStorage(): FirebaseStorage
}

export default IFirebaseServices
