import {Space} from "src/spaces/models/Space";

interface SpacesPersistence {

  getServiceName(): string

  init(): Promise<any>

  loadSpaces(): Promise<any>
  addSpace(space: Space): Promise<any>
  deleteSpace(spaceId: string): void;

  migrate(): any

  compactDb(): Promise<any>

}

export default SpacesPersistence
