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

export class LogsQuery implements Query<object[]> {

  private persistenceService = IndexedDbPersistenceService

  constructor() {
  }

  query<T>(): Promise<QueryResult<LogEntry[]>> {

    //const results = useSearchStore().search(this.term, 7)
    const results = this.persistenceService.getLogs()

    const theHits: Hit[] = []

    console.log("theHits", results)
    //const r:QueryResult<any[]> = new QueryResult(results, "")
    return results.then((r) => new QueryResult(r, ""))
  }


}
