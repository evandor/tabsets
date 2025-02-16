// let oldXHROpen = window.XMLHttpRequest.prototype.open
// window.XMLHttpRequest.prototype.open = function () {
//   this.addEventListener('load', function () {
//     const responseBody = this.responseText
//     console.log(`Response Body: {responseBody}`)
//   })
//   return oldXHROpen.apply(this, arguments)
// }

console.log('hiererere')
//
// // does not seem to work
// // https://stackoverflow.com/questions/8939467/chrome-extension-to-read-http-response
// ;(function (xhr) {
//   var XHR = XMLHttpRequest.prototype
//
//   var open = XHR.open
//   var send = XHR.send
//   var setRequestHeader = XHR.setRequestHeader
//
//   console.log('hier...!')
//   XHR.open = function (method, url) {
//     this._method = method
//     this._url = url
//     this._requestHeaders = {}
//     this._startTime = new Date().toISOString()
//     console.log('===', xhr)
//
//     return open.apply(this, arguments)
//   }
//
//   XHR.setRequestHeader = function (header, value) {
//     console.log('===', xhr)
//
//     this._requestHeaders[header] = value
//     return setRequestHeader.apply(this, arguments)
//   }
//
//   XHR.send = function (postData) {
//     console.log('===', xhr)
//
//     this.addEventListener('load', function () {
//       console.log('===', xhr)
//
//       var endTime = new Date().toISOString()
//
//       var myUrl = this._url ? this._url.toLowerCase() : this._url
//       if (myUrl) {
//         if (postData) {
//           if (typeof postData === 'string') {
//             try {
//               // here you get the REQUEST HEADERS, in JSON format, so you can also use JSON.parse
//               this._requestHeaders = postData
//             } catch (err) {
//               console.log('Request Header JSON decode failed, transfer_encoding field could be base64')
//               console.log(err)
//             }
//           } else if (
//             typeof postData === 'object' ||
//             // typeof postData === 'array' ||
//             typeof postData === 'number' ||
//             typeof postData === 'boolean'
//           ) {
//             // do something if you need
//           }
//         }
//
//         // here you get the RESPONSE HEADERS
//         var responseHeaders = this.getAllResponseHeaders()
//
//         if (this.responseType != 'blob' && this.responseText) {
//           // responseText is string or null
//           try {
//             // here you get RESPONSE TEXT (BODY), in JSON format, so you can use JSON.parse
//             var arr = this.responseText
//
//             // printing url, request headers, response headers, response body, to console
//
//             console.log(this._url)
//             console.log(JSON.parse(this._requestHeaders))
//             console.log(responseHeaders)
//             console.log(JSON.parse(arr))
//           } catch (err) {
//             console.log('Error in responseType try catch')
//             console.log(err)
//           }
//         }
//       }
//     })
//
//     return send.apply(this, arguments)
//   }
// })(XMLHttpRequest)

// no luck either
// https://stackoverflow.com/questions/45425169/intercept-fetch-api-requests-and-responses-in-javascript
const { fetch: origFetch } = window
console.log('here', fetch)
window.fetch = async (...args) => {
  // console.log('fetch called with args:', args)
  const response = await origFetch(...args)
  if (response.url.endsWith('/graphql')) {
    /* work with the cloned response in a separate promise
       chain -- could use the same chain with `await`. */
    response
      .clone()
      .json()
      .then((data) => console.log('intercepted response data:', data))
      .catch((err) => console.error(err))
  }

  return response
}
