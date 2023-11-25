import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab} from "src/models/Tab";
import {usePermissionsStore} from "stores/permissionsStore";
import {useNotificationHandler} from "src/services/ErrorHandler";
import PdfService from "src/services/PdfService";
import TabsetService from "src/services/TabsetService";

const {handleSuccess, handleError} = useNotificationHandler()

export class SavePngCommand implements Command<any> {

    public readonly chromeTabId: number | undefined;

    constructor(
        public tab: Tab,
        public remark: string | undefined = undefined) {
        this.chromeTabId = this.tab.url ? TabsetService.chromeTabIdFor(this.tab.url) : undefined
    }

    async execute(): Promise<ExecutionResult<any>> {
        if (!usePermissionsStore().hasPermission('pageCapture')) {
            handleError("missing permission pageCapture")
            return Promise.reject("xxx")
        }
        if (!this.chromeTabId) {
            return Promise.reject("could not find chromeTabId for tab")
        }
        console.log("capturing tab id", this.chromeTabId)

        chrome.tabs.sendMessage(
            this.chromeTabId || 0,
            "getContent",
            {},
            (res) => {
                console.log("res", res, this.chromeTabId)
                let html = res.content
                try {
                    let url = new URL(this.tab.url || '')
                    const headWithBase = "<head><base href=\"" + url.protocol + "//" + url.hostname + "/\" />"
                    // TODO puppeteer seems to have issues with this approach
                    //const headWithBase = "<head>"
                    console.log("replacing head with ", headWithBase)
                    html = html.replace("<head>", headWithBase)
                } catch (err) {
                    console.log("err", err)
                }

                //console.log("getContent", html)

                return PdfService.screenshotFrom(html)
                    .then((res:any) => {
                        console.log("res", res, typeof res)
                        console.log("res2", typeof res.data)

                        PdfService.saveBlob(this.tab, res.data, 'PNG', this.remark)


                        handleSuccess(
                            new ExecutionResult(
                                "done",
                                "Png was created"))
                    }).catch((err:any) => {
                        return handleError(err)
                    })


            })


        return Promise.resolve(
            new ExecutionResult("dummy", "this should not be called from UI"))

    }

}


SavePngCommand.prototype.toString = function cmdToString() {
    return `SavePngCommand: {tabId=${this.tab.id}, chromeTabId=${this.chromeTabId}}`;
};
