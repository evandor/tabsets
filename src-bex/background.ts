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
    //console.debug("[service-worker] about to obtain cloud messaging token")

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

    //bridge.off('auth.user.login', authUserLoginListener)

    if (Object.keys(cons).length < 2) { // don't know how to do this otherwise... we are getting too many listeners
      bridge.on('auth.user.login', authUserLoginListener)
    }

    bridge.on('auth.user.logout', ({data, respond}) => {
      console.debug("removing all bridge listeners")
      bridge.removeAllListeners()
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
