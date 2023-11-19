import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab} from "src/models/Tab";
import {usePermissionsStore} from "src/stores/permissionsStore";
import MHtmlService from "src/services/MHtmlService";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {Tabset} from "src/models/Tabset";
import {useTabsetService} from "src/services/TabsetService2";
import {useTabsStore} from "stores/tabsStore";
import ChromeApi from "src/services/ChromeApi";

const {handleSuccess, handleError} = useNotificationHandler()

class UndoCommand implements Command<any> {

    constructor(public tab: Tab) {
    }

    execute(): Promise<ExecutionResult<any>> {
        return Promise.reject("not yet implemented")
    }

}

export class SaveTabCommand implements Command<any> {

    constructor(
        public tabset: Tabset | undefined,
        public tab: Tab | undefined) {
    }

    async execute(): Promise<ExecutionResult<any>> {
        if (!usePermissionsStore().hasPermission('pageCapture')) {
            handleError("missing permission pageCapture")
            return Promise.reject("missing permission pageCapture!")
        } else if (!this.tab) {
            return Promise.reject("tab undefined")
        } else if (this.tab.chromeTabId) {
            const currentTab = await ChromeApi.getCurrentTab()
            console.log("capturing", typeof this.tab, currentTab)
            console.log("***", useTabsStore().getChromeTabs)
            // TODO cannot return from "saveAsHTML" as the callback cannot be turned into a promise
            chrome.pageCapture.saveAsMHTML({tabId: currentTab.id || 0},
                (html: Blob | undefined) => {
                    console.log("blob", html)
                    if (html) {
                        return MHtmlService.saveMHtml(this.tab, html)
                            .then((res) => {
                                if (this.tabset) {
                                    let mhtmls: string[] | undefined = this.tab['mhtmls']
                                    if (!mhtmls) {
                                        mhtmls = []
                                    }
                                    mhtmls.push(res)
                                    this.tab['mhtmls'] = mhtmls
                                    console.log("this.tab", this.tab)
                                    useTabsetService().saveTabset(this.tabset)
                                }
                                return res;
                            })
                            .then((res) => {
                                handleSuccess(
                                    new ExecutionResult(
                                        "done",
                                        "Tab was saved",
                                        new UndoCommand(this.tab)))
                            })
                            .catch(err => {
                                return handleError(err)
                            })
                    }
                    return handleError("no html found")

                })

            return Promise.resolve(
                new ExecutionResult("dummy", "this should not be called from UI"))
        } else {
            return Promise.reject("general problem saving tab")
        }

    }

}

SaveTabCommand.prototype.toString = function cmdToString() {
    return `SaveTabCommand: {tabId=${this.tab.id}}`;
};
