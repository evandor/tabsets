import {api} from "boot/axios";

export abstract class Logz {


  static info(message: object = {}) {
    console.log("omitting logz call ", message)
  }

  static error(message: object = {}) {
    console.log("omitting logz call ", message)
  }

  private static handleError(err: any) {
    console.log("omitting logz call ", err)
  }

}


