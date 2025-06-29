// Deprecated
import { Account } from 'src/core/models/Account'

interface PersistenceService {
  getServiceName(): string

  cleanUpRequests(): Promise<void>

  compactDb(): Promise<any>

  getAccount(accountId: string): Promise<Account>
  upsertAccount(account: Account): void

  clear(name: string): any
}

export default PersistenceService
