import {api} from "boot/axios";

const version = import.meta.env.PACKAGE_VERSION

function log(msg: string, level:number) {
  const gelfMessage = {
    "version": "1.1",
    "host": "browser.local",
    "short_message": msg,
    "level":level,
    _mode: process.env.MODE,
    _version: version,
    _stage: process.env.TABSETS_STAGE
  }
  api.post("http://graylog.tabsets.net:12201/gelf", gelfMessage, {headers: {
      "Content-Type": "application/json"}
  })
}

export function useLogger() {

  const info = (msg: string) => {
    log(msg, 5)
  }

  const error = (msg: string) => {
    log(msg, 3)
  }

  return {
    info,
    error
  }
}