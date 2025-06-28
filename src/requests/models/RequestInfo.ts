export class RequestInfo {
  created: number

  constructor(
    public id: string,
    public statusCode: number,
    public headers: chrome.webRequest.HttpHeader[],
  ) {
    this.created = new Date().getTime()
  }
}
