/**
 * noop service to satisfy submodules dependencies
 */
export class BackendApi {

  createPdf(html: string) {
  }

  createPng(html: string) {
    return Promise.reject("no op")
  }
}

export default new BackendApi();
