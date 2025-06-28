import { uid } from 'quasar'
import { STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import { useUtils } from 'src/core/services/Utils'
import { ExcalidrawStorage } from 'src/tabsets/actionHandling/model/ExcalidrawStorage'
import { Page } from 'src/tabsets/models/cms/backend'
import { Placeholders } from 'src/tabsets/models/Placeholders'
import { TabLog } from 'src/tabsets/models/TabLog'
import { ListDetailLevel } from 'src/ui/stores/uiStore'

const { sanitizeAsText, sanitizeAsHtml } = useUtils()

export enum TabSorting {
  URL = 'URL',
  TITLE = 'TITLE',
  AGE = 'AGE',
  CUSTOM = 'CUSTOM',
}

export enum UrlExtension {
  HTML = 'HTML',
  RSS = 'RSS',
  PDF = 'PDF',
  IMAGE = 'IMAGE',
  NOTE = 'NOTE',
  UNKNOWN = 'UNKNOWN',
}

export class HTMLSelectionComment {
  date: number = 0

  constructor(
    public author: string = '',
    public comment: string = '',
  ) {
    this.date = new Date().getTime()
  }
}

export class TabCoordinate {
  // public id: string;

  constructor(
    public identifier: string,
    public val: object,
  ) {
    //this.id = uid()
  }
}

export class TabComment {
  date: number = 0
  public id: string
  public edited = false

  constructor(
    public author: string = '<me>',
    public authorEmail: string | undefined = undefined,
    public comment: string = '',
  ) {
    this.date = new Date().getTime()
    this.id = uid()

    this.comment = this.comment.replace(STRIP_CHARS_IN_USER_INPUT, '')
    if (!TabComment.commentIsShortEnough) {
      throw new Error(`Comment is too long (max. 1024 chars)`)
    }
  }

  static commentIsShortEnough = (val: string) => (val ? val.length <= 1024 : true)
}

export class TabSnippet {
  date: number = 0
  public id: string

  constructor(
    public text: string = '',
    public html: string = '',
  ) {
    this.date = new Date().getTime()
    this.id = uid()
    this.text = sanitizeAsText(text)
    this.html = sanitizeAsHtml(html)
  }
}

export enum TabPreview {
  FAVICON = 'FAVICON',
  THUMBNAIL = 'THUMBNAIL',
}

export enum TabFavorite {
  NONE = 'NONE',
  TABSET = 'TABSET',
  SPACE = 'SPACE',
}

export class Tab {
  created: number
  updated: number
  lastActive: number
  activatedCount: number
  // loadedCount: number

  createdBy: string | undefined // email or empty

  // from Chrome tab
  chromeTabId: number | undefined
  favIconUrl: string | undefined
  url: string | undefined
  title: string | undefined
  pinned: boolean
  groupId: number

  pinnedInList: boolean = false // appears in subfolders

  // from tabsets' columns
  columnId: string | undefined

  history: string[] = []

  name: string | undefined
  bookmarkUrl: string | undefined
  bookmarkId: string | undefined
  description: string
  longDescription: string | undefined
  keywords: string
  tags: string[] // Set<string> got issues in indexeddb
  image: string
  date: string
  lastModified: string
  author: string
  // deprecated, will be phased out in 0.5.1
  // use comments instead
  note: string
  scheduledFor: number | undefined
  extension: UrlExtension

  favorite: TabFavorite = TabFavorite.NONE
  contentHash: string

  httpStatus: number = 200
  httpContentType: string = 'undefined'
  httpLastModified: string = 'undefined'
  httpCheckedAt: number = 0
  httpExpires: string = ''
  httpEtag: string = ''
  httpError: string = ''
  httpInfo: string = 'undefined'

  placeholders: Placeholders | undefined

  color: string | undefined = undefined
  matcher: string | undefined = undefined

  groupName: string | undefined = undefined

  // canvasLeft: number | undefined
  // canvasTop: number | undefined
  // canvasWidth: number | undefined
  // canvasHeight: number | undefined

  comments: TabComment[] = []
  commentsLastUpdated: number = 0

  snippets: TabSnippet[] = []

  preview: TabPreview = TabPreview.FAVICON

  coordinates: TabCoordinate[] = []

  storage: ExcalidrawStorage | undefined = undefined

  tabReferences: TabReference[] = []

  quickaccess: string = ''
  log: TabLog[] = []

  lastChangeBy: string = ''

  reminder: number | undefined
  reminderComment: string | undefined

  readingTime: number = 0

  useInIframe: boolean = true

  details: ListDetailLevel = 'DEFAULT'

  page: Page | undefined = undefined

  constructor(
    public id: string,
    chromeTab: chrome.tabs.Tab,
  ) {
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.lastActive = new Date().getTime()
    this.activatedCount = 1
    //  this.loadedCount = 0 //?

    this.chromeTabId = chromeTab.id
    this.favIconUrl = chromeTab.favIconUrl
    this.url = chromeTab.url
    this.title = chromeTab.title
    this.pinned = chromeTab.pinned
    this.groupId = chromeTab.groupId
    this.groupName = undefined // to be set from 'outside'

    this.history = [] // not used (yet)
    this.name = undefined
    this.description = ''
    this.keywords = ''
    this.tags = []
    this.image = ''
    this.date = ''
    this.lastModified = ''
    this.author = ''
    this.note = ''
    this.scheduledFor = undefined
    this.extension = this.determineUrlExtension(chromeTab)
    this.contentHash = ''

    this.preview = TabPreview.FAVICON

    this.tags = []

    if (!Tab.titleIsValid) {
      throw new Error(`Tab's title '${this.title}' is not valid`)
    }

    if (!Tab.titleIsShortEnough) {
      throw new Error(`Tab's title '${this.title}' is too long`)
    }

    if (!Tab.descIsValid) {
      throw new Error(`Tab's description '${this.description}' is not valid`)
    }

    if (!Tab.descIsShortEnough) {
      throw new Error(`Tab's description is too long`)
    }
  }

  static titleIsValid = (val: string) => !STRIP_CHARS_IN_USER_INPUT.test(val)
  static descIsValid = (val: string) => !STRIP_CHARS_IN_USER_INPUT.test(val)

  static titleIsShortEnough = (val: string) => (val ? val.length <= 512 : true)
  static descIsShortEnough = (val: string) => (val ? val.length <= 1024 : true)

  determineUrlExtension(chromeTab: chrome.tabs.Tab): UrlExtension {
    let ext = UrlExtension.UNKNOWN
    if (chromeTab?.url) {
      try {
        const url = new URL(chromeTab.url)
        ext = UrlExtension.HTML
        const urlToCheck = url.href.toLowerCase().split('?')[0]!
        //console.log("urlToCheck", urlToCheck)
        if (urlToCheck.endsWith('.rss')) {
          ext = UrlExtension.RSS
        } else if (urlToCheck.endsWith('.rdf')) {
          ext = UrlExtension.RSS
        } else if (urlToCheck.endsWith('.xml')) {
          ext = UrlExtension.RSS
        } else if (urlToCheck.endsWith('.png') || urlToCheck.endsWith('.jpg') || urlToCheck.endsWith('.jpeg')) {
          ext = UrlExtension.IMAGE
        }
      } catch (err) {
        console.error('checking extension url: ', chromeTab.url, err)
      }
    }
    return ext
  }

  hasTabReference(type: TabReferenceType): boolean {
    return this.tabReferences.findIndex((ref: TabReference) => ref.type === type) >= 0
  }

  static setTags(tab: Tab, tags: string[]) {
    tab.tags = [...new Set(tags.map((tag: string) => tag.trim()))]
  }

  static addTags(tab: Tab, tags: string[]) {
    Tab.setTags(tab, tags.concat(tags))
  }

  static logIdent(tab: Tab) {
    let name = tab.title || tab.name || '<unknown>'
    name = name.length > 9 ? name.substring(0, 9) + '...' : name
    return `${name} (${tab.id.substring(0, 8)})`
  }
}

Tab.prototype.toString = function tabToString() {
  return `Tab: {id=${this.id}, url=${this.url}, #history=${this.history.length}}`
}
