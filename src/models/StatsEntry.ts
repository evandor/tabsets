export class StatsEntry {

  constructor(
    public date: string,
    public tabsets: number,
    public openTabsCount: number,
    public tabsCount: number,
    public bookmarksCount: number,
    public storageUsage: number
  ) {

  }

}
