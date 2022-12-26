import Query from "src/domain/Query";
import {QueryResult} from "src/domain/QueryResult";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {StatsEntry} from "src/models/StatsEntry";

export class StatsQuery implements Query<StatsEntry[]> {

  private persistenceService = IndexedDbPersistenceService

  constructor() {
  }

  query<T>(): Promise<QueryResult<StatsEntry[]>> {
    const results = this.persistenceService.getStats()
    return results
      .then((r) => new QueryResult(r, ""))
  }


}
