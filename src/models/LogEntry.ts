export class LogEntry {

  constructor(
    public timestamp: number,

    public context: string,
    public level: number,
    public msg: string
  ) {

  }

}
