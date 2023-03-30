import Query from "src/domain/Query";
import {QueryResult} from "src/domain/QueryResult";
import {StatsEntry} from "src/models/StatsEntry";
import {useDB} from "src/services/usePersistenceService";

const {db} = useDB()

export class StatsQuery implements Query<StatsEntry[]> {

  constructor() {
  }

  query<T>(): Promise<QueryResult<StatsEntry[]>> {
    const results = db.getStats()
    return results
      .then((r) => new QueryResult(r, ""))
  }


}
