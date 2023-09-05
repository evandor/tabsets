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
import {useWindowsStore} from "stores/windowsStores";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {TabsetType} from "src/models/Tabset";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import {Tab} from "src/models/Tab";
import {uid} from "quasar";
import ChromeApi from "src/services/ChromeApi";
import NavigationService from "src/services/NavigationService";

const {inBexMode, sendMsg} = useUtils()


export class CreateDocumentationCommand implements Command<SaveOrReplaceResult> {

    public merge: boolean = true

    constructor(
        public tabsetName: string,
        public windowToOpen: string = 'current',
        public color: string | undefined = undefined) {
    }

    async execute(): Promise<ExecutionResult<SaveOrReplaceResult>> {
        try {
            const windowId = this.windowToOpen.replace(STRIP_CHARS_IN_USER_INPUT, '')
            useWindowsStore().addToWindowSet(windowId)
            const result: SaveOrReplaceResult = await useTabsetService()
                .saveOrReplaceFromChromeTabs(this.tabsetName, [], false, windowId, TabsetType.DOCUMENTATION, this.color)
                .then(res => {
                    //JsUtils.gaEvent('tabset-created', {"tabsCount": this.tabsToUse.length})
                    Analytics.fireEvent('documentation-created', {})
                    return res
                })
                .then(res => {
                    const url = chrome && chrome.runtime && chrome.runtime.getURL ?
                        chrome.runtime.getURL('www/index.html') + "#/mainpanel/notes/?tsId=" + res.tabset.id + "&edit=true" :
                        "#/mainpanel/notes/?tsId=" + res.tabset.id + "&edit=true"
                    NavigationService.openOrCreateDocumentation(res.tabset.id, url)
                    return res
                })
                .then(res => {
                        sendMsg('tabset-added', {tabsetId: res.tabset.id})
                        return res
                    }
                )
            let doneMsg = 'Docs \'' + this.tabsetName + '\' created successfully'
            return Promise.resolve(new ExecutionResult<SaveOrReplaceResult>(result, doneMsg))
        } catch (err) {
            return Promise.reject(err)
        }
    }
}

CreateDocumentationCommand.prototype.toString = function cmdToString() {
    return `CreateDocumentationCommand: {merge=${this.merge}, tabsetName=${this.tabsetName}, windowToOpen#=${this.windowToOpen}}`;
};
