import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {BaseHandler, ConsoleHandler, ILogRecord, Logger, LogLevel} from "logging-library";
import PersistenceService from "src/services/PersistenceService";

class PersistingHandler extends BaseHandler {

  persistenceService: PersistenceService = IndexedDbPersistenceService

  constructor(level: LogLevel | LogLevel[]) {
    super(level);
  }

  protected log(record: ILogRecord): void {
    this.persistenceService.saveLog(record.level, record.message)
  }

}

export function useLoggingServicee() {

  const persistenceService = IndexedDbPersistenceService

  const logger = new Logger()
    .addHandler(new ConsoleHandler(LogLevel.DEBUG))
    .addHandler(new PersistingHandler(LogLevel.INFO))

  const getLogs = () => {
    return persistenceService.getLogs()
      //.then((ls: any[]) => logs.value = ls)
  }

  return {
    getLogs
  }

}
