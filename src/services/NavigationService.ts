import {useNotificationsStore} from "src/stores/notificationsStore";
import {openURL, uid} from "quasar";
import {useTabsetService} from "src/services/TabsetService2";
import {useWindowsStore} from "src/windows/stores/windowsStore";
import JsUtils from "src/utils/JsUtils";
import {useGroupsStore} from "stores/groupsStore";
import {usePermissionsStore} from "stores/permissionsStore";
import {Suggestion, SuggestionType} from "src/suggestions/models/Suggestion";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import {FeatureIdent} from "src/models/AppFeatures";

const {handleSuccess} = useNotificationHandler()

class NavigationService {

  placeholderPattern = /\${[^}]*}/gm

  async openChromeTab(chromeTab: chrome.tabs.Tab) {
    const window = await chrome.tabs.highlight({windowId: chromeTab.windowId, tabs: chromeTab.index})
    if (typeof window.id === "number") {
      await chrome.windows.update(window.id, {focused: true})
    }
  }

  async openOrCreateTab(
    withUrls: string[],
    matcher: string | undefined = undefined,
    groups: string[] = [],
    forceCurrent: boolean = false,
    forceReload: boolean = false
  ) {
    withUrls.map(u => u.replace(this.placeholderPattern, ""));
    const useWindowIdent = this.getUseWindowIdent(forceCurrent, withUrls)
    console.log(` > opening url(s) ${withUrls} in window: '${useWindowIdent}', groups: '${groups}', mode: '${process.env.MODE}'`)

    const windowFromDb = await useWindowsStore().windowFor(useWindowIdent)
    const existingWindow = await useWindowsStore().currentWindowFor(useWindowIdent)

    if (useWindowIdent !== 'current') {
      //console.log("existingWindow", existingWindow)
      if (!existingWindow) {

        const createData: any = {url: withUrls}
        if (windowFromDb) {
          const w = windowFromDb.browserWindow
          createData['left' as keyof object] = w?.left || 50
          createData['top' as keyof object] = w?.top || 50 //(w.top || 0) < 0 ? 0 : w.top
          createData['width' as keyof object] = w?.width || 1200 //(w.width || -1) < 0 ? 600 : w.width
          createData['height' as keyof object] = w?.height || 800 //(w.top || -1) < 0 ? 400 : w.height
          // window does not exist anymore, remove from 'allWindows'
          await useWindowsStore().removeWindow(windowFromDb.id)
        }

        await this.createNewWindow(createData, useWindowIdent, withUrls, groups)

        return
      }
    }

    if (process.env.MODE === "bex") {
      for (const url of withUrls) {
        // get all tabs with this url
        const tabsForUrl = useTabsetsStore().tabsForUrl(url) || []
        tabsForUrl.forEach(t => {
          if (t.httpInfo) {
            t.httpError = ''
            t.httpInfo = ''

            const ts = useTabsetsStore().tabsetFor(t.id)
            if (ts) {
              //console.log("saving tabset ", ts)
              useTabsetService().saveTabset(ts)
            }
          }
        })
      }

      const useWindowId = existingWindow?.id || chrome.windows.WINDOW_ID_CURRENT
      const queryInfo = {windowId: useWindowId}

      // getting all tabs from this window
      chrome.tabs.query(queryInfo, (t: chrome.tabs.Tab[]) => {
        const ctx = this
        withUrls.forEach(function (url, i) {
          let found = false;
          t.filter(r => r.url)
            .map(r => {
              let matchCondition = url === r.url
              if (matcher && r.url) {
                //console.log("matcher yielded", JsUtils.match(matcher, r.url))
                matchCondition = JsUtils.match(matcher, r.url)
              }
              // console.log("===>", matchCondition, url, r.url)
              if (matchCondition) {
                if (!found) { // highlight only first hit
                  found = true
                  console.debug("found something", r)
                  if (r.active) {
                    handleSuccess(new ExecutionResult("", "already opened..."))
                  }
                  chrome.tabs.highlight({tabs: r.index, windowId: useWindowId});
                  chrome.windows.update(useWindowId, {focused: true})

                  if (forceReload && r.id) {
                    console.debug("forced reload")
                    chrome.tabs.reload(r.id)
                  }

                  if (groups.length > i) {
                    ctx.handleGroup(groups[i], useWindowId, r);
                  }
                }
              }
            });
          if (!found) {
            console.debug("tab not found, creating new one:", url)
            chrome.tabs.create({
              active: true,
              pinned: false,
              url: url,
              windowId: useWindowId
            }, (tab: chrome.tabs.Tab) => {
              chrome.windows.update(useWindowId, {focused: true})

              if (!usePermissionsStore().hasFeature(FeatureIdent.ANALYSE_TABS)) {
                setTimeout(() => {
                  // check potential redirect
                  chrome.tabs.get(tab.id || 0, (potentiallyChangedTab: chrome.tabs.Tab) => {
                    if (tab.url !== potentiallyChangedTab.url && tab.url?.trim() !== "" && potentiallyChangedTab.url?.trim() !== "") {
                      console.log("tab's URL change during one second, assuming 30x redirect, creating suggestion", tab, potentiallyChangedTab)
                      const suggestionId = uid()
                      const suggestion = new Suggestion(suggestionId,
                        "Tab's URL changed", "Seems like the tab's URL has changed according to the server. " +
                        "Should the URL be updated?",
                        "/suggestions/" + suggestionId,
                        SuggestionType.REDIRECT_HAPPENED_FOR_TAB)
                      suggestion.setData({url, location: potentiallyChangedTab.url})
                      useSuggestionsStore().addSuggestion(suggestion).catch((err) => {
                        console.log("got error", err)
                      })
                    }
                  })
                }, 1000)
              }

              if (groups.length > i) {
                ctx.handleGroup(groups[i], useWindowId, tab);
              }

            })

          }
        })
      })
    } else {
      openURL(withUrls[0])
    }
  }

  private getUseWindowIdent(forceCurrent: boolean, urls: string[]) {
    if (forceCurrent) {
      return 'current'
    } else if (urls.length === 1) {
      const tabs = useTabsetsStore().tabsForUrl(urls[0])
      if (tabs.length === 1) {
        const tabAndTabsetId = useTabsetsStore().getTabAndTabsetId(tabs[0].id)
        if (tabAndTabsetId) {
          return useTabsetsStore().getTabset(tabAndTabsetId.tabsetId)?.window || 'current'
        }
      }
      return useTabsetsStore().getCurrentTabset?.window || 'current';
    }
    return useTabsetsStore().getCurrentTabset?.window || 'current';
  }

  private handleGroup(group: string | undefined, useWindowId: number, r: chrome.tabs.Tab) {
    if (group && usePermissionsStore().hasFeature(FeatureIdent.TAB_GROUPS) && chrome?.tabs?.group) {
      console.log("handling current Group", group)
      const optionalGroup = useGroupsStore().currentGroupForName(group)
      if (!optionalGroup) {
        const props = {
          createProperties: {
            windowId: useWindowId
          },
          tabIds: [r.id || 0]
        }
        console.log("group not found, creating with", props)
        chrome.tabs.group(props, groupId => {
          console.log("groupId", groupId)
          const color = useGroupsStore().groupForName(group)?.color || 'grey'
          chrome.tabGroups.update(groupId, {
            collapsed: false,
            color: color,
            title: group
          })
        })
      } else {
        const props = {
          groupId: optionalGroup.id,
          tabIds: [r.id || 0]
        }
        console.log("updating group with", props)

        chrome.tabs.group(props, c => console.log("c", c))
      }
    }
  }

  openTab(tabId: number) {
    return chrome.tabs.update(tabId, {active: true})
  }

  async openSingleTab(url: string): Promise<chrome.tabs.Tab> {
    return await chrome.tabs.create({url: url})
  }

  closeChromeTab(tab: chrome.tabs.Tab) {
    console.log("closing chrome tab", tab.id, tab?.id)
    try {
      chrome.tabs.remove(tab.id || 0)
    } catch (err) {
      console.log("error clsosing chrome tab", err)
    }
  }

  updateAvailable(details: any) {
    console.log("details: UpdateAvailableDetails", details)
    useNotificationsStore().updateAvailable(true, details.version)
  }

  backOneTab() {
    const [tabId, url] = useTabsStore2().tabHistoryBack()
    this.openTab(tabId)
      .catch((err) => {
        useTabsStore2().chromeTabsHistoryNavigating = false
        this.openOrCreateTab([url])
      })
  }

  forwardOneTab() {
    const [tabId, url] = useTabsStore2().tabHistoryForward()
    this.openTab(tabId)
      .catch((err) => {
        useTabsStore2().chromeTabsHistoryNavigating = false
        this.openOrCreateTab([url])
      })
  }

  private async createNewWindow(createData: any, useWindowIdent: string, withUrls: string[], groups: string[]) {
    console.log("opening new window with", createData)
    // https://developer.chrome.com/articles/window-management/
    //let screenlabel: string | undefined = undefined
    // if ('getScreenDetails' in window) {
    //     // @ts-ignore
    //     const screens = await window.getScreenDetails();
    //     screenlabel = screens.currentScreen.label
    //     console.log("setting screenlabel to", screenlabel)
    // }

    chrome.windows.create(createData, (window) => {
      //console.log("creating window", useWindowIdent, window)
      if (chrome.runtime.lastError) {
        // probably out of bounds issues
        chrome.windows.create({}, (window) => {
          if (window) {
            this.createWindow(useWindowIdent, window, 0, withUrls, groups);
          }
        })
      } else if (window) {
        this.createWindow(useWindowIdent, window, 0, withUrls, groups);
      }
    })

  }

  private createWindow(useWindowIdent: string, window: chrome.windows.Window, index: number = 0, withUrls: string[], groups: string[]) {
    //useWindowsStore().assignWindow(useWindowIdent, window.id || 0)
    useWindowsStore().upsertWindow(window, useWindowIdent, index)
    const ctx = this
    withUrls.forEach(function (url, i) {
      if (groups.length > i) {
        const group = groups[i]
        if (group && window.id && window.tabs && window.tabs.length > i) {
          console.log("assiging group", group, i)
          ctx.handleGroup(group, window.id, window.tabs[i]);
        }
      }
    })
  }
}

export default new NavigationService();

