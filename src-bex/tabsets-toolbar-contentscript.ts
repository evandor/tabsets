import { createBridge } from '#q-app/bex/content'

console.log('[BEX-CT] loading tabsets-toolbar-contentscript')

const bridge = createBridge({ debug: false })

//bridge.log('Hello world!!!')
bridge.log('portname', bridge.portName)

/**
 * When the drawer is toggled set the iFrame height to take the whole page.
 * Reset when the drawer is closed.
 */
bridge.on('wb.drawer.toggle', (x) => {
  console.log('got message', x, x.payload.height)
  //if ((x['data' as keyof object] as any).open) {
  setIFrameHeight(x.payload.height)
  /*} else {
    resetIFrameHeight()
  }
  const f = x['respond' as keyof object] as any
  f()*/

  return { banner: 'Hello from a content-script!' }
})

bridge.on('getUrl', (x) => {
  console.log('got message', x)
  return { url: location.href }
})

// *** iFrame for top navigation / tabs-integration ***
const defaultFrameHeight = '42px'
var iframeId = 'tabset-nav-iframe'
let iFrame: HTMLIFrameElement | undefined = undefined
let commentFrame: HTMLIFrameElement | undefined = undefined

let frames: Map<string, HTMLIFrameElement> = new Map()

function setIFrameHeight(height: string) {
  bridge.log('logging2', height)
  if (iFrame) {
    iFrame.height = height
  }
}

function resetIFrameHeight() {
  if (iFrame) {
    setIFrameHeight(defaultFrameHeight)
  }
}

const existing = document.getElementById('tabset-nav-iframe')
//console.log('existing', existing, document.getElementsByTagName('iframe').length)
if (!existing) {
  iFrame = document.createElement('iframe')
  iFrame.id = iframeId
  iFrame.width = '100%'
  resetIFrameHeight()

  // Assign some styling so it looks seamless
  Object.assign(iFrame.style, {
    // position: 'fixed',
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    border: '0',
    zIndex: '2147483647', // Make sure it's on top
    // overflow: 'visible'
  })
  ;(function () {
    // When the page loads, insert our browser extension app.
    iFrame.src = chrome.runtime.getURL('www/index.html#/mainpanel/navigation?portName=' + bridge.portName)
    console.log('iframe source', iFrame.src)
    document.body.prepend(iFrame)
  })()
}

declare module '@quasar/app-vite' {
  interface BexEventMap {
    'some.event': [{ someProp: string }, void]
  }
}

// bridge.on('open-comment-request', ({ payload }) => {
//   console.log('open-comment-request', payload)
//   //setIFrameHeight(payload.height)
//   if (commentFrame) {
//     commentFrame?.style.setProperty('display', 'block')
//     return
//   }
//
//   commentFrame = document.createElement('iframe')
//   commentFrame.id = 'comment-iframe'
//   //commentFrame.width = '100%'
//   resetIFrameHeight()
//
//   // Assign some styling so it looks seamless
//   Object.assign(commentFrame.style, {
//     position: 'absolute',
//     top: '50px',
//     right: '20px',
//     width: '350px',
//     height: '450px',
//     border: '1px solid grey',
//     borderRadius: '5px',
//     zIndex: '9999998',
//     background: 'white',
//     // overflow: 'visible'
//   })
//   ;(function () {
//     // When the page loads, insert our browser extension app.
//     commentFrame.src = chrome.runtime.getURL('www/index.html#/mainpanel/comment?portName=' + bridge.portName)
//     console.log('iframe source', commentFrame.src)
//     document.body.prepend(commentFrame)
//   })()
// })

// bridge.on('close-comment-request', ({ payload }) => {
//   console.log('close-comment-request', payload)
//   commentFrame?.style.setProperty('display', 'none')
//   return 'done'
// })

bridge.on('save-comment-request', ({ payload }) => {
  //const ts = useTabsetsStore().getCurrentTabset
  console.log('save-comment-request', payload)
  //commentFrame?.style.setProperty('display', 'none')
  return 'done'
})

function openIFrame(name: string) {
  console.log('opening frame', name, frames)
  if (frames.get(name)) {
    frames.get(name)!.style.setProperty('display', 'block')
  }
}

function closeIFrame(name: string) {
  console.log('closing frame', name, frames)
  if (frames.get(name)) {
    frames.get(name)!.style.setProperty('display', 'none')
  }
}

bridge.on('open-viewport', ({ payload }) => {
  const name = payload.name
  console.log('open-viewport', name, payload, [...frames.keys()])
  // close all (other) overlays
  ;[...frames.keys()].forEach((name: string) => {
    console.log('checking name', name, frames.get(name))
    closeIFrame(name)
    // frames.get(name)!.style.setProperty('display', 'none')
  })
  if (frames.has(name)) {
    openIFrame(name)
    return
  }

  const frame = document.createElement('iframe')
  frames.set(name, frame)
  frame.id = name + '-iframe'
  console.log(`created frame for '${name}'`, frames)
  //resetIFrameHeight()

  // Assign some styling so it looks seamless
  Object.assign(frame.style, {
    position: 'absolute',
    top: '50px',
    right: '20px',
    width: payload.width,
    height: payload.height,
    border: '2px solid #7740EB',
    borderRadius: '10px',
    zIndex: '2147483647',
    background: 'white',
    // overflow: 'visible'
  })
  ;(function () {
    // When the page loads, insert our browser extension app.
    frame.src = chrome.runtime.getURL('www/index.html#/' + payload.page + '?portName=' + bridge.portName)
    console.log('iframe source', frame.src)
    document.body.prepend(frame)
  })()
})

bridge.on('close-overlay', ({ payload }) => {
  console.log('close-overlay', payload)
  const name = payload.name
  closeIFrame(name)
  return 'done'
})

bridge
  .connectToBackground()
  .then(() => {
    console.log('Connected to background...')
  })
  .catch((err) => {
    console.error('Failed to connect to background:', err)
  })

// Current bridge port name (can be 'content@<name>-<xxxxx>')
console.log('[BEX-CT] bridge.portName', bridge.portName)

// Dynamically set debug mode
// bridge.setDebug(true); // boolean
//
