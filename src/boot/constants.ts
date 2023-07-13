import {boot} from 'quasar/wrappers'

const INDEX_DB_NAME = 'db'
const INDEX_DB_VERSION = 13
const CLEANUP_PERIOD_IN_MINUTES = 10 // in prod: 10
const EXPIRE_DATA_PERIOD_IN_MINUTES = 60 // in prod: 60


const SPECIAL_ID_FOR_NO_GROUP_ASSIGNED = "no_group_assigned_identifier"

const STRIP_CHARS_IN_USER_INPUT = /[`@#$%^*()=\[\]{};':"\\|<>\/~]/;

const TAXONOMY = 'webshrinker' // or 'iabv1'


export default boot(({}) => {
})

export {
  INDEX_DB_NAME, INDEX_DB_VERSION,
  CLEANUP_PERIOD_IN_MINUTES, STRIP_CHARS_IN_USER_INPUT, EXPIRE_DATA_PERIOD_IN_MINUTES,
  TAXONOMY, SPECIAL_ID_FOR_NO_GROUP_ASSIGNED
}

