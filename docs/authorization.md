### Login

e.g. in SidePanelFooter

```js
const signin = () => {
  ...
  sendSignInLinkToEmail(auth, email.value, actionCodeSettings)
    .then(() => {
      ...
      window.localStorage.setItem(CURRENT_USER_EMAIL, email.value);
      sendMsg('SET_EMAIL_FOR_SIGN_IN', {"email": email.value})
    })
}
```

A mail is created by firebase, redirecting to a page defined in actionCodeSettings ("https://tabsets.web.app")

### Email opened in Browser

In ChromeListener, the extension listens on tab updates and checks the url for the email link (when a new tab is opened as the user clicks on the email link)

```js
  async onUpdated(number: number, info: chrome.tabs.TabChangeInfo, chromeTab: chrome.tabs.Tab) {
    if (info.url) {
      const emailLink = info.url;
      const urlOrigin = new URL(emailLink).origin;

      if (this.checkOriginForEmailLink(urlOrigin)) {
        const split = emailLink.split("?")
        const authRequest = split[1]
        useAuthStore().setAuthRequest(authRequest)
      }
    }
    ...
  }
```

The authRequest (something like apiKey=AIz...kY&oobCode=1...w&mode=signIn&lang=en) is stored in the authStore

### Listening to the authStore

In SidePanelPage.vue and WelcomePage.vue, there is a watch on the authRequest:

```js
watchEffect(() => {
  const ar = useAuthStore().useAuthRequest
  if (ar) {
    if (window.location.href.indexOf('?') < 0) {
      const tsIframe = window.parent.frames[0]
      console.log('iframe', tsIframe)
      if (tsIframe) {
        tsIframe.location.href = window.location.href + '?' + ar
        tsIframe.location.reload()
      }
    }
  }
})
```

"useAuthRequest" will retrieve the authRequest once (by setting it to null)

### Last Step

In App.vue, we have

```js
if (isSignInWithEmailLink(getAuth(), window.location.href)) {
  const emailForSignIn = LocalStorage.getItem("emailForSignIn")
  signInWithEmailLink(auth, emailForSignIn, window.location.href)
    .then((result: UserCredential) => {
      useAuthStore().setUser(result.user)
    })
}

```

### todos

check if isSignInWithEmailLink can be used before in checkOriginForEmailLink
we have duplicate code in SidePanelPage.vue and WelcomePage.vue
getDoc in SidePanel (check and document)
use /refresh redirect to open authenticated page?
