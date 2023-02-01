import {boot} from 'quasar/wrappers'
import {LogLevel} from "logging-library";

const MAX_TABS_TO_SHOW = 12
const INDEX_DB_NAME = 'db'
const INDEX_DB_VERSION = 9
const CLEANUP_PERIOD_IN_MINUTES = 10 // in prod: 10
const EXPIRE_DATA_PERIOD_IN_MINUTES = 60 // in prod: 60

const LOG_LEVEL_CONSOLE = LogLevel.DEBUG

const LOG_LEVEL_PERSITSTENT = LogLevel.DEBUG

const STRIP_CHARS_IN_USER_INPUT = /[`@#$%^*()=\[\]{};':"\\|<>\/~]/;

const LOG_LEVEL = "info"

export default boot(({}) => {
})

export {
  MAX_TABS_TO_SHOW,
  INDEX_DB_NAME, INDEX_DB_VERSION,
  CLEANUP_PERIOD_IN_MINUTES, STRIP_CHARS_IN_USER_INPUT, EXPIRE_DATA_PERIOD_IN_MINUTES,
  LOG_LEVEL,LOG_LEVEL_CONSOLE,LOG_LEVEL_PERSITSTENT
}

