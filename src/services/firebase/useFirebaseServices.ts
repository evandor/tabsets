import FirebaseServices from 'src/services/firebase/FirebaseServices'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'
import FirebaseCloudServices from 'src/services/firebase/FirebaseCloudServices'

export function useFirebaseServices() {
  const firebaseServices: IFirebaseServices = FirebaseCloudServices

  FirebaseCloudServices.init()

  return {
    firebaseServices,
  }
}
