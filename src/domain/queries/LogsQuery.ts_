import Query from "src/domain/Query";
import {QueryResult} from "src/domain/QueryResult";
import {LogEntry} from "src/models/LogEntry";
import {useDB} from "src/services/usePersistenceService";

const {db} = useDB()

export class LogsQuery implements Query<object[]> {

  constructor() {
  }

  query<T>(): Promise<QueryResult<LogEntry[]>> {
    const results = db.getLogs()
    return results
      .then((r) => new QueryResult(r, ""))
  }


}
