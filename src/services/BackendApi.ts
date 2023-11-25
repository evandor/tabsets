import {Notification} from "src/models/Notification";
import {FirebaseCall} from "src/services/firebase/FirebaseCall";

export class BackendApi {

  getNotifications = (): Promise<Notification[]> => FirebaseCall.get("/notifications")

  createPdf(html: string) {
    return FirebaseCall.post("/pdf", {"html": html}, "blob")
  }

  createPng(html: string) {
    // return FirebaseCall.post("/screenshot", {"html": html}, "blob")
    return FirebaseCall.post("http://carsten.evandor.de:5000/screenshot", {"html": html}, "blob", true)
  }
}

export default new BackendApi();
