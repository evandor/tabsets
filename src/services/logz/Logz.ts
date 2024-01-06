import {api} from "boot/axios";

export abstract class Logz {


  static info(message: object = {}) {
    console.log("logz call ", message)
    // @ts-ignore
    message['level' as keyof object] = "info"
    return this.postToLogz(message)
  }

  static error(message: object = {}) {
    console.warn("logz call ", message)
    // @ts-ignore
    message['level' as keyof object] = "error"
    return this.postToLogz(message)
  }

  private static handleError(err: any) {
    console.warn("got logz error", err)
    // if (axios.isAxiosError(err)) {
    //   const axiosError = err as AxiosError
    //   if (axiosError.response?.status === 403) {
    //     console.warn("logging out due to invalid token (potentially expired)")
    //     useAuthStore().logout();
    //   }
    // } else {
    //   console.error("error in firebase call", err)
    // }
  }

  private static async postToLogz(message: object) {
    if (process.env.MODE === 'electron') {
      return Promise.resolve('electron app, not logged')
    }
    if (process.env.LOGZ_URL) {

      try {
        console.log("sending", JSON.stringify(message))
        const response = await fetch(`${process.env.LOGZ_URL}`, {
          method: "POST",
          // mode: "cors", // no-cors, *cors, same-origin
          // cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
          // credentials: "same-origin", // include, *same-origin, omit
          // headers: {
          //   "Content-Type": "application/json",
          // },
          // redirect: "follow", // manual, *follow, error
          // referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
          body: JSON.stringify(message), // body data type must match "Content-Type" header
        });
        //console.log("answer", response)
      } catch (err) {
        console.warn("dould not send Logz message", JSON.stringify(message))
      }
    }
    return

    // axios sends additional content-type header which causes CORS issue

    // return api.post(`${process.env.LOGZ_URL}`, message)
    //   .then(() => Promise.resolve("done"))
    //   .catch((err: any) => {
    //     try {
    //       Logz.handleError(err)
    //     } catch (e) {
    //     }
    //     return Promise.resolve("not logged")
    //   })
  }
}


