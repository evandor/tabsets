import {boot} from 'quasar/wrappers'
import {Logtail} from "@logtail/browser";

const INDEX_DB_VERSION = 19

const CLEANUP_PERIOD_IN_MINUTES = 10 // in prod: 10
const EXPIRE_DATA_PERIOD_IN_MINUTES = 60 // in prod: 60
const MONITORING_PERIOD_IN_MINUTES = 60 // in prod: 60


const SPECIAL_ID_FOR_NO_GROUP_ASSIGNED = "no_group_assigned_identifier"

const STRIP_CHARS_IN_USER_INPUT = /[`@#$%^*=\[\]{};:"\\|<>\/~]/;
const STRIP_CHARS_IN_COLOR_INPUT = /[`@$%^*=\[\]{};:"\\|<>\/~]/;

const PUBLIC_SHARE_URL = "https://shared.tabsets.net/"
const RELEASE_NOTES_URL = "https://us-central1-tabsets-backend-prd.cloudfunctions.net/app/share/preview/5d2cccf9-83ea-40be-bc84-37b03e38af1d"
//const PUBLIC_SHARE_URL = "http://localhost:9200/"

// Local storage Identifiers
const TITLE_IDENT = 'title';

const SUBSCRIPTION_ID_IDENT = 'subscription.id';

const SHARING_AUTHOR_IDENT = 'sharing.author';
const SHARING_AVATAR_IDENT = 'sharing.avatar';
const SHARING_MQTT_IDENT = 'sharing.mqttUrl';
const SHARING_INSTALLATION = 'sharing.installation'

const SYNC_TYPE = "sync.type"

const SYNC_GITLAB_URL = "sync.gitlab.url"
const SYNC_GITLAB_TOKEN = "sync.gitlab.token"

const SYNC_GITHUB_URL = "sync.github.url"
const SYNC_GITHUB_TOKEN = "sync.github.token"

const SYNC_COUCHDB_USERNAME = "sync.couchdb.username"
const SYNC_COUCHDB_PASSWORD = "sync.couchdb.password"
const SYNC_COUCHDB_URL = "sync.couchdb.url"


const logtail = (process.env.MODE === "bex") ?
  new Logtail("Ht8PY3XGQgqhMyNTcyGyJhXJ") :
  new Logtail("pNfaHtRmWXGd3TFbsCXMHHbB")

export default boot(({}) => {
})

export {
  INDEX_DB_VERSION,
  CLEANUP_PERIOD_IN_MINUTES, STRIP_CHARS_IN_USER_INPUT, STRIP_CHARS_IN_COLOR_INPUT,
  EXPIRE_DATA_PERIOD_IN_MINUTES, SPECIAL_ID_FOR_NO_GROUP_ASSIGNED,MONITORING_PERIOD_IN_MINUTES,
  PUBLIC_SHARE_URL,
  RELEASE_NOTES_URL,
  SUBSCRIPTION_ID_IDENT,
  SHARING_AUTHOR_IDENT,
  SHARING_AVATAR_IDENT,
  SHARING_MQTT_IDENT,
  SHARING_INSTALLATION,
  SYNC_TYPE,
  SYNC_GITLAB_URL,
  SYNC_GITLAB_TOKEN,
  SYNC_GITHUB_URL,
  SYNC_GITHUB_TOKEN,
  SYNC_COUCHDB_USERNAME,
  SYNC_COUCHDB_PASSWORD,
  SYNC_COUCHDB_URL,
  TITLE_IDENT,
  logtail
}

