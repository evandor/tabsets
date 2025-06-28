import AppEventDispatcher from 'src/app/AppEventDispatcher'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useLogger } from 'src/core/services/Logger'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { SaveOrReplaceResult } from 'src/tabsets/models/SaveOrReplaceResult'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'

const { sendMsg } = useUtils()
const { info } = useLogger()

export class CreateTabsetCommand implements Command<SaveOrReplaceResult> {
  public merge: boolean = true

  constructor(
    public tabsetName: string,
    public tabsToUse: chrome.tabs.Tab[] = [],
    public spaceId: string | undefined = undefined,
    public windowToOpen: string = 'current',
    public color: string | undefined = undefined,
  ) {}

  async execute(): Promise<ExecutionResult<SaveOrReplaceResult>> {
    function checkSpacesSuggestion() {
      if (
        useTabsetsStore().tabsets.size >= 15 &&
        !useFeaturesStore().hasFeature(FeatureIdent.SPACES) &&
        process.env.MODE === 'bex'
      ) {
        useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion('TRY_SPACES_FEATURE'))
      }
    }

    function checkBookmarksSuggestion() {
      if (
        useTabsetsStore().tabsets.size > 2 &&
        !useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS) &&
        process.env.MODE === 'bex'
      ) {
        useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion('TRY_BOOKMARKS_FEATURE'))
      }
    }

    try {
      const windowId = this.windowToOpen ? this.windowToOpen.replace(STRIP_CHARS_IN_USER_INPUT, '') : 'current'
      useWindowsStore().addToWindowSet(windowId)
      const result: SaveOrReplaceResult = await useTabsetService()
        .saveOrReplaceFromChromeTabs(this.tabsetName, this.tabsToUse, this.color, this.spaceId)
        .then((res) => {
          Analytics.fireEvent('tabset_created', { tabsCount: this.tabsToUse.length })
          checkBookmarksSuggestion()
          checkSpacesSuggestion()
          info('tabset created')
          sendMsg('tabset-added', { tabsetId: res.tabset.id })
          localStorage.setItem('test.tabsetId', res.tabset.id)
          AppEventDispatcher.dispatchEvent('run-metrics')
          return res
        })
      let doneMsg = 'Tabset created'
      return Promise.resolve(new ExecutionResult<SaveOrReplaceResult>(result, doneMsg))
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateTabsetCommand.prototype.toString = function cmdToString() {
  return `CreateTabsetCommand: {merge=${this.merge}, tabsetName=${this.tabsetName}, tabs#=${this.tabsToUse.length}, windowToOpen#=${this.windowToOpen}}`
}
