import {QueryResult} from "src/domain/QueryResult";

export default interface Query<T> {

  query(logger: any): Promise<QueryResult<T>> //ICommandResponse

}
