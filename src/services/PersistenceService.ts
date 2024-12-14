// Deprecated
interface PersistenceService {

  getServiceName(): string

  cleanUpRequests(): Promise<void>

  compactDb(): Promise<any>

  clear(name: string):any

}

export default PersistenceService
