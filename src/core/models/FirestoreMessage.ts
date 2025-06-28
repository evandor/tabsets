export class FirestoreMessage {
  constructor(
    public type: string,
    public data: any,
    public tabId: string,
    public tabsetId: string,
    public sender: string,
  ) {}
}
