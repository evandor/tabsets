import { formatDistance } from 'date-fns'
import _ from 'lodash'
import sanitizeHtml from 'sanitize-html'

export type BexEvent =
  | 'open-viewport'
  | 'open-comment-request'
  | 'open-snapshots-request'
  | 'close-comment-request'
  | 'close-overlay'
  | 'start-spinner'
  | 'reload-current-tabset'
  | 'tab-added'

export function useUtils() {
  const formatDate = (timestamp: number | undefined) =>
    timestamp ? formatDistance(timestamp, new Date(), { addSuffix: true }) : ''

  const createDataTestIdentifier = (prefix: string, url: string) =>
    prefix + '_' + url.replace('https://', '').replaceAll('.', '').replaceAll('/', '')

  const inBexMode = () => process.env.MODE === 'bex'
  const modeIs = (ident: string) => process.env.MODE === ident

  const normalize = (url: string): string => {
    try {
      new URL(url)
      return url
    } catch (err) {
      return 'https://' + url
    }
  }

  const sanitize = (input: string): string => {
    return sanitizeHtml(input, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: (sanitizeHtml.defaults.allowedAttributes = {
        a: ['href', 'name', 'target'],
        img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
      }),
      allowedSchemesByTag: {
        img: ['data'],
      },
    })
  }

  const sanitizeAsText = (input: string): string => {
    return sanitizeHtml(input, {
      allowedTags: sanitizeHtml.defaults.allowedTags, //.concat(['img']),
      allowedAttributes: (sanitizeHtml.defaults.allowedAttributes = {
        a: ['href', 'name', 'target'],
      }),
    })
  }

  const sanitizeAsPlainText = (input: string): string => {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: undefined,
    })
  }

  const sanitizeAsHtml = (input: string): string => {
    return sanitizeHtml(input, {
      // disallowedTagsMode: "escape",
      // allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'base','img', 'style','script','head','html','body', 'form','a','svg','iframe','meta','body',
      // 'title','link','noscript','input','template','button','label','fieldset','picture','source','select','details','dialog','path',
      // 'option','circle','style','symbol','g','use','summary']),
      allowedTags: [],
      allowedAttributes: false,
    })
  }

  const sendMsg = (msgName: string, data: object = {}) => {
    if (inBexMode() && chrome) {
      console.debug(' >>> message', { name: msgName, data })
      chrome.runtime.sendMessage(
        {
          name: msgName,
          data: data,
        },
        (callback: any) => {
          if (callback) {
            console.log('got callback', callback)
          }
          if (chrome.runtime.lastError) {
            /* ignore */
            console.debug('Logging error after sendMsg', msgName, chrome.runtime.lastError)
          }
        },
      )
    }
  }

  const formatReadingTime = (ms: number | undefined): string => {
    if (!ms) {
      return ''
    }
    if (ms < 1000) {
      return ''
    } else if (ms < 60000) {
      return Math.round(ms / 1000) + 's.'
    } else if (ms < 60 * 60000) {
      return Math.round(ms / 60000) + 'm.'
    } else if (ms < 24 * 60 * 60000) {
      return Math.round((ms / 60) * 60000) + 'h.'
    } else {
      return '' + ms
    }
  }

  function urlToHost(url: string): string {
    return url // new approach, needed to restore window
    // try {
    //   const theURL = new URL(url)
    //   return theURL.host
    // } catch (err) {
    //   return null as unknown as string
    // }
  }

  const calcHostList = (tabs: chrome.tabs.Tab[]): string[] => {
    const stringArray = Array.from(new Set(_.map(tabs, (bwTabs: chrome.tabs.Tab) => urlToHost(bwTabs.url || ''))))
    return _.filter(stringArray, (e: string | undefined) => e !== null)
  }

  const favIconFromUrl = (url: string): string => {
    let theRealUrl
    try {
      theRealUrl = new URL(url)
    } catch (err) {
      if (url && !url.startsWith('http')) {
        url = 'https://' + url
        try {
          theRealUrl = new URL(url)
        } catch (err) {}
      }
    }
    return theRealUrl ? 'https://icons.duckduckgo.com/ip3/' + theRealUrl.hostname + '.ico' : ''
  }

  // from https://www.npmjs.com/package/serialize-selection?activeTab=code
  const restoreSelection = (
    state: any,
    referenceNode: any = undefined,
    rect: object,
    viewport: object,
    color: string = 'grey',
  ) => {
    console.log('restoring', state, rect, viewport, color)

    referenceNode = referenceNode || document.body

    let i,
      node,
      nextNodeCharIndex,
      currentNodeCharIndex = 0
    let nodes = [referenceNode]
    let sel = window.getSelection()
    let range = document.createRange()

    range.setStart(referenceNode, 0)
    range.collapse(true)

    while ((node = nodes.pop())) {
      if (node.nodeType === 3) {
        // TEXT_NODE
        nextNodeCharIndex = currentNodeCharIndex + node.length

        // if this node contains the character at the start index, set this as the
        // starting node with the correct offset
        if (state.start >= currentNodeCharIndex && state.start <= nextNodeCharIndex) {
          range.setStart(node, state.start - currentNodeCharIndex)
        }

        // if this node contains the character at the end index, set this as the
        // ending node with the correct offset and stop looking
        if (state.end >= currentNodeCharIndex && state.end <= nextNodeCharIndex) {
          range.setEnd(node, state.end - currentNodeCharIndex)
          break
        }

        currentNodeCharIndex = nextNodeCharIndex

        // range.surroundContents()
        //sel?.removeAllRanges()
      } else {
        // get child nodes if the current node is not a text node
        i = node.childNodes.length
        while (i--) {
          nodes.push(node.childNodes[i])
        }
      }
    }

    sel!.removeAllRanges()
    // console.log("adding range", range, range.getBoundingClientRect())
    sel!.addRange(range)

    console.log('range', range)
    try {
      let newNode = document.createElement('span')
      console.log('setting style to ', `background-color: ${color};`)
      newNode.setAttribute('style', `background-color: ${color};`)
      range.surroundContents(newNode)
    } catch (e) {
      console.log(e)
    }

    // if (rect['top' as keyof object] && viewport['height' as keyof object]) {
    //   const heightProportion = (document.body.scrollHeight / viewport['height' as keyof object])
    //   const top = Math.max(0, -50 + Math.round(
    //     heightProportion * rect['top' as keyof object]))
    //   console.log("scrolling to", top, heightProportion)
    //   window.scrollTo({top: top, behavior: "smooth"})
    // }
    //window.scrollBy(0,500)

    const container = range.commonAncestorContainer
    container.parentElement?.scrollIntoView({ behavior: 'smooth', inline: 'start' })

    return sel
  }

  const serializeSelection = (referenceNode: any = undefined) => {
    referenceNode = referenceNode || document.body

    var sel = window.getSelection(),
      range = sel!.rangeCount ? sel!.getRangeAt(0).cloneRange() : document.createRange(),
      startContainer = range.startContainer,
      startOffset = range.startOffset,
      state: { [k: string]: any } = { content: range.toString() }

    // move the range to select the contents up to the selection
    // so we can find its character offset from the reference node
    range.selectNodeContents(referenceNode)
    range.setEnd(startContainer, startOffset)

    state.start = range.toString().length
    state.end = state.start + state.content.length

    // add a shortcut method to restore this selection
    state.restore = restoreSelection.bind(null, state, referenceNode)

    return state
  }

  const throwIdNotFound = (identifier: string, id: string) => {
    throw new Error(`id for ${identifier} not found: ${id}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const addListenerOnce = <T extends Function>(browserEvent: chrome.events.Event<T>, listener: T) => {
    if (!browserEvent.hasListener(listener)) {
      //console.log('adding listener', listener)
      browserEvent.addListener(listener)
    }
  }

  // https://stackoverflow.com/questions/19846078/how-to-read-from-chromes-console-in-javascript
  const setupConsoleInterceptor = (uiStore: any) => {
    function timestamp() {
      return new Date().toLocaleString('sv', { timeZone: 'UTC' }) + 'Z'
    }

    function stackTrace() {
      //Create a stack trace for getting the line number and column (and other info if you want)
      return new Error().stack
    }

    function handle(handler: any, level: string, args: any, persist = true) {
      handler.apply(console, args)
      if (persist) {
        // const st = stackTrace()
        // const stack = st ? st.match(/([0-9]+):([0-9]+$)/) : ['-', '-', '-']
        // const file = stack ? stack[0] : '-'
        // const lineNum = stack ? stack[1] : '-'
        // const lineCol = stack ? stack[2] : '-'
        //uiStore.log('[' + timestamp() + '] [' + level + '] ' + args)
      }
    }

    const debugLog = console.debug.bind(console)
    const defaultLog = console.log.bind(console)
    const warnLog = console.warn.bind(console)
    const errorLog = console.error.bind(console)

    console.debug = function (...args) {
      handle(debugLog, 'debug', args, false)
    }
    console.log = function (...args) {
      handle(defaultLog, 'log', args)
    }
    console.warn = function (...args) {
      handle(warnLog, 'warn', args)
    }
    console.error = function (...args) {
      handle(errorLog, 'error', args)
    }
    window.onerror = function (error, url, line) {
      //uiStore.log(JSON.stringify([timestamp(), 'error', error, url, line]))
      return false
    }
    window.onunhandledrejection = function (e) {
      //uiStore.log(JSON.stringify([timestamp(), 'unhandled', e.reason]))
    }
  }

  function useDblClickHandler(onClick: any, onDblClick: any) {
    let expandTimes = 0
    let expandTimer: any = null

    const handleDblClick = () => {
      expandTimes++

      if (expandTimer) {
        clearTimeout(expandTimer)
      }

      expandTimer = setTimeout(() => {
        if (expandTimes === 1) {
          onClick()
        } else {
          onDblClick()
        }
        expandTimer = null
        expandTimes = 0
      }, 200)
    }

    return handleDblClick
  }

  function closeWindow() {
    chrome.tabs.getCurrent().then((current) => {
      if (current && current.id) {
        chrome.tabs.remove(current.id)
      }
    })
  }

  function isEmpty(value: any) {
    if (value === null || value === undefined) {
      return true
    }

    if (Array.isArray(value)) {
      return value.every(isEmpty)
    } else if (typeof value === 'object') {
      return Object.values(value).every(isEmpty)
    }

    return false
  }

  function replacer(key: any, value: any) {
    return isEmpty(value) ? undefined : value
  }

  function getMinimalJSON(obj: any) {
    return JSON.stringify(obj, replacer, 2)
  }

  async function openSidepanel(): Promise<any> {
    if (chrome.sidePanel) {
      console.log('setting sidepanel to open')

      const ts: chrome.tabs.Tab[] = await chrome.tabs.query({ active: true, currentWindow: true })
      // @ts-expect-error TODO
      await chrome.sidePanel.open({ windowId: ts[0].windowId })
      // await chrome.sidePanel.open({ tabId: tabId })

      return await chrome.sidePanel.setOptions({
        path: 'www/index.html',
        enabled: true,
      })
    }
    return Promise.reject('chrome.sidePanel not defined')
  }

  return {
    formatDate,
    createDataTestIdentifier,
    inBexMode,
    normalize,
    modeIs,
    sanitize,
    sanitizeAsText,
    sanitizeAsHtml,
    sanitizeAsPlainText,
    sendMsg,
    calcHostList,
    favIconFromUrl,
    restoreSelection,
    serializeSelection,
    throwIdNotFound,
    addListenerOnce,
    setupConsoleInterceptor,
    useDblClickHandler,
    formatReadingTime,
    closeWindow,
    getMinimalJSON,
    openSidepanel,
  }
}
