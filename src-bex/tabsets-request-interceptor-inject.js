var s = document.createElement('script')
// must be listed in web_accessible_resources in manifest.json
//console.log('====', chrome.runtime.getURL('tabsets-request-interceptor.js'))
s.src = chrome.runtime.getURL('tabsets-request-interceptor.js')
s.onload = function () {
  this.remove()
}
;(document.head || document.documentElement).appendChild(s)
