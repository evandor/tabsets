import {Tabset} from "src/models/Tabset";

class ChromeApi {

  async closeAllTabs() {
    console.log(" --- closing all tabs: start ---")
    const currentTab = await this.getCurrentTab()
    // @ts-ignore
    const t:chrome.tabs.Tab[] = await chrome.tabs.query({currentWindow: true})//, (t: chrome.tabs.Tab[]) => {
    console.log("checking tabs for closing", t)
    const ids: number[] = t.filter((r: chrome.tabs.Tab) => r.id !== currentTab.id)
      .filter(r => r.id !== undefined)
      .map(r => r.id || 0);
    console.log("ids to close", ids)
    if (ids.length > 0) {
      // @ts-ignore
      await chrome.tabs.remove(ids)
    }
    console.log(" --- closing all tabs: end ---")
  }

  getTabs() {
    return [];
  }

  async restore(tabset: Tabset) {
    console.log("restoring tabset ", tabset.id)
    const currentTab = await this.getCurrentTab()
    await this.closeAllTabs()
    console.log("proceeding...")

    // const t = await chrome.tabs.query({currentWindow: true})//, (t: chrome.tabs.Tab[]) => {
    // // @ts-ignore
    // const ids: number[] = t.filter((r: chrome.tabs.Tab) => !(r.title === 'Tabsets Extension'))
    //   .filter(r => r.id !== undefined)
    //   .map(r => r.id || 0);
    // console.log("ids to close", ids)
    // await chrome.tabs.remove(ids)
    await tabset.tabs.forEach(async t => {
      if (t.chromeTab.url !== currentTab.url) {
        console.log("creating tab", t.chromeTab.id)
        await chrome.tabs.create({
          active: false,
          index: t.chromeTab.index,
          pinned: t.chromeTab.pinned,
          url: t.chromeTab.url
        })
      } else {
        console.log("omitting opening current tab again")
      }
      /* .catch(e => {
         console.log("got error", e)
       })*/
    });
    //  });
  }

  async getCurrentTab(): Promise<chrome.tabs.Tab> {
    if (process.env.MODE !== 'bex') {
      return Promise.reject("not in bex mode")
    }
    let queryOptions = {active: true, lastFocusedWindow: true};
    // @ts-ignore
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

  highlight(tabIndex: number | undefined) {
    if (tabIndex) {
      chrome.tabs.highlight({tabs: tabIndex})
    }
  }

  async tabsForUrl(url: string | undefined): Promise<chrome.tabs.Tab[]> {
    if (url) {
      // @ts-ignore
      return await chrome.tabs.query({url: url})
    }
    return Promise.reject("url not defined")
  }

  async childrenFor(bookmarkFolderId: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    // @ts-ignore
    return await chrome.bookmarks.getChildren(bookmarkFolderId)
  }

  createChromeTabObject(title: string, url: string) {
    return {
      active: false,
      discarded: true,
      // @ts-ignore
      groupId: -1,
      autoDiscardable: true,
      index: 0,
      highlighted: false,
      title: title,
      pinned: false,
      url: url,
      windowId: 0,
      incognito: false,
      selected: false
    }
  }
}

export default new ChromeApi();

