export class QueryResult<T> {
  constructor(
    public result: T,
    public message: string,
  ) {}
}
