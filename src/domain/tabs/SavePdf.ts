import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab} from "src/models/Tab";
import {usePermissionsStore} from "stores/permissionsStore";
import MHtmlService from "src/services/MHtmlService";
import {useNotificationHandler} from "src/services/ErrorHandler";
import PdfService from "src/services/PdfService";

const {handleSuccess, handleError} = useNotificationHandler()


export class SavePdfCommand implements Command<any> {

  constructor(
    public tab: Tab) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    if (!usePermissionsStore().hasPermission('pageCapture')) {
      handleError("missing permission pageCapture")
      return Promise.reject("xxx")
    } else if (this.tab.chromeTabId) {
      console.log("capturing", this.tab.chromeTabId)

      chrome.tabs.sendMessage(
        this.tab.chromeTabId,
        "getContent",
        {},
        (res) => {
          console.log("res", res, this.tab.chromeTabId)
          let html = res.content
          try {
            let url = new URL(this.tab.url || '')
            const headWithBase = "<head><base href=\""+url.protocol + "//" + url.hostname +"/\" />"
            console.log("replacing head with ", headWithBase)
            html = html.replace("<head>", headWithBase)
          } catch(err) {
            console.log("err", err)
          }

          console.log("getContent", html)

          return PdfService.convertFrom(html)
            .then((res:any) => {
              console.log("res", res, typeof res)
              console.log("res2", typeof res.data)

              PdfService.saveBlob(this.tab, res.data, 'PDF')



              handleSuccess(
                new ExecutionResult(
                  "done",
                  "Pdf was created"))
            }).catch((err:any) => {
              return handleError(err)
            })


        })

      return Promise.resolve(
        new ExecutionResult("dummy", "this should not be called from UI"))
    } else {
      return Promise.reject("could not capture Pdf as chromeTabId was not defined")
    }

  }

}

SavePdfCommand.prototype.toString = function dogToString() {
  return `SavePdfCommand`;
};
