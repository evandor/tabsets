import Query from "src/core/domain/Query";
import {QueryResult} from "src/core/domain/QueryResult";

export function useQueryExecutor() {

  const queryFromUi = (query: Query<any>): Promise<QueryResult<any>> => {
    //logger.info("running query:", query)
    return query.query()
      // .then(res => handleSuccess(res, logger))
      // .then(res => console.log("command finished"))
      // .catch(err => handleError(err, logger))
  }

  return {
    queryFromUi
  }
}
