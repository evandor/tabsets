import { Auth } from 'firebase/auth/web-extension'
import { Database } from 'firebase/database'
import { Firestore } from 'firebase/firestore'
import { FirebaseStorage } from 'firebase/storage'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'

class FirebaseServices implements IFirebaseServices {
  init() {}

  getAuth(): Auth {
    return null as unknown as Auth
  }

  getFirestore(): Firestore {
    return null as unknown as Firestore
  }

  getStorage(): FirebaseStorage {
    return null as unknown as FirebaseStorage
  }

  getDatabase(): Database {
    return null as unknown as Database
  }
}

export default new FirebaseServices()
