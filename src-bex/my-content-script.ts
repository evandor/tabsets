import { createBridge } from '#q-app/bex/content'

console.log('[BEX-CT] loading my-content-scripts')

const bridge = createBridge({ debug: true })

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
    zIndex: '9999999', // Make sure it's on top
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

bridge.on('open-comment-request', ({ payload }) => {
  console.log('open-comment-request', payload)
  //setIFrameHeight(payload.height)
  if (commentFrame) {
    commentFrame?.style.setProperty('display', 'block')
    return
  }

  commentFrame = document.createElement('iframe')
  commentFrame.id = 'comment-iframe'
  //commentFrame.width = '100%'
  resetIFrameHeight()

  // Assign some styling so it looks seamless
  Object.assign(commentFrame.style, {
    position: 'absolute',
    top: '50px',
    right: '20px',
    width: '350px',
    height: '450px',
    border: '1px solid grey',
    borderRadius: '5px',
    zIndex: '9999998',
    background: 'white',
    // overflow: 'visible'
  })
  ;(function () {
    // When the page loads, insert our browser extension app.
    commentFrame.src = chrome.runtime.getURL('www/index.html#/mainpanel/comment?portName=' + bridge.portName)
    console.log('iframe source', commentFrame.src)
    document.body.prepend(commentFrame)
  })()
})

bridge.on('close-comment-request', ({ payload }) => {
  console.log('close-comment-request', payload)
  commentFrame?.style.setProperty('display', 'none')
  return 'done'
})

bridge.on('save-comment-request', ({ payload }) => {
  //const ts = useTabsetsStore().getCurrentTabset
  console.log('save-comment-request', payload)
  //commentFrame?.style.setProperty('display', 'none')
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
