// 2 expected diffs to localstorage
import { Tabset, TabsetSharing } from 'src/tabsets/models/Tabset'

interface TabsetsPersistence {
  getServiceName(): string

  init(): Promise<any>

  loadTabsets(): Promise<any>

  reloadTabset(tabsetId: string): Promise<Tabset>

  addTabset(ts: Tabset): Promise<any>

  saveTabset(ts: Tabset): Promise<any>

  deleteTabset(tabsetId: string): Promise<any>

  compactDb(): Promise<any>

  clear(name: string): void

  share(
    tabset: Tabset,
    sharing: TabsetSharing,
    sharedId: string | undefined,
    sharedBy: string | undefined,
  ): Promise<TabsetSharing | void>

  shareWith(
    tabset: Tabset,
    email: string,
    readonly: boolean,
    sharedBy: string | undefined,
  ): Promise<TabsetSharing | void>

  loadPublicTabset(sharedId: string, sharedBy: string | undefined): Promise<Tabset>

  // optional migration code for 0.4.11 to 0.5.0
  migrate(): any
}

export default TabsetsPersistence
