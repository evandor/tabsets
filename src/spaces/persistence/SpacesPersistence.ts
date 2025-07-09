import IFirebaseServices from 'src/services/firebase/IFirebaseServices'
import { Space } from 'src/spaces/models/Space'

interface SpacesPersistence {
  getServiceName(): string

  init(firebaseServices: IFirebaseServices): Promise<any>

  loadSpaces(): Promise<any>
  addSpace(space: Space): Promise<any>
  deleteSpace(spaceId: string): void

  // optional migration code for 0.4.11 to 0.5.0
  migrate(): any

  compactDb(): Promise<any>

  clear(name: string): void
}

export default SpacesPersistence
