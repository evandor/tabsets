import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {DeleteTabsetCommand} from "src/domain/tabsets/DeleteTabset";
import {useTabsetService} from "src/services/TabsetService2";
import {SaveOrReplaceResult} from "src/models/SaveOrReplaceResult";
import {useUtils} from "src/services/Utils";
import {useTabsStore} from "stores/tabsStore";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useSuggestionsStore} from "stores/suggestionsStore";
import {StaticSuggestionIdent, Suggestion} from "src/models/Suggestion";
import Analytics from "src/utils/google-analytics";
import {useWindowsStore} from "src/stores/windowsStore";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {TabsetType} from "src/models/Tabset";

const {sendMsg} = useUtils()

class UndoCreateTabsetCommand implements Command<object> {

    constructor(public tabsetId: string) {
    }

    execute(): Promise<ExecutionResult<object>> {
        return new DeleteTabsetCommand(this.tabsetId).execute()
            .then(res => Promise.resolve(new ExecutionResult(res, "Tabset was deleted again")))
    }

}

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
            const windowId = this.windowToOpen.replace(STRIP_CHARS_IN_USER_INPUT, '')
            useWindowsStore().addToWindowSet(windowId)
            const result: SaveOrReplaceResult = await useTabsetService()
                .saveOrReplaceFromChromeTabs(this.tabsetName, this.tabsToUse, this.merge, windowId, TabsetType.DEFAULT, this.color)
                .then(res => {
                    //JsUtils.gaEvent('tabset-created', {"tabsCount": this.tabsToUse.length})
                    Analytics.fireEvent('tabset-created', {"tabsCount": this.tabsToUse.length})
                    return res
                })
                .then(res => {
                        //   if (useTabsStore().tabsets.size === 5 && !usePermissionsStore().hasFeature(FeatureIdent.BOOKMARKS) && process.env.MODE === 'bex') {
                        //     useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_BOOKMARKS_FEATURE))
                        //         }
                        if (useTabsStore().tabsets.size >= 15 &&
                            !usePermissionsStore().hasFeature(FeatureIdent.SPACES) &&
                            process.env.MODE === 'bex') {
                            useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_SPACES_FEATURE))
                        } else if (useTabsStore().tabsets.size >= 3 &&
                            useTabsStore().allTabsCount > 10 &&
                            !usePermissionsStore().hasFeature(FeatureIdent.NEWEST_TABS) &&
                            process.env.MODE === 'bex') {
                            useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_NEWEST_TABS_FEATURE))
                        }
                        sendMsg('tabset-added', {tabsetId: res.tabset.id})
                        return res
                    }
                )
            let doneMsg = 'Tabset created'
            if (result['replaced' as keyof object] && result['merged' as keyof object]) {
                doneMsg = 'Existing Tabset \'' + this.tabsetName + '\' can be updated now'
            } else if (result['replaced' as keyof object]) {
                doneMsg = 'Existing Tabset \' ' + this.tabsetName + '\' was overwritten'
            }
            return Promise.resolve(new ExecutionResult<SaveOrReplaceResult>(result, doneMsg, new UndoCreateTabsetCommand(result.tabset.id)))
        } catch (err) {
            return Promise.reject(err)
        }
    }
}

CreateTabsetCommand.prototype.toString = function cmdToString() {
    return `CreateTabsetCommand: {merge=${this.merge}, tabsetName=${this.tabsetName}, tabs#=${this.tabsToUse.length}, windowToOpen#=${this.windowToOpen}}`;
};
