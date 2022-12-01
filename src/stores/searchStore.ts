import {defineStore} from 'pinia';
import Fuse from 'fuse.js'
import _ from "lodash"
import {SearchDoc} from "src/models/SearchDoc";
import throttledQueue from "throttled-queue";
import {useWindowsStore} from "src/stores/windowsStores";
import {Tabset} from "src/models/Tabset";
import {useTabsStore} from "src/stores/tabsStore";
import {ref} from "vue";
import {Tab} from "src/models/Tab";

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

export const useSearchStore = defineStore('search', () => {

  const term = ref(null as unknown as string)

  const history = ref([] as unknown as string[])

  const searchIndex = ref(null as unknown as any)

  const fuse = ref(null as unknown as Fuse<SearchDoc>)

  const options = ref({
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
  })

  async function init() {
    console.log("initializing searchStore")
    searchIndex.value = Fuse.createIndex(options.value.keys, [])
    fuse.value = new Fuse([], options.value, searchIndex.value)


  }

  function getIndex() {
    if (fuse.value) {
      return fuse.value.getIndex()
    }
    console.log("hierxxxx")
  }

  function search(term: string) {
    return fuse.value.search(term)
  }

  function remove(f: any) {
    fuse.value.remove(f)
  }

  function addToIndex(id: string, name: string, title: string, url: string, description: string, content: string, tabsets: string[], favIconUrl: string): number {
    const doc: SearchDoc = new SearchDoc(
      id, name, title, url, description, content, tabsets, favIconUrl
    )
    console.log("adding to index", doc)
    // @ts-ignore
    const indexLength = fuse.value.getIndex().size()
    //console.log("adding to index: ", indexLength, doc)
    fuse.value.add(doc)
    return indexLength
  }

  function reindexAll() {
    const values = Array.from(useTabsStore().tabsets.values())
    reindex(values)
  }

  function reindexTabset(tabsetId: string) {
    const ts = useTabsStore().getTabset(tabsetId)
    const values: Tabset[] = ts ? [ts] : []
    reindex(values)
  }

  function reindex(values: Tabset[]) {
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
  }

  /**
   * Initial population of search index when the extension is reloaded (and when run the first time, which
   * is more a no-op)
   *
   * @param contentPromise
   */
  function populate(contentPromise: Promise<any[]>) {
    console.log("populating searchstore...")

    const minimalIndex: SearchDoc[] = []
    const urlSet: Set<string> = new Set()
    _.forEach([...useTabsStore().tabsets.values()], (tabset: Tabset) => {
        tabset.tabs.forEach((tab: Tab) => {
          if (tab.chromeTab?.url) {
            if (urlSet.has(tab.chromeTab.url)) {
              const existingDocIndex = _.findIndex(minimalIndex, d => d.url === tab.chromeTab.title)
              if (existingDocIndex >= 0) {
                const existingDoc = minimalIndex[existingDocIndex]
                existingDoc.tabsets = existingDoc.tabsets.concat([tabset.id])
                minimalIndex.splice(existingDocIndex, 1,)
              }
            } else {
              const doc = new SearchDoc("", "", tab.chromeTab.title || '', tab.chromeTab.url, "", "", [tabset.id], "")
              minimalIndex.push(doc)
              urlSet.add(tab.chromeTab.url)
            }
          }

        })
      }
    )

    minimalIndex.forEach((doc: SearchDoc) => fuse.value.add(doc))

    contentPromise
      .then(content => {
        const permanentContent = _.filter(content, c => c.expires === 0)
        console.log(`... with ${permanentContent.length} entries, ${content.length - permanentContent.length} is/are filtered due to expiry date`)

        permanentContent.forEach(c => {
          fuse.value.remove((doc) => {
            return doc.url === c.url
          })
          fuse.value.add(c)
        })
      })
  }

  return {init, populate, getIndex, addToIndex, remove, term, search}
})
