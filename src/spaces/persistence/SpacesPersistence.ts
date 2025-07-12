import { Space } from 'src/spaces/models/Space'

interface SpacesPersistence {
  getServiceName(): string

  init(): Promise<any>

  getSpaces(): Promise<Space[]>
  addSpace(space: Space): Promise<any>
  deleteSpace(spaceId: string): void

  migrate(): any
  clear(name: string): void
}

export default SpacesPersistence
