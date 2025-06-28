export class Event {
  constructor(
    public id: string,
    public created: number,
    public updated: number,
    public status: 'new',
    public event: string,
    public data: object = {},
  ) {}
}
