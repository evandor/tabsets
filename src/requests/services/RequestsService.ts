import { RequestInfo } from 'src/requests/models/RequestInfo'
import RequestsPersistence from 'src/requests/persistence/RequestsPersistence'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

let db: RequestsPersistence = null as unknown as RequestsPersistence

export function useRequestsService() {
  const init = async (storage: RequestsPersistence) => {
    db = storage
    await db.init()
    // initListeners()
    // console.debug(` ...initialized requests: Service`, '✅')
  }

  const logWebRequest = async (details: chrome.webRequest.WebResponseHeadersDetails) => {
    const tabsForUrl = useTabsetsStore().tabsForUrl(details.url)

    function iFrameDenied(responseHeaders: chrome.webRequest.HttpHeader[] | undefined) {
      const securityPolicyHeader = details.responseHeaders?.find(
        (h: chrome.webRequest.HttpHeader) => h.name.toLowerCase() === 'content-security-policy',
      )
      if (securityPolicyHeader && "frame-ancestors 'self'" === securityPolicyHeader.value) {
        return true
      }
      const xFrameOptions = details.responseHeaders?.find(
        (h: chrome.webRequest.HttpHeader) => h.name.toLowerCase() === 'x-frame-options',
      )
      if (xFrameOptions && 'DENY' === xFrameOptions.value) {
        return true
      }
      return false
    }

    //_.forEach(tabsForUrl, (tabAndTabsetId: TabAndTabsetId) => {
    for (const tabAndTabsetId of tabsForUrl) {
      try {
        await db.saveRequest(new RequestInfo(tabAndTabsetId.tab.id, details.statusCode, details.responseHeaders || []))
        console.debug('adding iframe info to tab')

        if (iFrameDenied(details.responseHeaders)) {
          tabAndTabsetId.tab.useInIframe = false
          const ts = useTabsetsStore().getTabset(tabAndTabsetId.tabsetId)
          await useTabsetsStore().saveTabset(ts!)
        }
      } catch (err: any) {
        console.warn('error in logWebRequest', err)
      }
    }
  }

  const getWebRequestFor = (tabId: string): Promise<RequestInfo> => {
    return db.getRequest(tabId)
  }

  return {
    init,
    logWebRequest,
    getWebRequestFor,
  }
}
