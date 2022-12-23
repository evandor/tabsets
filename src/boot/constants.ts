import {boot} from 'quasar/wrappers'

const MAX_TABS_TO_SHOW = 12
const INDEX_DB_NAME = 'db'
const INDEX_DB_VERSION = 6
const CLEANUP_PERIOD_IN_MINUTES = 1 // in prod: 10
const EXPIRE_DATA_PERIOD_IN_MINUTES = 60 // in prod: 60

const STRIP_CHARS_IN_USER_INPUT = /[`@#$%^&*()=\[\]{};':"\\|<>\/~]/;

const LOG_LEVEL = "info"

export default boot(({}) => {
})

export {
  MAX_TABS_TO_SHOW,
  INDEX_DB_NAME, INDEX_DB_VERSION,
  CLEANUP_PERIOD_IN_MINUTES, STRIP_CHARS_IN_USER_INPUT, EXPIRE_DATA_PERIOD_IN_MINUTES,
  LOG_LEVEL
}

