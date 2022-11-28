import { boot } from 'quasar/wrappers'

const MAX_TABS_TO_SHOW = 12
const INDEX_DB_NAME= 'db'
const CLEANUP_PERIOD_IN_MINUTES = 1

const STRIP_CHARS_IN_USER_INPUT = /[`@#$%^&*()=\[\]{};':"\\|<>\/~]/;

export default boot(({}) => {
  //app.config.globalProperties.$
})

export { MAX_TABS_TO_SHOW, INDEX_DB_NAME, CLEANUP_PERIOD_IN_MINUTES, STRIP_CHARS_IN_USER_INPUT }

