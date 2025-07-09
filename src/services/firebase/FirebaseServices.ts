import { Auth } from 'firebase/auth/web-extension'
import { Firestore } from 'firebase/firestore'
import { FirebaseStorage } from 'firebase/storage'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'

class FirebaseServices implements IFirebaseServices {
  init() {}

  getAuth(): Auth {
    return null as unknown as Auth
  }

  getFirestore(): Firestore {
    return null
  }

  getStorage(): FirebaseStorage {
    return null as unknown as FirebaseStorage
  }
}

export default new FirebaseServices()
