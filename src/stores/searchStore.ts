import {defineStore} from 'pinia';
import Fuse from 'fuse.js'
import _ from "lodash"
import {SearchDoc} from "src/models/SearchDoc";
import {Tabset} from "src/models/Tabset";
import {useTabsStore} from "src/stores/tabsStore";
import {ref} from "vue";
import {Tab} from "src/models/Tab";
//import TabsetService from "src/services/TabsetService";
import throttledQueue from "throttled-queue";
import {useWindowsStore} from "src/stores/windowsStores";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import {useTabsetService} from "src/services/TabsetService2";
import {useUiStore} from "src/stores/uiStore";
import {uid} from "quasar";

function dummyPromise(timeout: number, tabToCloseId: number | undefined = undefined): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (tabToCloseId) {
        //chrome.tabs.remove(tabToCloseId)
      }
      resolve("Success!");
    }, timeout);
  });
}


function overwrite(ident: string, doc: SearchDoc, removed: SearchDoc[]) {
  if (!doc[ident as keyof object]) {
    doc[ident as keyof object] = removed[0][ident as keyof object]
  }
}

export const useSearchStore = defineStore('search', () => {

  const {urlExistsInATabset} = useTabsetService()

  const term = ref<string>('')

  const history = ref([] as unknown as string[])

  const searchIndex = ref(null as unknown as any)

  const fuse = ref(null as unknown as Fuse<SearchDoc>)

  const stats = ref<Map<string, number>>(new Map())

  const options = ref({
    keys: [
      {name: 'name', weight: 10},
      {name: 'title', weight: 6},
      {name: 'url', weight: 4},
      {name: 'description', weight: 3},
      {name: 'keywords', weight: 2},
      {name: 'content', weight: 1}
    ],
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 3,
    threshold: 0.0,
    // ignoreFieldNorm: true
    ignoreLocation: true,
    useExtendedSearch: true
  })

  async function init() {
    console.debug("initializing searchStore")
    searchIndex.value = Fuse.createIndex(options.value.keys, [])
    fuse.value = new Fuse([], options.value, searchIndex.value)
  }

  function getIndex(): Fuse.FuseIndex<SearchDoc> {
    return fuse.value.getIndex()
  }

  function search(term: string, limit: number | undefined = undefined) {
    if (limit) {
      return fuse.value.search(term, {limit})
    }
    return fuse.value.search(term)
  }

  function remove(f: any) {
    fuse.value.remove(f)
  }

  function addToIndex(id: string, name: string, title: string, url: string, description: string, content: string, tabsets: string[], favIconUrl: string): number {
    const doc: SearchDoc = new SearchDoc(
      id, name, title, url, description, '', content, tabsets, '', favIconUrl
    )
    //console.log("adding to index", doc)
    // @ts-ignore
    const indexLength = fuse.value.getIndex().size()
    //console.log("adding to index: ", indexLength, doc)
    fuse.value.add(doc)
    return indexLength
  }

  function update(url: string, key: string, value: string) {
    if (!fuse || !fuse.value) {
      return // called too early?
    }
    const removed: SearchDoc[] = fuse.value.remove((doc: SearchDoc) => doc.url === url)
    if (removed && removed.length > 0) {
      let newDoc: SearchDoc = removed[0]
      switch (key) {
        case 'name':
          newDoc.name = value
          break
        case 'description':
          newDoc.description = value
          break
        case 'keywords':
          newDoc.keywords = value
          break
        default:
          console.log("could not update", key)
      }
      fuse.value.add(newDoc)
    }
  }

  // function reindexAll() {
  //   const values = Array.from(useTabsStore().tabsets.values())
  //   reindex(values)
  // }
  //
  function reindexTabset(tabsetId: string) {
    const ts = useTabsStore().getTabset(tabsetId)
    const values: Tabset[] = ts ? [ts] : []
    reindex(values)
  }

  async function reindexTab(tab: Tab): Promise<number> {
    const window = await chrome.windows.create({focused: true, width: 1024, height: 800})
    // @ts-ignore
    if (window) {
      // @ts-ignore
      useWindowsStore().screenshotWindow = window.id
      // @ts-ignore
      let tabToClose = await chrome.tabs.create({windowId: window.id, url: tab.chromeTab.url})
      // @ts-ignore
      if (tabToClose) {
        // @ts-ignore
        const promise = dummyPromise(3000, tabToClose.id)
        return promise.then((res) => {
          // try {
          //   chrome.windows.remove(window.id);
          // } catch (err) {
          //   console.log("err", err)
          // }
          // @ts-ignore
          return window.id
        })
      }
      return Promise.reject("could not get tab")
    }
    return Promise.reject("could not get window")

    // chrome.windows.create({focused: true, width: 1024, height: 800}, (window: any) => {
    //   useWindowsStore().screenshotWindow = window.id
    //   let tabToClose: number | undefined = undefined
    //
    //   chrome.tabs.create({windowId: window.id, url: tab.chromeTab.url}, (tab: chrome.tabs.Tab) => {
    //     tabToClose = tab.id
    //     //dummyPromise(3000, tab.id)
    //   })
    //   // const promise = dummyPromise(3000)
    //   //
    //   // promise
    //   //   .then(() => {
    //   //     chrome.windows.remove(window.id)
    //   //     useWindowsStore().screenshotWindow = null as unknown as number
    //   //     const proxy = getCurrentInstance()?.proxy
    //   //       if (proxy) {
    //   //         console.log("proxy", proxy)
    //   //         proxy.$forceUpdate()
    //   //       }
    //   //   })
    //
    // })
  }

  function reindex(values: Tabset[]) {
    const throttleOnePerXSeconds = throttledQueue(1, 3000, true)
    chrome.windows.create({focused: true, width: 1024, height: 800}, (window: any) => {
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
   * Initial population of search index when the extension is reloaded (and when run the first time)
   *
   * @param contentPromise
   */
  async function populate(contentPromise: Promise<any[]>) {
    console.debug("populating searchstore...")

    await init()

    const urlSet: Set<string> = new Set()

    // --- add data from stored content
    let count = 0
    let countFiltered = 0
    let overwritten = 0
    const content = await contentPromise
    // .then(content => {
    content.forEach(c => {
      if (c.expires === 0 || urlExistsInATabset(c.url)) {
        const searchDoc = new SearchDoc(c.id, c.name, c.title, c.url, c.description, c.keywords, c.content, c.tabsets, '', c.favIconUrl)
        if (c.metas && c.metas['description']) {
          searchDoc.description = c.metas['description']
        }
        if (c.metas && c.metas['keywords']) {
          searchDoc.keywords = c.metas['keywords']
        }
        const removed = fuse.value.remove((doc) => {
          return doc.url === searchDoc.url
        })
        overwritten += removed.length
        fuse.value.add(searchDoc)
        urlSet.add(c.url)
        count++
      } else {
        countFiltered++
      }
    })
    console.log(`populated from content with ${count} entries (${overwritten} of which overwritten), ${countFiltered} is/are filtered (not in any tab)`)
    //useUiStore().setContentCount(count - countFiltered)
    stats.value.set("content.count", count)
    stats.value.set("content.overwritten", overwritten)
    stats.value.set("content.filtered", countFiltered)
    // })

    // --- add data from tabs directly, like url and title
    const minimalIndex: SearchDoc[] = []
    //const res = fuse.value.remove((doc) => true)
    console.log("url", urlSet)
    _.forEach([...useTabsStore().tabsets.values()], (tabset: Tabset) => {
        tabset.tabs.forEach((tab: Tab) => {
          console.log("checking", tab.chromeTab.url, urlSet.has(tab.chromeTab.url || ''))
          if (tab.chromeTab?.url) {
            if (urlSet.has(tab.chromeTab.url)) {
              const existingDocIndex = _.findIndex(minimalIndex, d => {
                console.log("=", d.url, tab.chromeTab.title)
                return d.url === tab.chromeTab.title
              })
              if (existingDocIndex >= 0) {
                const existingDoc = minimalIndex[existingDocIndex]
                console.log("existingDoc", existingDoc)
                if (existingDoc.tabsets.indexOf(tabset.id) < 0) {
                  existingDoc.tabsets = existingDoc.tabsets.concat([tabset.id])
                  minimalIndex.splice(existingDocIndex, 1, existingDoc)
                }
              } else {
                const doc = new SearchDoc(uid(), tab.name || '', tab.chromeTab.title || '', tab.chromeTab.url, "", "", "", [tabset.id], '', "")
                minimalIndex.push(doc)
              }
            } else {
              const doc = new SearchDoc(uid(), tab.name || '', tab.chromeTab.title || '', tab.chromeTab.url, "", "", "", [tabset.id], '', "")
              minimalIndex.push(doc)
              urlSet.add(tab.chromeTab.url)
            }
          }
        })
      }
    )
    console.log(`populated from tabsets with ${minimalIndex.length} entries`)
    minimalIndex.forEach((doc: SearchDoc) => {
      console.log("adding to fuse:", doc)
      const removed = fuse.value.remove((d) => {
        return d.url === doc.url
      })
      if (removed && removed[0]) {
        overwrite('name', doc, removed)
        overwrite('description', doc, removed)
        overwrite('keywords', doc, removed)
        overwrite('content', doc, removed)

      }
      fuse.value.add(doc)
    })
    console.log("fuse... after", fuse.value.getIndex())

    // --- add data from bookmarks directly, like url and title
    const indexFromBookmarks: SearchDoc[] = []
    _.forEach(useBookmarksStore().bookmarksLeaves, (bookmark: any) => {
        if (bookmark && bookmark.url && !urlSet.has(bookmark.url)) {
          // console.log("bookmark", bookmark)
          urlSet.add(bookmark.url)
          const doc = new SearchDoc("", "", bookmark.title || '', bookmark.url, "", "", "", [], bookmark.id, "")
          indexFromBookmarks.push(doc)
        }
      }
    )
    console.log(`populated from bookmarks with ${indexFromBookmarks.length} entries`)
    indexFromBookmarks.forEach((doc: SearchDoc) => fuse.value.add(doc))


  }

  function indexTabs(tsId: string, tabs: Tab[]) {
    const minimalIndex: SearchDoc[] = []
    const urlSet: Set<string> = new Set()
    tabs.forEach((tab: Tab) => {
      if (tab.chromeTab?.url) {
        if (!urlSet.has(tab.chromeTab.url)) {
          const doc = new SearchDoc("", "", tab.chromeTab.title || '', tab.chromeTab.url, "", "", "", [tsId], '', "")
          minimalIndex.push(doc)
          urlSet.add(tab.chromeTab.url)
        }
      }
    })
    if (fuse.value) {
      minimalIndex.forEach((doc: SearchDoc) => fuse.value.add(doc))
    }
  }

  return {
    init,
    populate,
    getIndex,
    addToIndex,
    remove,
    term,
    search,
    indexTabs,
    update,
    reindexTabset,
    reindexTab,
    stats
  }
})
