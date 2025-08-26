import { QVueGlobals } from 'quasar'
import { analyseHtml, CategoryAnalyzer, SiteAnalysis } from 'site-analysis'
import { useDynamicConfig } from 'src/config/dynamicConfigStore'
import { ContentItem } from 'src/content/models/ContentItem'
import { useContentService } from 'src/content/services/ContentService'
import { useContentStore } from 'src/content/stores/contentStore'
import { BexEvent } from 'src/core/services/Utils'
import ContentUtils from 'src/core/utils/ContentUtils'
import { PageData } from 'src/tabsets/models/PageData'
import { Tab } from 'src/tabsets/models/Tab'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { Annotation } from 'src/tabsets/models/types/Annotations'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

class BexFunctions {
  handleReload = async ({ payload }: { payload: object }) => {
    // const tsId = await useTabsetsStore().getCurrentTabsetId()
    console.log('!!!!!!', payload['tab' as keyof object])
    const currentTabset = useTabsetsStore().getCurrentTabset
    if (currentTabset) {
      const index = currentTabset.tabs.findIndex((tab: Tab) => tab.id === payload['tab' as keyof object]['id'])
      console.log('found index', index)
      if (index >= 0) {
        currentTabset.tabs[index] = payload['tab' as keyof object] as Tab
      }
    }
    await useTabsetService().saveCurrentTabset()

    // const ts = await useTabsetsStore().reloadTabset(tsId!)
    // console.log('ts', ts)
  }

  handleBexTabExcerpt = async ({
    from,
    to,
    event,
    payload,
  }: {
    from: string
    to: string
    event: string
    payload: PageData
  }) => {
    console.log(
      `[BEX-APP] ${event} <<< html#:${payload.html.length}, metas#:${Object.keys(payload.metas).length}, url:${payload.url?.length || 0 > 25 ? payload.url?.substring(0, 22) + '...' : payload.url}`,
    )
    //console.log(`[BEX-APP] ${event} <<< storage: ${JSON.stringify(payload.storage)}`)

    const res: SiteAnalysis = analyseHtml(payload.html, payload.url!)
    console.log('%cres', 'background-color:red', res)

    const cat = new CategoryAnalyzer(useDynamicConfig().categoryMapping, res).getCategory()
    console.log('***cat***', cat)

    // updating (transient) content in contentStore
    useContentStore().setCurrentTabUrl(payload.url)
    useContentStore().setCurrentTabContent(payload.html)
    useContentStore().setCurrentTabMetas(payload.metas)
    useContentStore().setCurrentTabStorage(payload.storage)
    useContentStore().setCurrentTabSiteAnalysis(res)
    useContentStore().setCurrentTabCategory(cat)

    if (!payload.url) {
      return
    }

    // update (persistent) content in content db if exists
    const existing: ContentItem | undefined = await useContentService().getContentFor(payload.url)
    if (existing) {
      const tokens = ContentUtils.html2tokens(payload['html' as keyof object] || '')
      useContentService()
        .saveContent(existing.id, payload.url, [...tokens].join(' '), payload['metas' as keyof object], 'title...', [])
        .catch((err: any) => console.log('err', err))
    }

    // update existing tabs with this url
    //const newTabReferences: TabReference[] = useContentStore().getCurrentTabReferences
    useTabsetsStore()
      .tabsForUrl(payload.url)
      .forEach((tabAndTsId: TabAndTabsetId) => {
        const ts = useTabsetsStore().getTabset(tabAndTsId.tabsetId)
        if (ts) {
          // console.log(
          //   `setting tabReferences for tab url '${tabAndTsId.tab.url}' to ${JSON.stringify(newTabReferences)}`,
          // )
          // const originalRefs = tabAndTsId.tab.tabReferences
          //
          // newTabReferences
          //   .filter((tr: TabReference) => tr.type === TabReferenceType.RSS)
          //   .forEach((rssRef: TabReference) => {
          //     const existingIndex = originalRefs.findIndex((r: TabReference) => r.href === rssRef.href)
          //     if (existingIndex >= 0) {
          //       rssRef = originalRefs[existingIndex] as TabReference
          //     }
          //   })
          //
          // tabAndTsId.tab.tabReferences = newTabReferences

          console.log('===>', payload['storage'])
          if (payload['storage'] && payload['storage' as keyof object]['tabsetsAnnotations']) {
            tabAndTsId.tab.annotations = payload['storage' as keyof object]['tabsetsAnnotations'] as Annotation[]
            console.log('===>', tabAndTsId.tab.annotations)
            useTabsetsStore().saveTabset(ts)
          }
        }
      })
  }

  bexSendWithRetry = ($q: QVueGlobals, eventName: BexEvent, portName: string, payload: object = {}) => {
    console.log(` --> Sent event '${eventName}' to '${portName}' with payload ${JSON.stringify(payload)}`)
    $q.bex
      .send({
        event: eventName,
        to: portName,
        payload,
      })
      .catch((err: any) => {
        // console.warn('err', typeof err, err)
        // console.log('port list is', $q.bex.portList)
        $q.bex.connectToBackground().then(() => {
          $q.bex.send({
            event: eventName,
            to: portName,
            payload,
          })
        })
      })
  }

  broadcast = ($q: QVueGlobals, eventName: BexEvent, payload: object = {}) => {
    console.log(` --> Broadcasting event '${eventName}'  with payload ${JSON.stringify(payload)}`)
    $q.bex.portList.forEach((portName: string) => {
      console.log(` --> Broadcasting to portName '${portName}'`)
      $q.bex.send({
        event: eventName,
        to: portName,
        payload,
      })
    })
  }
}

export default new BexFunctions()
