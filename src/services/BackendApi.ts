import { FirebaseCall } from 'src/services/firebase/FirebaseCall'

export class BackendApi {
  createPdf(html: string) {
    //return FirebaseCall.post("/pdf", {"html": html}, "blob")
    return FirebaseCall.post('http://carsten.evandor.de:5000/pdf', { html: html }, 'blob', true)
  }

  createWarc(html: string) {
    //return FirebaseCall.post("http://carsten.evandor.de:5000/warc", {"html": html}, "blob", true)
    return FirebaseCall.post('http://localhost:5010/warc', { html: html }, 'blob', true)
  }

  createPng(html: string) {
    // return FirebaseCall.post("/screenshot", {"html": html}, "blob")
    return FirebaseCall.post('http://carsten.evandor.de:5000/screenshot', { html: html }, 'blob', true)
  }
}

export default new BackendApi()
