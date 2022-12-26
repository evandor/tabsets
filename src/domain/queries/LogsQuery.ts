import Query from "src/domain/Query";
import {QueryResult} from "src/domain/QueryResult";
import _ from "lodash";
import {Hit} from "src/models/Hit";
import {uid} from "quasar";
import ChromeApi from "src/services/ChromeApi";
import {useSearchStore} from "stores/searchStore";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import persistenceService from "src/services/PersistenceService";
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
