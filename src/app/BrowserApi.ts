import _ from 'lodash'
import { LocalStorage, uid } from 'quasar'
import AppEventDispatcher from 'src/app/AppEventDispatcher'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import {
  CLEANUP_PERIOD_IN_MINUTES,
  EXTENSION_NAME,
  GITHUB_AUTO_BACKUP,
  MONITORING_PERIOD_IN_MINUTES,
} from 'src/boot/constants'
import { ContentItem } from 'src/content/models/ContentItem'
import { useContentService } from 'src/content/services/ContentService'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import ContentUtils from 'src/core/utils/ContentUtils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useMessagesStore } from 'src/messages/stores/messagesStore'
import { useRequestsService } from 'src/requests/services/RequestsService'
import { useRequestsStore } from 'src/requests/stores/requestsStore'
import NavigationService from 'src/services/NavigationService'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { GithubBackupCommand } from 'src/tabsets/commands/github/GithubBackupCommand'
import { Message } from 'src/tabsets/models/Message'
import { Tab } from 'src/tabsets/models/Tab'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { MonitoredTab, Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { v5 as uuidv5 } from 'uuid'
import { Router } from 'vue-router'

function runHousekeeping() {
  //console.log("housekeeping now...")
}

class BrowserApi {
  onHeadersReceivedListener = function (details: chrome.webRequest.WebResponseHeadersDetails) {
    if (details.url) {
      // store transient information
      useRequestsStore().setCurrentTabRequest(details)

      // save to db for existing tabs
      useRequestsService().logWebRequest(details)
    }
  }

  init(router: Router) {
    if (process.env.MODE !== 'bex') {
      return
    }

    // console.debug(' ...initializing ChromeApi')
    if (chrome && chrome.alarms) {
      try {
        chrome.alarms
          .create('housekeeping', { periodInMinutes: CLEANUP_PERIOD_IN_MINUTES })
          .catch((err: any) => console.warn('could not start housekeeping alarm due to ', err))

        chrome.alarms
          .create('hourlyTasks', { periodInMinutes: 60 })
          .catch((err: any) => console.warn('could not start hourlyTasks alarm due to ', err))

        chrome.alarms
          .create('monitoring', { periodInMinutes: MONITORING_PERIOD_IN_MINUTES })
          .catch((err: any) => console.warn('could not start monitoring alarm due to ', err))

        chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
          if (alarm.name === 'housekeeping') {
            runHousekeeping()
            //runThumbnailsHousekeeping(useTabsetService().urlExistsInATabset)
            //runContentHousekeeping(useTabsetService().urlExistsInATabset)
          } else if (alarm.name === 'monitoring') {
            if (useFeaturesStore().hasFeature(FeatureIdent.MONITOR)) {
              this.checkMonitors()
            }
          } else if (alarm.name === 'hourlyTasks') {
            if (LocalStorage.getItem(GITHUB_AUTO_BACKUP) as boolean) {
              useCommandExecutor().execute(new GithubBackupCommand())
            }
          } else {
            console.log('unknown alarm', alarm)
          }
        })
      } catch (err) {
        console.warn('ff issue with creating alarms, alarms deactivated due to', err)
      }
    }

    chrome.runtime.onUpdateAvailable.addListener((details: any) => {
      // NavigationService.updateAvailable(details)
    })

    this.startWebRequestListener()
  }

  startWebRequestListener() {
    //console.log(' ...adding WebRequestListener')
    chrome.webRequest?.onHeadersReceived.addListener(
      this.onHeadersReceivedListener,
      { urls: ['*://*/*'], types: ['main_frame'] },
      ['responseHeaders'],
    )
    chrome.webRequest?.onCompleted.addListener(
      (details: any) => {
        console.log('details!', details)
      },
      {
        urls: ['*://*/*/graphql'],
        types: ['xmlhttprequest'],
      },
      ['responseHeaders'],
    )
  }

  stopWebRequestListener() {
    if (chrome.webRequest) {
      //console.debug('removing WebRequestListener if running', chrome.webRequest)
      chrome.webRequest.onHeadersReceived.removeListener(this.onHeadersReceivedListener)
    }
  }

  buildContextMenu(caller: string) {
    if (process.env.MODE !== 'bex') {
      return
    }

    // console.log(' building context menu', caller)
    if (chrome && chrome.contextMenus) {
      chrome.contextMenus.removeAll(() => {
        //console.debug(' ...creating contextmenu for tabset_extension')
        chrome.contextMenus.create(
          {
            id: 'tabset_extension',
            title: EXTENSION_NAME,
            documentUrlPatterns: ['*://*/*'],
            contexts: ['all'],
          },
          () => {
            // chrome.contextMenus.create({
            //   id: 'open_tabsets_page',
            //   parentId: 'tabset_extension',
            //   title: 'Open Tabsets Extension',
            // documentUrlPatterns: ['https://*/*', 'https://*/'],
            //   contexts: ['all']
            // })
            if (useFeaturesStore().hasFeature(FeatureIdent.WEBSITE_CLIP)) {
              console.debug(' > context menu: website_clip')
              chrome.contextMenus.create({
                id: 'website_clip',
                parentId: 'tabset_extension',
                title: 'Create Website Clip',
                documentUrlPatterns: ['*://*/*'],
                contexts: ['all'],
              })
            }
            // chrome.contextMenus.create({
            //   id: 'website_quote',
            //   parentId: 'tabset_extension',
            //   title: 'Create Website Quote',
            // documentUrlPatterns: ['https://*/*', 'https://*/'],
            //   contexts: ['all']
            // })
            //}
            chrome.contextMenus.create({
              id: 'save_to_currentTS',
              parentId: 'tabset_extension',
              title: 'Save to current Collection (' + useTabsetsStore().currentTabsetName + ')',
              documentUrlPatterns: ['*://*/*'],
              contexts: ['all'],
            })

            chrome.contextMenus.create({
              id: 'separator_ignore_url',
              parentId: 'tabset_extension',
              type: 'separator',
              documentUrlPatterns: ['*://*/*'],
              contexts: ['all'],
            })
            chrome.contextMenus.create({
              id: 'ignore_url',
              parentId: 'tabset_extension',
              title: 'Ignore this URL in tabsets',
              documentUrlPatterns: ['*://*/*'],
              contexts: ['all'],
            })

            //console.log("context menu", useWindowsStore().currentBrowserWindows)
            const currentWindows = useWindowsStore().currentBrowserWindows
            if (currentWindows.length > 1) {
              chrome.contextMenus.create({
                id: 'move_to_window',
                parentId: 'tabset_extension',
                title: 'Move current tab...',
                contexts: ['all'],
              })
              // rest of logic in windowsStore
            }

            // if (useFeaturesStore().hasFeature(FeatureIdent.ANNOTATIONS)) {
            //   console.debug(" > context menu: annotate_website")
            //   chrome.contextMenus.create({
            //     id: 'annotate_website',
            //     parentId: 'tabset_extension',
            //     title: 'Annotate',
            //     documentUrlPatterns: ['https://*/*', 'https://*/'],
            //     contexts: ['all']
            //   })
            // }
            //console.debug(` > context menu: save_as_tabset for ${useTabsetsStore().tabsets.size} tabset(s)`)
            const allTabsets = [...useTabsetsStore().tabsets.values()] as Tabset[]

            if (allTabsets.length > 0) {
              chrome.contextMenus.create({
                id: 'separator',
                parentId: 'tabset_extension',
                type: 'separator',
                documentUrlPatterns: ['*://*/*'],
                contexts: ['all'],
              })
            }

            if (allTabsets.length > 15) {
              const result = _(allTabsets)
                .groupBy((o: any) => (o.name && o.name.length > 0 ? o.name[0].toUpperCase() : ' '))
                .map((tabsets: any, firstLetter: any) => ({ firstLetter, tabsets }))
                .sortBy((r: any) => r.firstLetter)
                .value()

              _.forEach(result, (r: any) => {
                chrome.contextMenus.create({
                  id: 'save_as_tab_folder|' + r.firstLetter,
                  parentId: 'tabset_extension',
                  title: 'Save to Tabset ' + r.firstLetter + '...',
                  documentUrlPatterns: ['*://*/*'],
                  contexts: ['all'],
                })

                _.forEach(_.sortBy(r.tabsets, ['name']), (ts: Tabset) => {
                  this.createSubmenu(ts, 'save_as_tab_folder|' + r.firstLetter, ts.name)
                })
              })
            } else {
              _.forEach(_.sortBy(allTabsets, ['name']), (ts: Tabset) => {
                this.createSubmenu(ts, 'tabset_extension', 'Save to Tabset ' + ts.name)
              })
            }
            //chrome.contextMenus.create({id: 'capture_text', parentId: 'tabset_extension', title: 'Save selection as/to Tabset', contexts: ['all']})
          },
        )
      })
      chrome.contextMenus.onClicked.addListener(
        (e: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab | undefined) => {
          //console.log("listening to", e, tab)
          if (e.menuItemId === 'open_tabsets_page') {
            chrome.tabs.query({ title: `Tabsets Extension` }, (result: chrome.tabs.Tab[]) => {
              if (result && result[0]) {
                chrome.tabs.highlight({ tabs: result[0].index })
              } else {
                // const selfId = localStorage.getItem("selfId")
                // if (selfId) {
                chrome.tabs.create({
                  active: true,
                  pinned: false,
                  //url: "chrome-extension://" + selfId + "/www/index.html#/start"
                  url: chrome.runtime.getURL('www/index.html#/start'),
                })
                // }
              }
            })
          } else if (e.menuItemId === 'website_clip') {
            console.log('creating Clip', tab)
            if (tab && tab.id) {
              this.executeClippingJS(tab.id)
            }
            // } else if (e.menuItemId === "website_quote") {
            //   console.log("creating Quote", tab)
            //   if (tab && tab.id) {
            //     this.executeQuoteJS(tab.id)
            //   }
          } else if (e.menuItemId === 'save_to_currentTS') {
            const tabId = tab?.id || 0
            useTabsetsStore()
              .getCurrentTabsetId()
              .then((currentTsId: string | undefined) => {
                if (currentTsId && tab) {
                  this.executeAddToTS(currentTsId, tab)
                }
              })
          } else if (e.menuItemId === 'ignore_url') {
            if (tab) {
              AppEventDispatcher.dispatchEvent('ignore_url', { url: tab.url })
            }
          } else if (e.menuItemId === 'annotate_website') {
            console.log('creating annotation JS', tab)
            if (tab && tab.id) {
              // this.executeAnnotationJS(tab.id)
            }
          } else if (e.menuItemId.toString().startsWith('save_as_tab|')) {
            //console.log("got", e, e.menuItemId.split("|"))
            const tabId = tab?.id || 0
            const tabsetId = e.menuItemId.toString().split('|')[1]
            console.log('got tabsetId', tabsetId, e.menuItemId)
            this.executeAddToTS(tabsetId!, tab!)
          } else if (e.menuItemId.toString().startsWith('move_to|')) {
            console.log('got', e, e.menuItemId.toString().split('|'))
            const tabId = tab?.id || 0
            const windowId = e.menuItemId.toString().split('|')[1]
            console.log('got windowId', tabId, windowId)
            this.executeMoveToWindow(tabId, Number(windowId))
          }
        },
      )
    }
  }

  private createSubmenu(ts: Tabset, parentId: string, title: string) {
    chrome.contextMenus.create({
      id: 'save_as_tab|' + ts.id,
      parentId,
      title,
      documentUrlPatterns: ['*://*/*'],
      contexts: ['all'],
    })
  }

  restore(tabset: Tabset, windowName: string | undefined = undefined, inNewWindow: boolean = true) {
    console.log('restoring tabset ', tabset.id, windowName, inNewWindow)

    const urlAndGroupArray: object[] = _.map(tabset.tabs, (t: Tab) => {
      return { url: t.url || '', group: t.groupName || undefined } //|| {url: '', group: undefined}
    })
    // console.log('restoring urls and groups:', urlAndGroupArray)
    if (inNewWindow && !windowName) {
      console.log('creating new window with urls', urlAndGroupArray)
      chrome.windows.create(
        {
          focused: true,
          left: 50,
          top: 50,
          url: _.map(urlAndGroupArray, (a: any) => a['url' as keyof object]),
        },
        (window: chrome.windows.Window | undefined) => {
          if (window) {
            console.log('got window', window.tabs)
            window.tabs?.forEach((t: chrome.tabs.Tab) => {
              const matchingTab = tabset.tabs.find((a: Tab) => {
                console.log('comparing1', a.url)
                console.log('comparing2', t.pendingUrl, t)
                return a.url === t.url || a.url === t.pendingUrl
              })
              console.log('matching tab', matchingTab?.url, matchingTab?.pinned)
              if (matchingTab && matchingTab.pinned) {
                chrome.tabs.update(t.id!, { pinned: true })
              }
            })
          }
        },
      )
    } else if (windowName) {
      console.log('creating new window with name', windowName)
      useTabsetsStore().selectCurrentTabset(tabset.id)
      useNavigationService()
        .openTabsInNewWindow(
          _.map(urlAndGroupArray, (a: any) => a['url' as keyof object]),
          windowName,
        )
        .then((window: chrome.windows.Window) => {
          setTimeout(() => {
            // update name
            const dbWindow = useWindowsStore().windowForId(window.id!, 'browserApi')
            console.log('updating name, got', dbWindow, window.id)
            if (dbWindow) {
              dbWindow.title = windowName
              useWindowsStore().upsertTabsetWindow(dbWindow)
            }
          }, 1000)
        })
      // NavigationService.openOrCreateTab(
      //   _.map(urlAndGroupArray, (a: any) => a['url' as keyof object]),
      //   undefined,
      //   _.map(urlAndGroupArray, (a: any) => a['group' as keyof object]),
      //)
    } else {
      console.log('opening urls', urlAndGroupArray)
      NavigationService.openOrCreateTab(
        _.map(urlAndGroupArray, (a: any) => a['url' as keyof object]),
        undefined,
        _.map(urlAndGroupArray, (a: any) => a['group' as keyof object]),
      )
    }
  }

  async getCurrentTab(): Promise<chrome.tabs.Tab> {
    if (process.env.MODE !== 'bex') {
      return Promise.reject('not in bex mode, but ' + process.env.MODE)
    }

    return new Promise((resolve, reject) => {
      let queryOptions = { active: true, lastFocusedWindow: true }
      try {
        chrome.tabs.query(queryOptions, function (tabs) {
          //console.log("got tab", tabs[0])
          resolve(tabs[0]!)
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  highlight(tabIndex: number | undefined) {
    if (tabIndex) {
      chrome.tabs.highlight({ tabs: tabIndex })
    }
  }

  async childrenFor(bookmarkFolderId: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    console.log('bookmarkFolderId', bookmarkFolderId)
    return chrome.bookmarks.getChildren('' + bookmarkFolderId)
  }

  createChromeTabObject(
    title: string,
    url: string,
    favIconUrl: string = 'https://tabsets.web.app/icons/favicon-128x128.png',
  ) {
    return {
      active: false,
      discarded: true,
      groupId: -1,
      autoDiscardable: true,
      favIconUrl: favIconUrl,
      index: 0,
      highlighted: false,
      title: title,
      pinned: false,
      url: url,
      name: '',
      windowId: 0,
      incognito: false,
      selected: false,
    }
  }

  createFolderNode(
    title: string,
    children: chrome.bookmarks.BookmarkTreeNode[] | undefined = undefined,
  ): chrome.bookmarks.BookmarkTreeNode {
    // index?: number | undefined;
    // dateAdded?: number | undefined;
    // dateGroupModified?: number | undefined;
    // parentId?: string | undefined;
    return {
      id: uid(),
      title,
      url: undefined,
      children,
    }
  }

  createBmNode(
    title: string,
    url: string,
    children: chrome.bookmarks.BookmarkTreeNode[] | undefined = undefined,
  ): chrome.bookmarks.BookmarkTreeNode {
    return {
      id: uid(),
      title,
      url: url,
      children,
    }
  }

  createChromeWindowObject(id: number, top: number, left: number, tabs: chrome.tabs.Tab[] = []) {
    return {
      id,
      alwaysOnTop: false,
      focused: true,
      incognito: false,
      height: 400,
      width: 600,
      top: top,
      left: left,
      state: 'normal' as chrome.windows.windowStateEnum,
      type: 'normal' as chrome.windows.windowTypeEnum,
      tabs,
    }
  }

  executeClippingJS(tabId: number) {
    chrome.scripting.insertCSS(
      {
        target: { tabId: tabId },
        files: ['assets/content.css'],
      },
      () => {
        const lastError = chrome.runtime.lastError
        if (lastError) {
          alert(JSON.stringify(lastError))
          return
        }
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['clipping.js'],
        })
      },
    )
  }

  async executeMoveToWindow(tabId: number, windowId: number) {
    try {
      const tab = await chrome.tabs.get(tabId)
      const url = tab.url
      if (!url || !tab.id) {
        return
      }
      console.log('found tab', tab.id, url)
      const window = await chrome.windows.get(windowId)
      console.log('found window', window.id)
      await chrome.tabs.create({ windowId: window.id, url: url })
      await chrome.tabs.remove(tab.id)
    } catch (err) {
      console.log('error', err)
    }
  }

  async checkMonitors() {
    const allTabsets: Tabset[] = [...useTabsetsStore().tabsets.values()] as Tabset[]
    const checkedTabs: { url: string; newHash: string; tabId: string; tabsetId: string }[] = []
    for (const ts of allTabsets) {
      for (const monitoredTab of ts.monitoredTabs || []) {
        const tabAndTabsetId: TabAndTabsetId | undefined = useTabsetsStore().getTabAndTabsetId(monitoredTab.tabId)
        if (tabAndTabsetId) {
          const url = tabAndTabsetId.tab.url
          if (url) {
            // console.log('monitoring for tabAndTabsetId', tabAndTabsetId, url)
            const res = await fetch(url)
            const html = await res.text()
            const tokens = ContentUtils.html2tokens(html)
            const hash = uuidv5([...tokens].join(' '), 'da42d8e8-2afd-446f-b72e-8b437aa03e46')
            console.log(`got hash ${hash} for ${url}`)
            checkedTabs.push({
              url: url,
              newHash: hash,
              tabId: tabAndTabsetId.tab.id,
              tabsetId: tabAndTabsetId.tabsetId,
            })
          }
        } else {
          // delete non-existing tab from monitors
          ts.monitoredTabs = ts.monitoredTabs.filter((mt: MonitoredTab) => mt.tabId !== monitoredTab.tabId)
          await useTabsetsStore().saveTabset(ts)
        }
      }
    }
    console.log('checkedTabs', checkedTabs)
    for (const changedTab of checkedTabs) {
      const existingContent = await useContentService().getContentFor(changedTab.url)
      if (existingContent && existingContent.contentHash && existingContent.contentHash !== changedTab.newHash) {
        console.log('found change!!!', existingContent.contentHash, changedTab.newHash)
        useMessagesStore().addMessage(
          new Message(
            uid(),
            new Date().getTime(),
            new Date().getTime(),
            'new',
            'Monitor: Tab Change...',
            'tab://' + changedTab.tabId,
          ),
          true,
        )
        useContentService()
          .getContent(changedTab.tabId)
          .then((c: ContentItem | undefined) => {
            if (c) {
              c.contentHash = changedTab.newHash
              useContentService().updateContent(changedTab.tabId, c)
            }
          })
        const ts = useTabsetsStore().getTabset(changedTab.tabsetId)
        const monitoredTabs = ts?.monitoredTabs
        if (monitoredTabs) {
          monitoredTabs.forEach((mt: MonitoredTab) => {
            if (mt.tabId === changedTab.tabId) {
              mt.changed = new Date().getTime()
            }
          })
          await useTabsetsStore().saveTabset(ts)
        }
      }
    }
  }

  executeAddToTS(tabsetId: string, tab: chrome.tabs.Tab) {
    const tabset = useTabsetsStore().getTabset(tabsetId)
    if (tabset && tab.url) {
      useCommandExecutor()
        .execute(new AddTabToTabsetCommand(new Tab(uid(), tab)))
        .then(() => {
          chrome.notifications?.create({
            title: 'Tabset Extension Message',
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/favicon-64x64.png'),
            message: `tab ${tab.url} has been created successfully`,
          })
        })
        .catch((err: any) => {
          console.log('catching rejection', err)
          chrome.notifications?.create({
            title: 'Tabset Extension Message',
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/favicon-64x64.png'),
            message: 'tab could not be added: ' + err,
          })
        })
    }

    // chrome.scripting.executeScript({
    //   target: { tabId: tabId, allFrames: true },
    //   args: [tabId, tabsetId],
    //   func: (tabId: number, tabsetId: string) => {
    //     if (window.getSelection()?.anchorNode && window.getSelection()?.anchorNode !== null) {
    //       const msg = {
    //         msg: 'addTabToTabset',
    //         tabId: tabId,
    //         tabsetId: tabsetId,
    //       }
    //       console.log('sending message', msg)
    //       chrome.runtime.sendMessage(msg, function (response) {
    //         console.log('created new tab in current tabset:', response)
    //         if (chrome.runtime.lastError) {
    //           console.warn('got runtime error', chrome.runtime.lastError)
    //         }
    //       })
    //     }
    //   },
    // })
  }

  // tabsetIndication = (color: string, tooltip: string) => {
  //   const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  //
  //   const iconTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title')
  //   iconTitle.textContent = tooltip
  //
  //   const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  //
  //   iconSvg.setAttribute('fill', 'none')
  //   iconSvg.setAttribute('viewBox', '0 0 24 24')
  //   iconSvg.setAttribute('stroke', color)
  //   iconSvg.setAttribute('width', '20')
  //   iconSvg.setAttribute('height', '20')
  //   iconSvg.setAttribute('style', 'position:fixed;top:3;right:3;z-index:2147483647')
  //   iconSvg.classList.add('post-icon')
  //
  //   iconPath.setAttribute(
  //     'd',
  //     'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  //   )
  //   iconPath.setAttribute('stroke-linecap', 'round')
  //   iconPath.setAttribute('stroke-linejoin', 'round')
  //   iconPath.setAttribute('stroke-width', '2')
  //
  //   iconSvg.appendChild(iconTitle)
  //   iconSvg.appendChild(iconPath)
  //   document.body.appendChild(iconSvg)
  // }

  async closeAllTabs(includingPinnedOnes: boolean = true) {
    const tabIds = (await chrome.tabs.query({}))
      .filter((t: chrome.tabs.Tab) => (includingPinnedOnes ? true : !t.pinned))
      .map((t: chrome.tabs.Tab) => t.id || 0)
    await chrome.tabs.create({})
    await chrome.tabs.remove(tabIds)
  }
}

export default new BrowserApi()
