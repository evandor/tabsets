import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";
import {Tabset} from "src/tabsets/models/Tabset";
import ChromeApi from "src/app/BrowserApi";

export class SaveTabCommand implements Command<any> {

    constructor(
        public tabset: Tabset | undefined,
        public tab: Tab | undefined,
        public callback: (mhtmlId: string) => void = (id) => {}
        ) {
    }

    async execute(): Promise<ExecutionResult<any>> {
        // if (!usePermissionsStore().hasPermission('pageCapture')) {
        //     handleError("missing permission pageCapture")
        //     return Promise.reject("missing permission pageCapture!")
        // }
        if (!this.tab) {
            return Promise.reject("tab undefined")
        }
        if (this.tab.chromeTabId) {
            const currentTab = await ChromeApi.getCurrentTab()
            console.log("capturing", typeof this.tab, currentTab)
            // TODO cannot return from "saveAsHTML" as the callback cannot be turned into a promise
            chrome.pageCapture.saveAsMHTML({tabId: currentTab.id || 0},
                (html: Blob | undefined) => {
                    console.log("blob", html)
                    if (html && this.tab) {
                        // return MHtmlService.saveMHtml(this.tab, html)
                        //     .then((mhtmlId) => {
                        //         if (this.tabset && this.tab) {
                        //             let mhtmls: string[] | undefined = this.tab['mhtmls']
                        //             if (!mhtmls) {
                        //                 mhtmls = []
                        //             }
                        //             mhtmls.push(mhtmlId)
                        //             this.tab['mhtmls'] = mhtmls
                        //             console.log("this.tab", this.tab)
                        //             useTabsetService().saveTabset(this.tabset)
                        //         }
                        //         return mhtmlId;
                        //     })
                        //     .then((res) => {
                        //         //return handleSuccess(new ExecutionResult(res, "Tab was saved"))
                        //         this.callback(res)
                        //     })
                        //     .catch(err => {
                        //         return handleError(err)
                        //     })
                    }
                    return Promise.reject("no html found")
                })

            return Promise.resolve(
                new ExecutionResult("dummy", "this should not be called from UI"))
        } else {
            return Promise.reject("general problem saving tab")
        }

    }

}

SaveTabCommand.prototype.toString = function cmdToString() {
    return `SaveTabCommand: {tabId=${this.tab?.id}}`;
};
