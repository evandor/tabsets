import {boot} from 'quasar/wrappers'

const INDEX_DB_VERSION = 18

const CLEANUP_PERIOD_IN_MINUTES = 10 // in prod: 10
const EXPIRE_DATA_PERIOD_IN_MINUTES = 60 // in prod: 60
const MONITORING_PERIOD_IN_MINUTES = 60 // in prod: 60


const SPECIAL_ID_FOR_NO_GROUP_ASSIGNED = "no_group_assigned_identifier"

const STRIP_CHARS_IN_USER_INPUT = /[`@#$%^*=\[\]{};:"\\|<>\/~]/;
const STRIP_CHARS_IN_COLOR_INPUT = /[`@$%^*=\[\]{};:"\\|<>\/~]/;

const PUBLIC_SHARE_URL = "https://shared.tabsets.net/"
//const PUBLIC_SHARE_URL = "http://localhost:9200/"

// Local storage Identifiers
const SUBSCRIPTION_ID_IDENT = 'subscription.id';

const SHARING_AUTHOR_IDENT = 'sharing.author';
const SHARING_AVATAR_IDENT = 'sharing.avatar';
const SHARING_MQTT_IDENT = 'sharing.mqttUrl';
const SHARING_INSTALLATION = 'sharing.installation'

const SYNC_GIT_URL = "sync.git.url"
const SYNC_GIT_TOKEN = "sync.git.token"

export default boot(({}) => {
})

export {
  INDEX_DB_VERSION,
  CLEANUP_PERIOD_IN_MINUTES, STRIP_CHARS_IN_USER_INPUT, STRIP_CHARS_IN_COLOR_INPUT,
  EXPIRE_DATA_PERIOD_IN_MINUTES, SPECIAL_ID_FOR_NO_GROUP_ASSIGNED,MONITORING_PERIOD_IN_MINUTES,
  PUBLIC_SHARE_URL,
  SUBSCRIPTION_ID_IDENT,
  SHARING_AUTHOR_IDENT,
  SHARING_AVATAR_IDENT,
  SHARING_MQTT_IDENT,
  SHARING_INSTALLATION,
  SYNC_GIT_URL,
  SYNC_GIT_TOKEN
}

