import Query from "src/domain/Query";
import {QueryResult} from "src/domain/QueryResult";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {LogEntry} from "src/models/LogEntry";
import {useLoggingServicee} from "src/services/useLoggingService";

const {logger} = useLoggingServicee()

export class LogsQuery implements Query<object[]> {

  private persistenceService = IndexedDbPersistenceService

  constructor() {
  }

  query<T>(): Promise<QueryResult<LogEntry[]>> {
    const results = this.persistenceService.getLogs()
    return results
      .then((r) => new QueryResult(r, ""))
  }


}
