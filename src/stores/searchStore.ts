import {defineStore} from 'pinia';
import Fuse from 'fuse.js'
import _ from "lodash"
import {SearchDoc} from "src/models/SearchDoc";
import throttledQueue from "throttled-queue";
import {useWindowsStore} from "src/stores/windowsStores";
import {Tabset} from "src/models/Tabset";
import {useTabsStore} from "src/stores/tabsStore";

function dummyPromise(timeout: number, tabToCloseId: number | undefined = undefined) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (tabToCloseId) {
        chrome.tabs.remove(tabToCloseId)
      }
      resolve("Success!");
    }, timeout);
  });
}

export const useSearchStore = defineStore('search', {
  state: () => ({

    term: null as unknown as string,

    history: [] as unknown as string[],

    searchIndex: null as unknown as any,

    fuse: null as unknown as Fuse<SearchDoc>,

    options: {
      keys: [
        {name: 'name', weight: 5},
        {name: 'title', weight: 4},
        {name: 'description', weight: 3},
        {name: 'url', weight: 3},
        {name: 'content', weight: 1}
      ],
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 3,
      // ignoreFieldNorm: true
      ignoreLocation: true
    }

  }),

  getters: {},

  actions: {
    async init() {
      //console.log("initializing search index...")
      this.searchIndex = Fuse.createIndex(this.options.keys, [])
      this.fuse = new Fuse([], this.options, this.searchIndex)
    },
    addToIndex(id: string, name: string, title: string, url: string, description: string, content: string, tabsets: string[], favIconUrl: string): number {
      const doc: SearchDoc = new SearchDoc(
        id, name, title, url, description, content, tabsets, favIconUrl
      )
      // @ts-ignore
      const indexLength = this.fuse.getIndex().size()
      //console.log("adding to index: ", indexLength, doc)
      this.fuse.add(doc)
      return indexLength
    },
    reindexAll() {
      const values = Array.from(useTabsStore().tabsets.values())
      this.reindex(values)
    },
    reindexTabset(tabsetId: string) {
      const ts = useTabsStore().getTabset(tabsetId)
      const values: Tabset[] = ts ? [ts] : []
      this.reindex(values)
    },
    reindex(values: Tabset[]) {
      const throttleOnePerXSeconds = throttledQueue(1, 3000, true)
      chrome.windows.create({focused: true}, (window: any) => {
        useWindowsStore().screenshotWindow = window.id
        let tabToClose: number | undefined = undefined

        const res: Promise<any>[] = values.flatMap((ts: Tabset) => {
          return ts.tabs.map((t) => {
            return throttleOnePerXSeconds(async () => {
              chrome.tabs.create({windowId: window.id, url: t.chromeTab.url}, (tab: chrome.tabs.Tab) => {
                tabToClose = tab.id
                dummyPromise(3000, tab.id)
              })
              return dummyPromise(3000)
            })
          })
        })

        Promise.all(res)
          .then(() => {
            chrome.windows.remove(window.id)
            useWindowsStore().screenshotWindow = null as unknown as number
          })

      })
    },

    populate(contentPromise: Promise<any[]>) {
      console.log("populating searchstore...")
      contentPromise
        .then(content => {
          const permanentContent = _.filter(content, c => c.expires === 0)
          console.log(`... with ${permanentContent.length} entries, rest of ${content.length} is filtered as it has an expiry date`)
          this.searchIndex = Fuse.createIndex(this.options.keys, permanentContent)
          this.fuse = new Fuse(permanentContent, this.options, this.searchIndex)
        })
    }

  }
});
