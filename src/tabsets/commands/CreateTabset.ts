import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useTabsetService} from "src/services/TabsetService2";
import {SaveOrReplaceResult} from "src/models/SaveOrReplaceResult";
import {useUtils} from "src/services/Utils";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/FeatureIdent";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";
import {StaticSuggestionIdent, Suggestion} from "src/suggestions/models/Suggestion";
import Analytics from "src/utils/google-analytics";
import {useWindowsStore} from "src/windows/stores/windowsStore";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {TabsetType} from "src/tabsets/models/Tabset";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";

const {sendMsg} = useUtils()

export class CreateTabsetCommand implements Command<SaveOrReplaceResult> {

    public merge: boolean = true

    constructor(
        public tabsetName: string,
        public tabsToUse: chrome.tabs.Tab[],
        public windowToOpen: string = 'current',
        public color: string | undefined = undefined) {
    }

    async execute(): Promise<ExecutionResult<SaveOrReplaceResult>> {
        try {
            //const trustedWindowName = this.windowToOpen.replace(STRIP_CHARS_IN_USER_INPUT, '')
            const windowId = this.windowToOpen ?
                this.windowToOpen.replace(STRIP_CHARS_IN_USER_INPUT, '') : 'current'
            useWindowsStore().addToWindowSet(windowId)
            const result: SaveOrReplaceResult = await useTabsetService()
                .saveOrReplaceFromChromeTabs(this.tabsetName, this.tabsToUse, this.merge, windowId, TabsetType.DEFAULT, this.color)
                .then(res => {
                    //JsUtils.gaEvent('tabset-created', {"tabsCount": this.tabsToUse.length})
                    Analytics.fireEvent('tabset-created', {"tabsCount": this.tabsToUse.length})
                    return res
                })
                .then(res => {
                        //   if (useTabsetsStore().tabsets.size === 5 && !useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS) && process.env.MODE === 'bex') {
                        //     useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_BOOKMARKS_FEATURE))
                        //         }
                        if (useTabsetsStore().tabsets.size >= 15 &&
                            !useFeaturesStore().hasFeature(FeatureIdent.SPACES) &&
                            process.env.MODE === 'bex') {
                            useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_SPACES_FEATURE))
                        // } else if (useTabsetsStore().tabsets.size >= 3 &&
                        //     useTabsetsStore().allTabsCount > 10 &&
                        //     !useFeaturesStore().hasFeature(FeatureIdent.NEWEST_TABS) &&
                        //     process.env.MODE === 'bex') {
                        //     useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_NEWEST_TABS_FEATURE))
                        }
                        sendMsg('tabset-added', {tabsetId: res.tabset.id})
                        return res
                    }
                )
            let doneMsg = 'Tabset created'
            return Promise.resolve(new ExecutionResult<SaveOrReplaceResult>(result, doneMsg))
        } catch (err) {
            return Promise.reject(err)
        }
    }
}

CreateTabsetCommand.prototype.toString = function cmdToString() {
    return `CreateTabsetCommand: {merge=${this.merge}, tabsetName=${this.tabsetName}, tabs#=${this.tabsToUse.length}, windowToOpen#=${this.windowToOpen}}`;
};
