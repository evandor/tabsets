import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {BaseHandler, ConsoleHandler, ILogRecord, Logger, LoggerStore, LogLevel} from "logging-library";
import PersistenceService from "src/services/PersistenceService";
import {LOG_LEVEL_CONSOLE, LOG_LEVEL_PERSITSTENT} from "boot/constants";

class PersistingHandler extends BaseHandler {

  persistenceService: PersistenceService = IndexedDbPersistenceService

  constructor(level: LogLevel | LogLevel[]) {
    super(level);
  }

  protected log(record: ILogRecord): void {
    this.persistenceService.saveLog(record.context, record.level, record.message)
      .catch((err) => console.warn("could not write to log:", err))
  }

}

export class TabLogger {
   static info(url: string, msg: string) :void {
     const useId = "url_" + btoa(url)
     var loggerToUse = LoggerStore.get(useId)
     if (!loggerToUse) {
       const defaultLogger = LoggerStore.get("default")
       if (defaultLogger) {
         loggerToUse = defaultLogger.withContext(useId)
         LoggerStore.add(useId, loggerToUse)
       }
     }
     loggerToUse?.info(msg)
   }
}


export function useLoggingServicee() {

  const persistenceService = IndexedDbPersistenceService

  const logger = new Logger()
    .addHandler(new ConsoleHandler(LOG_LEVEL_CONSOLE))
    .addHandler(new PersistingHandler(LOG_LEVEL_PERSITSTENT))

  LoggerStore.add("default", logger)

  const getLogs = () => {
    return persistenceService.getLogs()
      //.then((ls: any[]) => logs.value = ls)
  }


  return {
    getLogs, logger, TabLogger
  }

}
