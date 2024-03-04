import {boot} from 'quasar/wrappers'
import {api} from "boot/axios";

const version = import.meta.env.PACKAGE_VERSION

// function mapLevel(input:string) {
//   switch (input) {
//     case "debug":
//       return 7
//     case "info":
//       return 5
//     case "warn":
//       return 4
//     case "error":
//       return 3
//     default:
//       return 2
//   }
// }

async function log(log: ILogtailLog): Promise<ILogtailLog> {
  const objectToLog = {
    ...log,
    mode: process.env.MODE,
    version: version,
    stage: process.env.TABSETS_STAGE
  }
  // https://go2docs.graylog.org/5-0/getting_in_log_data/gelf.html
  const gelfMessage = {
    "version": "1.1",
    "host": "browser.local",
    "short_message": log.message,
    "level": mapLevel(log.level),
    _mode: process.env.MODE,
    _version: version,
    _stage: process.env.TABSETS_STAGE
  }
  api.post("http://graylog.tabsets.net:12201/gelf", gelfMessage, {headers: {
      "Content-Type": "application/json"}
  })
  return objectToLog;
}


export default boot(({}) => {
})

export {
  graylog
}

