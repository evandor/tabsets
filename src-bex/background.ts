import {bexBackground} from 'quasar/wrappers';
import OnInstalledReason = chrome.runtime.OnInstalledReason;
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import {getDatabase, ref, onValue} from "firebase/database";

// https://stackoverflow.com/questions/49739438/when-and-how-does-a-pwa-update-itself
const updateTrigger = 10

// https://developer.chrome.com/docs/extensions/mv3/tut_analytics/
//console.log("ga: installing google analytics")

addEventListener('unhandledrejection', async (event) => {
  console.log("[service-worker] ga: fire error event", event)
  // getting error: Service worker registration failed. Status code: 15
  //Analytics.fireErrorEvent(event.reason);
});

chrome.runtime.onInstalled.addListener((callback) => {
  console.log("[service-worker] ga: fire event install", callback.reason, callback.previousVersion)
  // getting error: "Service worker registration failed. Status code: 15"
  // Analytics.fireEvent('install-' + callback.reason);
  if (callback.reason !== OnInstalledReason.CHROME_UPDATE) {
    chrome.tabs.create({
      active: true,
      url: callback.previousVersion ?
        "https://docs.tabsets.net/release-notes" :
        "https://tabsets.web.app/#/installed/"
    })
  }
  if (chrome.runtime.lastError) {
    console.warn("got runtime error", chrome.runtime.lastError)
  }
});

chrome.omnibox.onInputEntered.addListener((text) => {
  const newURL = chrome.runtime.getURL("/www/index.html#/searchresult?t=" + encodeURIComponent(text))
  chrome.tabs.create({url: newURL})
    .catch((err) => console.log("[service-worker] background.js error", err))
});

let modelPromise: any = null

// @ts-ignore
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  // @ts-ignore
  chrome.sidePanel
    .setPanelBehavior({openPanelOnActionClick: true})
    .catch((error: any) => console.error(error));
}

chrome.runtime.onInstalled.addListener((details) => {
  console.debug("adding onInstalled listener in background.ts", details)
  if (chrome.runtime.lastError) {
    console.warn("got runtime error", chrome.runtime.lastError)
  }
  // @ts-ignore
  if (chrome.action) {
    // @ts-ignore
    chrome.action.onClicked.addListener((tab) => {
      chrome.tabs.create(
        {
          url: chrome.runtime.getURL('www/index.html'),
        },
        (newTab) => {
          console.log("[service-worker] newTab", newTab)
        }
      );
    });
  } else {
    // @ts-ignore
    //browser.browserAction.onClicked.addListener(openMyPage);
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log("[service-worker] adding onStartup listener in background.ts")
  // @ts-ignore
  if (chrome.action) {
    // @ts-ignore
    chrome.action.onClicked.addListener((tab) => {
      // Opens our extension in a new browser window.
      // Only if a popup isn't defined in the manifest.

      chrome.tabs.create(
        {
          url: chrome.runtime.getURL('www/index.html'),
        },
        (newTab) => {
          console.log("[service-worker] newTab", newTab)
        }
      );
    });
  }
})

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === 'tabsetsSidepanel') {
    //console.log("[service-worker] port3", port)
    port.onDisconnect.addListener(async () => {
      //alert('Sidepanel closed.');
    });
  }
});


export default bexBackground((bridge, cons/* , allActiveConnections */) => {

  if (process.env.USE_FIREBASE == "true") {
    console.debug("[service-worker] setting up firebase")

    const firebaseApp = firebase.initializeApp({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      appId: process.env.FIREBASE_APP_ID,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      databaseURL: process.env.FIREBASE_DATABASE_URL
    })

    // @ts-ignore
    const authUserLoginListener = ({data, respond}) => {
      console.debug("[service-worker] got message 'auth.user.login'", data)
      const currentUser = data.userId
      const realtimeDb = getDatabase(firebaseApp)
      const path = 'users/' + currentUser + '/access'
      console.log("[service-worker] listening to changes on ", path)
      const userAccessRef = ref(realtimeDb, path);
      onValue(userAccessRef, (snapshot) => {
        const data = snapshot.val();
        console.debug("[service-worker] got change", data)
        if (data && data['tabsetChanged']) {
          bridge.send('fb.message.received', {
            msg: 'event.tabset.updated',
            tstamp: data['tabsetChanged'],
            origin: data['origin']
          })
        }
      })
    }

    const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

// A global promise to avoid concurrency issues
    let creatingOffscreenDocument;

// Chrome only allows for a single offscreenDocument. This is a helper function
// that returns a boolean indicating if a document is already active.
    async function hasDocument() {
      // Check all windows controlled by the service worker to see if one
      // of them is the offscreen document with the given path
      const matchedClients = await clients.matchAll();
      return matchedClients.some(
        (c) => c.url === chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
      );
    }


    async function setupOffscreenDocument(path:any) {
      console.log("===>", path)
      let creating:any = null
      // If we do not have a document, we are already setup and can skip
      if (!(await hasDocument())) {
        console.log("===> no document")
        // create offscreen document
        if (creating) {
          console.log("===> awaiting")
          await creating;
        } else {
          console.log("===> creating")
          creating = chrome.offscreen.createDocument({
            url: path,
            reasons: [
              chrome.offscreen.Reason.DOM_SCRAPING
            ],
            justification: 'authentication'
          });
          await creating;
          creating = null;
        }
      }
    }

    async function closeOffscreenDocument() {
      if (!(await hasDocument())) {
        return;
      }
      await chrome.offscreen.closeDocument();
    }

    function getAuth() {
      return new Promise(async (resolve, reject) => {
        const auth = await chrome.runtime.sendMessage({
          type: 'firebase-auth',
          target: 'offscreen'
        });
        console.log("===>", auth)
        auth?.name !== 'FirebaseError' ? resolve(auth) : reject(auth);
      })
    }

    async function firebaseAuth() {
      console.log("in firebase auth")
      await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

      const auth = await getAuth()
        .then((auth) => {
          console.log('User Authenticated', auth);
          return auth;
        })
        .catch(err => {
          if (err.code === 'auth/operation-not-allowed') {
            console.error('You must enable an OAuth provider in the Firebase' +
              ' console in order to use signInWithPopup. This sample' +
              ' uses Google by default.');
          } else {
            console.error(err);
            return err;
          }
        })
        .finally(closeOffscreenDocument)

      return auth;
    }

    //bridge.off('auth.user.login', authUserLoginListener)

    if (Object.keys(cons).length < 2) { // don't know how to do this otherwise... we are getting too many listeners
      bridge.on('auth.user.login', authUserLoginListener)
    }

    bridge.on('auth.user.logout', async ({data, respond}) => {
      console.debug("removing all bridge listeners!")
      //await firebaseAuth()
      bridge.removeAllListeners()

      console.debug("adding listener for 'auth.login.google'")
      bridge.on('auth.login.google', async ({data, respond}) => {
        console.log("auth.login.google")
        await firebaseAuth()
      })

    })

    bridge.on('auth.login.google', async ({data, respond}) => {
      console.log("auth.login.google")
      await firebaseAuth()
    })

    // === not using messaging (yet?) ===

    // const messaging = getMessaging(firebaseApp)
    //
    // getToken(messaging, {
    //   // @ts-ignore
    //   serviceWorkerRegistration: self.registration, // note: we use the sw of ourself to register with
    // }).then((token) => {
    //   bridge.send('fcm.token.received', {token: token})
    //     .then((data) => {
    //       console.log('[service-worker] fcm.token.received response', data)
    //     })
    // }).catch((err) => {
    //   console.log("[service-worker] got error:", err)
    // })
    //
    // onBackgroundMessage(messaging, async (payload: any) => {
    //   console.log(`[service-worker] Received FCM Message with payload2`, payload);
    //
    //   bridge.send('fb.message.received', payload)
    //     .then((data) => {
    //       console.log('[service-worker] fb.message.received response', data)
    //     })
    //     .catch((err) => {
    //       console.log('[service-worker] error with fb.message.received', err)
    //     })
    //
    //   const notificationTitle = 'Background Message Title!';
    //   const notificationOptions = {
    //     body: 'Background Message body.',
    //     icon: '/firebase-logo.png'
    //   };
    //
    //   // @ts-ignore
    //   await self.registration.showNotification(notificationTitle, notificationOptions);
    // })
  }

});
