export class Message {
  constructor(
    public id: string,
    public created: number,
    public updated: number,
    public status: 'new',
    public message: string,
    public actionPath?: string,
  ) {}
}
