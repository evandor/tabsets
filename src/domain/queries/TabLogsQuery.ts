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
import {Predicate, TabPredicate} from "src/domain/Types";
import {Tab} from "src/models/Tab";

const {logger} = useLoggingServicee()

export class TabLogsQuery implements Query<object[]> {

  private persistenceService = IndexedDbPersistenceService

  constructor(public tabUrl: string) {
  }

  query<T>(): Promise<QueryResult<LogEntry[]>> {
    const predicate: Predicate<LogEntry> = (t: LogEntry) => t.context === "url_" + btoa(this.tabUrl)
    return this.persistenceService.getLogs(predicate)
      .then((r) => new QueryResult(r, ""))
  }


}
