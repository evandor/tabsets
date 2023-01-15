import {BaseHandler, ILogRecord, LogLevel} from "logging-library";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";

export class PersistingHandler extends BaseHandler {

  private readonly db = IndexedDbPersistenceService

  constructor(level: LogLevel | LogLevel[]) {
    super(level);
  }

  protected log(record: ILogRecord): void {
    this.db.saveLog(record.context, record.level, record.message)
      .catch((err) => console.warn("could not write to log:", err))
  }

}
