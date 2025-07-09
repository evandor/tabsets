import { FirebaseStorage } from 'firebase/storage'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'

class FirebaseServices implements IFirebaseServices {
  init() {}

  getAuth() {
    return null
  }

  getFirestore(): any {
    return null
  }

  getStorage(): FirebaseStorage {
    return null as unknown as FirebaseStorage
  }
}

export default new FirebaseServices()
