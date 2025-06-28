export class PageData {
  constructor(
    public html: string,
    public metas: { [k: string]: string },
    public port?: string,
    public url?: string,
    public storage?: object,
    // storage: {
    //   tabsetsTabId: LocalStorage.getItem('tabsets_tabId'),
    //   tabsetsTimestamp: LocalStorage.getItem('tabsets_ts'),
    // },
  ) {}
}
