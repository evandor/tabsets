import IFirebaseServices from 'src/services/firebase/IFirebaseServices'

interface Persistence {
  getServiceName(): string

  init(firebaseServices: IFirebaseServices): Promise<any>

  compactDb(): Promise<any>
}

export default Persistence
