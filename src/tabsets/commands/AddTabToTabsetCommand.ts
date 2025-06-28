// 6 expected diffs to localstorage
import _ from 'lodash'
import { uid } from 'quasar'
import AppEventDispatcher from 'src/app/AppEventDispatcher'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import { useContentStore } from 'src/content/stores/contentStore'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useLogger } from 'src/core/services/Logger'
import { useUtils } from 'src/core/services/Utils'
import ContentUtils from 'src/core/utils/ContentUtils'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useRequestsService } from 'src/requests/services/RequestsService'
import { useRequestsStore } from 'src/requests/stores/requestsStore'
import { Tab } from 'src/tabsets/models/Tab'
import { ChangeInfo, Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import PlaceholderUtils from 'src/tabsets/utils/PlaceholderUtils'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'

const { sendMsg } = useUtils()
const { info } = useLogger()

// No undo command, tab can be deleted manually easily

/**
 * Add provided Tab to provided Tabset.
 */
export class AddTabToTabsetCommand implements Command<any> {
  constructor(
    public tab: Tab,
    public tabset: Tabset | undefined = undefined,
    public activeFolder: string | undefined = undefined,
    public allowDuplicates: boolean = false, // used eg at Excalidraw Handler
    public ignoreDuplicates: boolean = false, // used eg. at RssFolderHandler
  ) {
    if (!tabset) {
      this.tabset = useTabsetsStore().getCurrentTabset
    }
    if (!this.tabset) {
      throw new Error('could not set current tabset')
    }
  }

  async execute(): Promise<ExecutionResult<any>> {
    //console.info(`adding tab '${this.tab.id}' to tabset '${this.tabset!.id}', active folder: ${this.activeFolder}`)

    let tabsetOrFolder = this.tabset!
    if (this.activeFolder) {
      const folder = useTabsetsStore().getActiveFolder(this.tabset!, this.activeFolder)
      if (folder) {
        tabsetOrFolder = folder
      }
    }

    if (!this.allowDuplicates) {
      const exists = _.findIndex(tabsetOrFolder.tabs, (t: any) => t.url === this.tab.url) >= 0
      if (exists && !this.ignoreDuplicates) {
        return Promise.reject('tab already exists in this tabset')
      } else if (exists) {
        return Promise.resolve(new ExecutionResult('', ''))
      }
    }

    try {
      // manage (chrome) Group
      // console.log('updating tab group for group id', this.tab.groupId)
      // const currentGroup = useGroupsStore().currentGroupForId(this.tab.groupId)
      // this.tab.groupName = currentGroup?.title || undefined
      // if (currentGroup) {
      //   await useGroupsStore().persistGroup(currentGroup)
      // }

      // TabReferences
      this.tab.tabReferences = this.tab.tabReferences.concat(useContentStore().currentTabReferences)

      // Article (ReaderMode)
      if (useFeaturesStore().hasFeature(FeatureIdent.READING_MODE)) {
        console.log('checking article', useContentStore().currentTabArticle)
        const article = useContentStore().currentTabArticle
        if (article && article['title' as keyof object] && article['textContent' as keyof object]) {
          const content: string = article['textContent' as keyof object]
          if (content.length > 500) {
            this.tab.tabReferences.push(
              new TabReference(
                uid(),
                TabReferenceType.READING_MODE,
                article['title' as keyof object],
                [article],
                this.tab.url,
              ),
            )
            useContentStore().resetCurrentTabArticle()
          }
        }
      }

      const tabset: Tabset = await useTabsetService().addToTabset(tabsetOrFolder, this.tab, 0, this.allowDuplicates)

      Analytics.fireEvent('tabset_tab_added', { tabsCount: tabset.tabs.length })

      // Sharing
      // if (tabset.sharing?.sharedId && tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK && !this.activeFolder) {
      //   tabset.sharing.sharing = TabsetSharing.PUBLIC_LINK_OUTDATED
      //   tabset.sharing.sharedAt = new Date().getTime()
      // }

      // Placeholder Defaults Application
      this.tab = PlaceholderUtils.applyForDefaultDomains(this.tab)

      // the tab has been added to the tabset, but not saved yet
      let res: any = null
      let content: any = undefined
      if (this.tab.chromeTabId) {
        const tabContent = useContentStore().getCurrentTabContent
        const tabMetas = useContentStore().getCurrentTabMetas
        if (tabContent) {
          const tokens = ContentUtils.html2tokens(tabContent)
          content = [...tokens].join(' ')
          await useTabsetService().saveText(this.tab, content, tabMetas)
        }

        const res2 = await useTabsetService().saveTabset(
          this.tabset!,
          new ChangeInfo('tab', 'added', this.tab.id, this.tabset!.id),
        )
        res = new ExecutionResult(res2, 'Link was added')

        // saving thumbnail
        useThumbnailsService().captureVisibleTab(this.tab.id, this.tabset?.id || 'unknown tabsetid')
      } else {
        const res2 = await useTabsetService().saveTabset(this.tabset!)
        res = new ExecutionResult(res2, 'Link was added')
      }

      // add to search index via App Dispatcher
      await AppEventDispatcher.dispatchEvent('add-to-search', {
        name: this.tab.name || '',
        title: this.tab.title || '',
        url: this.tab.url || '',
        description: this.tab.description,
        content: content ? content : '',
        tabsets: [this.tabset!.id],
        favIconUrl: this.tab.favIconUrl || '',
      })
      info('tab created')
      localStorage.setItem('test.tabId', this.tab.id)
      sendMsg('tab-added', { tabsetId: this.tabset!.id })

      const req = useRequestsStore().getCurrentTabRequest
      if (req && req.url === this.tab.url) {
        useRequestsService().logWebRequest(JSON.parse(JSON.stringify(req)))
      }

      AppEventDispatcher.dispatchEvent('run-metrics')
      return res
    } catch (err: any) {
      console.warn('hier: ', err)
      return Promise.reject('error: ' + err.toString())
    }
  }
}

AddTabToTabsetCommand.prototype.toString = function cmdToString() {
  return `AddTabToTabsetCommand: {tabId=${this.tab.id}}`
}
