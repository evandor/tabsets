import {Tab} from "src/models/Tab";
import {LoggerStore} from "logging-library";

export class TabLogger {
  static info(tab: Tab, msg: string): void {
    this.getLogger(tab)?.info(msg)
  }

  static error(tab: Tab, msg: string): void {
    this.getLogger(tab)?.error(msg)
  }

  private static getLogger(tab: Tab) {
    const useId = "url_" + (tab?.chromeTab.url ? btoa(tab.chromeTab.url) : '')
    let loggerToUse = LoggerStore.get(useId)
    if (!loggerToUse) {
      const defaultLogger = LoggerStore.get("default")
      if (defaultLogger) {
        loggerToUse = defaultLogger.withContext(useId)
        LoggerStore.add(useId, loggerToUse)
      }
    }
    return loggerToUse;
  }
}
