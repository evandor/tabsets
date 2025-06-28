import { TabsetSharing } from 'src/tabsets/models/Tabset'

export class SharingInfo {
  sharing: TabsetSharing = TabsetSharing.UNSHARED
  sharedBy: string | undefined = undefined
  sharedById: string | undefined = undefined
  sharedId: string | undefined = undefined
  sharedAt: number | undefined = undefined
  sharedPath: string | undefined = undefined // e.g. /pwa/imp/AlCYSrGGmOnsOnf0htA9?n=c2hvcHBpbmc=
  shareReference: string | undefined = undefined

  constructor() {
    this.sharing = TabsetSharing.UNSHARED
  }
}
