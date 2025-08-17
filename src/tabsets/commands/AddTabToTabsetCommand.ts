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
import { searchUtils } from 'src/search/searchUtils'
import { Tab } from 'src/tabsets/models/Tab'
import { ChangeInfo, Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { ContentClassification, SystemContentClassification } from 'src/tabsets/models/types/ContentClassification'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import PlaceholderUtils from 'src/tabsets/utils/PlaceholderUtils'
import { useTagsService } from 'src/tags/TagsService'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'

const { sendMsg } = useUtils()
const { info } = useLogger()

// No undo command, tab can be deleted manually easily

async function tabInTabset(name: string, classification: ContentClassification): Promise<Tabset | undefined> {
  let tabset = useTabsetsStore().getTabset(name)
  if (!tabset) {
    console.log('no tabset yet for id', name, tabset)
    tabset = await useTabsetsStore().createTabset(name, [], undefined, undefined, false, name)
    tabset.type = TabsetType.SPECIAL
    // tabset.contentClassification = classification
    await useTabsetsStore().saveTabset(tabset)
  }
  return tabset
}

function mapSystemCategoryToName(tabCategory: SystemContentClassification) {
  if (tabCategory.endsWith(':shopping')) {
    return tabCategory.replace('system:', '')
  }
  return tabCategory.replace('system:', '') + 's'
}

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
    console.info(`adding tab '${this.tab.id}' to tabset '${this.tabset?.id}', active folder: ${this.activeFolder}`)

    // if (!this.tabset || this.tabset.id === 'UNCATEGORIZED') {
    const tabCategory: ContentClassification | 'unclassified' =
      useTagsService().getCurrentTabContentClassification().classification
    console.log('found category', tabCategory)
    if (tabCategory.startsWith('system:') && tabCategory !== 'unclassified') {
      // this.tabset = await tabInTabset(
      //   mapSystemCategoryToName(tabCategory as unknown as SystemContentClassification),
      //   tabCategory,
      // )
      this.tab.classifications.push(tabCategory)
    }
    // if (!this.tabset) {
    //   console.log('could not determine tabset, falling back to "UNCATEGORIZED"')
    //   this.tabset = useTabsetsStore().getSpecialTabset('UNCATEGORIZED')
    // }
    // }

    let tabsetOrFolder = this.tabset
    if (this.activeFolder) {
      const folder = useTabsetsStore().getActiveFolder(this.tabset!, this.activeFolder)
      if (folder) {
        tabsetOrFolder = folder
      }
    }

    if (!this.allowDuplicates) {
      const exists = _.findIndex(tabsetOrFolder!.tabs, (t: any) => t.url === this.tab.url) >= 0
      if (exists && !this.ignoreDuplicates) {
        return Promise.reject('tab already exists in this tabset')
      } else if (exists) {
        return Promise.resolve(new ExecutionResult('', ''))
      }
    }

    try {
      // TabReferences
      this.tab.tabReferences = this.tab.tabReferences.concat(useContentStore().currentTabReferences)

      // TagsInfo
      this.tab.tagsInfo = useContentStore().currentTabTags

      // Derived Data
      this.tab.derivedData = useContentStore().currentTabDerivedData

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

      const tabset: Tabset = await useTabsetService().addToTabset(tabsetOrFolder!, this.tab, 0, this.allowDuplicates)

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
        res = new ExecutionResult(res2, 'Link was added to collection ' + this.tabset!.name)

        // saving thumbnail
        useThumbnailsService().captureVisibleTab(this.tab.id, this.tabset!.id || 'unknown tabsetid')
      } else {
        const res2 = await useTabsetService().saveTabset(this.tabset!)
        res = new ExecutionResult(res2, 'Link was to collection ' + this.tabset!.name)
      }

      // add to search index via App Dispatcher
      await AppEventDispatcher.dispatchEvent('add-to-search', searchUtils().searchDocFrom(this.tab, content))
      //{
      //   name: this.tab.name || '',
      //   title: this.tab.title || '',
      //   url: this.tab.url || '',
      //   description: this.tab.description,
      //   content: content ? content : '',
      //   tags: this.tab.tagsInfo.map((tag: TagInfo) => tag.label).join(' '),
      //   tabsets: [this.tabset!.id],
      //   favIconUrl: this.tab.favIconUrl || '',
      // })
      info('tab created')
      localStorage.setItem('test.tabId', this.tab.id)

      // badge indicator icon
      sendMsg('url-added', { url: this.tab.url })

      sendMsg('tab-added', { tabsetId: this.tabset!.id, url: this.tab.url })

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
  return `AddTabToTabsetCommand: {tabId=${this.tab.id}, ${this.tabset?.id}}`
}
