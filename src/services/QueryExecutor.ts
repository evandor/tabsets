import Command from "src/domain/Command";
import {useNotificationHandler} from "src/services/ErrorHandler";
import Query from "src/domain/Query";
import {QueryResult} from "src/domain/QueryResult";

const {handleSuccess, handleError} = useNotificationHandler()

export function useQueryExecutor(logger: any) {

  const queryFromUi = (query: Query): Promise<QueryResult> => {
    logger.info("running query:", query)
    return query.query(logger)
      // .then(res => handleSuccess(res, logger))
      // .then(res => console.log("command finished"))
      // .catch(err => handleError(err, logger))
  }

  return {
    queryFromUi
  }
}
