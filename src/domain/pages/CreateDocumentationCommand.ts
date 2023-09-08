import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useTabsetService} from "src/services/TabsetService2";
import {SaveOrReplaceResult} from "src/models/SaveOrReplaceResult";
import Analytics from "src/utils/google-analytics";
import {TabsetType} from "src/models/Tabset";
import NavigationService from "src/services/NavigationService";

export class CreateDocumentationCommand implements Command<SaveOrReplaceResult> {

    public merge: boolean = true

    constructor(
        public docName: string,
        public color: string | undefined = undefined) {
    }

    /**
     *  A "Documentation" is a tabset containing "pages".
     *
     *  Pages are special "tabs" (todo)
     *  and are added by a command of their own
     */
    async execute(): Promise<ExecutionResult<SaveOrReplaceResult>> {
        try {
            const result: SaveOrReplaceResult = await useTabsetService()
                .saveOrReplaceFromChromeTabs(this.docName, [], false, 'current', TabsetType.DOCUMENTATION, this.color)
                .then(res => {
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
            // TODO define which actions have to be performed by the command and which by the caller...
            // .then(res => {
            //         sendMsg('tabset-added', {tabsetId: res.tabset.id})
            //         return res
            //     }
            // )
            let doneMsg = 'Documentation \'' + this.docName + '\' created successfully'
            return Promise.resolve(new ExecutionResult<SaveOrReplaceResult>(result, doneMsg))
        } catch (err) {
            return Promise.reject(err)
        }
    }
}

CreateDocumentationCommand.prototype.toString = function cmdToString() {
    return `CreateDocumentationCommand: {tabsetName=${this.docName}}`;
};
