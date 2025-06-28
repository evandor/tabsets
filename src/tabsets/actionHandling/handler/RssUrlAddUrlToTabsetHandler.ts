import { QVueGlobals } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useRequestsStore } from 'src/requests/stores/requestsStore'
import { DefaultActions } from 'src/tabsets/actionHandling/handler/DefaultActions'
import {
  AddUrlToTabsetHandlerAdditionalData,
  ComponentWithContext,
  TabActionMatcher,
} from 'src/tabsets/actionHandling/TabActionMatcher'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import AddRssFeedAction from 'src/tabsets/actions/rss/AddRssFeedAction.vue'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

/**
 * examples
 * https://www.test.de/rss/alles/
 * https://www.spiegel.de/sport/index.rss
 */
export class RssUrlAddUrlToTabsetHandler implements TabActionMatcher {
  constructor(public $q: QVueGlobals) {}

  tabMatcher(url: string, content: string, metas: object): boolean {
    if (url.match(/.*\.rss$/)) {
      return true
    }
    //console.log('content', content.indexOf('<rss '), content.substring(0, 300))
    const request = useRequestsStore().getCurrentTabRequest
    //console.log('request', request)
    if (request) {
      const contentType =
        request.responseHeaders
          ?.find((rh: chrome.webRequest.HttpHeader) => rh.name.toLowerCase() === 'content-type')
          ?.value?.toLowerCase() || 'text/html'
      console.log('found content type ', contentType)
      if (contentType.indexOf('application/xml') >= 0 || contentType.indexOf('application/rss+xml') >= 0) {
        console.log('found application/xml or application/rss+xml content type', request)
        return true
      }
    }
    return (
      content.indexOf('<rss ') >= 0 ||
      content.indexOf('&lt;rss ') >= 0 ||
      content.indexOf('<rdf:RDF ') >= 0 ||
      content.indexOf('&lt;rdf:RDF ') >= 0 ||
      content.indexOf('<feed ') >= 0 ||
      content.indexOf('&lt;feed ') >= 0
    )
  }

  injectScript(): Promise<void> {
    return Promise.resolve()
  }

  // defaultAction(): ActionContext {
  //   return new ActionContext('Add RSS Feed').withDialog(this.storeAsFeed, this.$q).onOk(this.onOk)
  // }

  actions(currentTabsetId: string | undefined, actionProps: ActionProps): ComponentWithContext[] {
    const currentTabset = useTabsetsStore().getCurrentTabset
    const actions = DefaultActions.getDefaultActions(currentTabset, actionProps)
    if (currentTabset) {
      actions.unshift({
        component: AddRssFeedAction,
        context: { currentTabset },
      })
    }
    return actions
  }

  // async clicked(
  //   chromeTab: chrome.tabs.Tab,
  //   ts: Tabset,
  //   folder?: Tabset,
  //   additionalData: AddUrlToTabsetHandlerAdditionalData = {},
  // ): Promise<ExecutionResult<any>> {
  //
  // }

  updateInTabset(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData?: AddUrlToTabsetHandlerAdditionalData,
  ): Promise<ExecutionResult<any>> {
    throw new Error('not implemented M')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {}
}
