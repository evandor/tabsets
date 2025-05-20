import { boot } from 'quasar/wrappers'

const EXTENSION_NAME = 'tabsets'

const INDEX_DB_VERSION = 23

const CLEANUP_PERIOD_IN_MINUTES = 10 // in prod: 10
const MONITORING_PERIOD_IN_MINUTES = process.env.DEV ? 1 : 60

const SPECIAL_ID_FOR_NO_GROUP_ASSIGNED = 'no_group_assigned_identifier'

const STRIP_CHARS_IN_USER_INPUT = /[`@#$%^*=\[\]{};"\\|<>~]/g
const STRIP_CHARS_IN_COLOR_INPUT = /[`@$%^*=\[\]{};:"\\|<>\/~]/g

// Local storage Identifiers
const TITLE_IDENT = 'title'

const APP_INSTALLATION_ID = 'app.installation.id'

const SHARING_AUTHOR_IDENT = 'sharing.author'
const SHARING_AVATAR_IDENT = 'sharing.avatar'

const CURRENT_USER_ID = 'current.user.id' // pro only
const CURRENT_USER_EMAIL = 'current.user.email' // pro only

const GITHUB_USERNAME = 'github.username'
const GITHUB_REPONAME = 'github.reponame'
const GITHUB_TOKEN = 'github.token'
const GITHUB_AUTO_BACKUP = 'github.autobackup'
const GITHUB_AUTO_SYNC = 'github.sync'
const GITHUB_AUTO_SYNC_READONLY = 'github.sync.readonly'
const GITHUB_LOG = 'github.log'
const GITHUB_PATH = 'github.path'
const GITHUB_AUTO_SYNC_LASTUPDATE = 'github.sync.lastUpdate'

const SPACES_LIMIT_NO_SUBSCRIPTION = 2 // pro only
const TABS_LIMIT_NO_SUBSCRIPTION = 100 // pro only
const TABSETS_LIMIT_NO_SUBSCRIPTION = 5 // pro only
const THUMBNAILS_LIMIT_NO_SUBSCRIPTION = 1 // pro only

const NEW_TAB_EXTENSION_ID = 'ehmmamlcpigodgfgakpkbcgddoifmcpm'

export default boot(({}) => {})

export {
  EXTENSION_NAME,
  INDEX_DB_VERSION,
  CLEANUP_PERIOD_IN_MINUTES,
  STRIP_CHARS_IN_USER_INPUT,
  STRIP_CHARS_IN_COLOR_INPUT,
  SPECIAL_ID_FOR_NO_GROUP_ASSIGNED,
  MONITORING_PERIOD_IN_MINUTES,
  SHARING_AUTHOR_IDENT,
  SHARING_AVATAR_IDENT,
  APP_INSTALLATION_ID,
  TITLE_IDENT,
  CURRENT_USER_ID,
  CURRENT_USER_EMAIL,
  GITHUB_USERNAME,
  GITHUB_REPONAME,
  GITHUB_TOKEN,
  GITHUB_AUTO_BACKUP,
  GITHUB_AUTO_SYNC,
  GITHUB_AUTO_SYNC_READONLY,
  GITHUB_AUTO_SYNC_LASTUPDATE,
  GITHUB_LOG,
  GITHUB_PATH,
  SPACES_LIMIT_NO_SUBSCRIPTION,
  TABSETS_LIMIT_NO_SUBSCRIPTION,
  TABS_LIMIT_NO_SUBSCRIPTION,
  THUMBNAILS_LIMIT_NO_SUBSCRIPTION,
  NEW_TAB_EXTENSION_ID,
}
