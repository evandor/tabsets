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
import PagesService from "src/services/PagesService";

const {inBexMode, sendMsg} = useUtils()


export class DeletePageCommand implements Command<string> {

    public merge: boolean = true

    constructor(
        public pageId: string) {
    }

    async execute(): Promise<ExecutionResult<string>> {
        try {
            PagesService.deletePage(this.pageId)
            return Promise.resolve(new ExecutionResult("void", "doneMsg"))
        } catch (err) {
            return Promise.reject(err)
        }
    }
}

DeletePageCommand.prototype.toString = function cmdToString() {
    return `DeletePageCommand: {pageId=${this.pageId}}`;
};
