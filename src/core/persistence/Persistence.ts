interface Persistence {
  getServiceName(): string

  init(): Promise<any>

  compactDb(): Promise<any>
}

export default Persistence
