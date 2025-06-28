import { QueryResult } from 'src/core/domain/QueryResult'

export default interface Query<T> {
  query(): Promise<QueryResult<T>> //ICommandResponse
}
