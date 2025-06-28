import { DialogChainObject, QVueGlobals, uid } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { DefaultActions } from 'src/tabsets/actionHandling/handler/DefaultActions'
import { ExcalidrawStorage } from 'src/tabsets/actionHandling/model/ExcalidrawStorage'
import {
  AddUrlToTabsetHandlerAdditionalData,
  ComponentWithContext,
  TabActionMatcher,
} from 'src/tabsets/actionHandling/TabActionMatcher'
import ExcalidrawSaveAsFileAction from 'src/tabsets/actions/excalidraw/ExcalidrawSaveAsFileAction.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'

const urlMatcher = /^https:\/\/excalidraw\.com\/$/

export class ExcalidrawAddUrlToTabsetHandler implements TabActionMatcher {
  constructor(public $q: QVueGlobals | undefined) {}

  tabMatcher(url: string, content: string, metas: object): boolean {
    return url.match(urlMatcher) !== null || 'https://excalidraw.com' === metas['og:url' as keyof object]
  }

  async injectScript(): Promise<void> {
    const currentBrowserTab = useTabsStore2().currentChromeTab
    if (!currentBrowserTab || !currentBrowserTab.id) {
      return Promise.reject('no current browser tab found')
    }
    console.log('hier---', currentBrowserTab.id)
    await chrome.scripting
      .executeScript({
        target: { tabId: currentBrowserTab.id },
        func: (timestamp: number) => {
          const newDataState = localStorage.getItem('excalidraw')
          console.log('getting  dataState from localstorage', timestamp)
          addEventListener('storage', (event) => {
            console.log('event', event)
          })
          // setInterval(() => {
          //   console.log('hier')
          // }, 10000)
          // if (newDataState > timestamp - 10000) {
          //   console.log('dirty!!!')
          // }
          // //localStorage.setItem("tabsets_name", val)
          // if (tabId.trim() !== '') {
          //   localStorage.setItem('tabsets_tabId', tabId)
          // }
          // localStorage.setItem('tabsets_ts', '' + new Date().getTime())
          // return {
          //   excalidraw: localStorage.getItem('excalidraw'),
          //   excalidrawState: localStorage.getItem('excalidraw-state'),
          //   versionFiles: localStorage.getItem('version-files'),
          //   versionDataState: localStorage.getItem('version-dataState'),
          // }
        },
        args: [new Date().getTime()],
      })
      .then((results) => {
        // console.log('results', results)
      })
    return Promise.resolve()
  }

  // defaultAction(): ActionContext | undefined {
  //   const tabset: Tabset | undefined = useTabsetsStore().getCurrentTabset
  //   if (tabset) {
  //     var actions = tabset.tabs
  //       .filter((t: Tab) => t.url !== undefined)
  //       .filter((t: Tab) => t.url!.match(urlMatcher))
  //       .map((t: Tab) => {
  //         return new ActionContext(t.name || t.title || 'undefined', 'save').onClicked(this.updateInTabset)
  //       })
  //     const res =
  //       actions.length > 0
  //         ? actions
  //             .concat([
  //               new ActionContext('Save as new file', 'save').withDialog(this.newFileDialog, this.$q!).onOk(this.onOk),
  //             ])
  //             .concat([new ActionContext('Clear canvas')])
  //         : actions.concat([
  //             new ActionContext('Add Excalidraw', 'add').withDialog(this.newFileDialog, this.$q!).onOk(this.onOk),
  //           ])
  //     return res[0]
  //   }
  //   return undefined
  // }

  actions(currentTabsetId: string | undefined, actionProps: ActionProps): ComponentWithContext[] {
    const currentTabset: Tabset | undefined = useTabsetsStore().getCurrentTabset
    let result: ComponentWithContext[] = DefaultActions.getDefaultActions(currentTabset, actionProps)
    // if (currentTabset) {
    //   const actions: ComponentWithContext[] = currentTabset.tabs
    //     .filter((t: Tab) => t.url !== undefined)
    //     .filter((t: Tab) => t.url!.match(urlMatcher))
    //     .map((t: Tab) => {
    //       return { component: ExcalidrawUpdateFileAction, context: { label: t.title || 'undef' } }
    //     })
    //   const list: ComponentWithContext[] =
    //     actions.length > 0
    //       ? actions.concat([
    //           { component: ExcalidrawSaveAsFileAction, context: {} },
    //           { component: ExcalidrawUpdateFileAction, context: { label: 'Clear Canvas' } },
    //         ])
    //       : actions.concat([{ component: ExcalidrawUpdateFileAction, context: { label: 'Update Excalidraw' } }])
    //   result = list.concat(DefaultActions.getDefaultActions(currentTabset, actionProps))
    // } else {
    //   result = [
    //     { component: EditTabsetAction, context: {} },
    //     {
    //       component: CreateSubfolderAction,
    //       context: {},
    //     },
    //     { component: OpenAllInMenuAction, context: {} },
    //     { component: DeleteTabsetAction, context: {} },
    //   ]
    // }
    result.unshift({ component: ExcalidrawSaveAsFileAction, context: {} })
    return result
  }

  async clicked(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData?: AddUrlToTabsetHandlerAdditionalData,
  ): Promise<ExecutionResult<any>> {
    // console.log('saving...', chromeTab)
    // console.log('saving...', ts)
    // console.log('saving...', folder)
    // console.log('saving...', additionalData)
    try {
      const filename: string | undefined =
        additionalData && additionalData.data ? additionalData.data['filename'] : undefined
      if (!filename) {
        throw new Error('filename is missing')
      }

      const newTab = new Tab(uid(), chromeTab)

      const returned = await ExcalidrawAddUrlToTabsetHandler.queryBrowserTab(chromeTab, newTab.id, filename)
      if (returned.length > 0) {
        newTab.title = filename

        const firstFrameReturned = returned.at(0)
        // console.log('hier', firstFrameReturned)
        if (firstFrameReturned && firstFrameReturned.result) {
          newTab.storage = new ExcalidrawStorage(
            JSON.stringify(JSON.parse(firstFrameReturned.result['excalidraw' as keyof object])),
            firstFrameReturned.result['excalidrawState' as keyof object],
            firstFrameReturned.result['versionFiles' as keyof object],
            firstFrameReturned.result['versionDataState' as keyof object],
          )
        }
        return useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, ts, ts.folderActive, true))
      }
    } catch (error: any) {
      console.warn('error', error)
    }

    return Promise.reject('error updating excalidraw')
  }

  async updateInTabset(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData?: AddUrlToTabsetHandlerAdditionalData,
  ): Promise<ExecutionResult<any>> {
    console.log('updating...', chromeTab.id, additionalData)
    try {
      // const filename = additionalData!.data!['filename' as keyof object] as unknown as string
      // if (!filename) {
      //   throw new Error('filename is missing')
      // }
      const returned = await ExcalidrawAddUrlToTabsetHandler.queryBrowserTab(chromeTab, '', 'filename')
      console.log('returned', returned, this)
      if (returned.length > 0) {
        // const tabCandidates = ts.tabs.filter((t: Tab) => t.url!.match(this.urlMatcher()) && t.title === filename)
        const tabCandidates = ts.tabs.filter((t: Tab) => t.url!.match(urlMatcher)) //&& t.title === filename)
        const firstFrameReturned = returned.at(0)
        if (firstFrameReturned && firstFrameReturned.result && tabCandidates.length > 0) {
          tabCandidates[0]!.storage = new ExcalidrawStorage(
            JSON.stringify(JSON.parse(firstFrameReturned.result['excalidraw' as keyof object])),
            firstFrameReturned.result['excalidrawState' as keyof object],
            firstFrameReturned.result['versionFiles' as keyof object],
            firstFrameReturned.result['versionDataState' as keyof object],
          )
          await useTabsetsStore().saveTabset(ts)
          return Promise.resolve(new ExecutionResult('', 'done'))
        }
      }
    } catch (error: any) {
      console.warn('error', error)
    }

    return Promise.reject('error updating excalidraw')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {
    console.log('handling opened tab', browserTab.id, tab.id)
    const excalidraw = tab.storage || new ExcalidrawStorage([], {}, new Date().getTime(), new Date().getTime())
    console.log('setting to storage', excalidraw)

    chrome.scripting
      .executeScript({
        target: { tabId: browserTab.id || 0 },
        func: (excalidraw: ExcalidrawStorage, tabId: string) => {
          window.addEventListener('beforeunload', () => {
            console.log('beforeunload')
            localStorage.setItem('excalidraw', excalidraw.excalidraw)
            localStorage.setItem('excalidraw-state', JSON.stringify(excalidraw.excalidrawState))
            localStorage.setItem('version-files', '' + excalidraw.versionFiles)
            localStorage.setItem('version-dataState', '' + excalidraw.versionDataState)
            localStorage.setItem('tabsets_tabId', tabId)
          })

          // important: reload!
          location.assign('https://excalidraw.com')
        },
        args: [excalidraw, tab.id],
      })
      .catch((err) => {
        console.warn('error', err)
      })
  }

  private static async queryBrowserTab(
    chromeTab: chrome.tabs.Tab,
    tabId: string,
    filename: string,
  ): Promise<chrome.scripting.InjectionResult[]> {
    console.log(`queryBrowserTab: tabId=${tabId}, filename=${filename}`)
    return await chrome.scripting.executeScript({
      target: { tabId: chromeTab.id || 0 },
      func: (val: string, tabId: string) => {
        console.log('setting item tabsets_xxx', val, tabId)
        //localStorage.setItem("tabsets_name", val)
        if (tabId.trim() !== '') {
          localStorage.setItem('tabsets_tabId', tabId)
        }
        localStorage.setItem('tabsets_ts', '' + new Date().getTime())
        return {
          excalidraw: localStorage.getItem('excalidraw'),
          excalidrawState: localStorage.getItem('excalidraw-state'),
          versionFiles: localStorage.getItem('version-files'),
          versionDataState: localStorage.getItem('version-dataState'),
        }
      },
      args: [filename, tabId || ''],
    })
  }

  async newFileDialog($q: QVueGlobals, filename: string = ''): Promise<DialogChainObject> {
    return $q.dialog({
      title: 'Save as new Excalidraw File',
      message: 'Please Provide a name (min 3 characters)',
      prompt: { model: filename, isValid: (val: string) => val.length > 2, type: 'text' },
      cancel: true,
      persistent: true,
    })
  }

  onOk = (data: string[]) => {
    console.log('data!!', data, typeof data)
    return this.clicked // handled by ActionHandlers.handleClick
  }
}
