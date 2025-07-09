import FirebaseServices from 'src/services/firebase/FirebaseServices'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'

export function useFirebaseServices() {
  const firebaseServices: IFirebaseServices = FirebaseServices

  return {
    firebaseServices,
  }
}
