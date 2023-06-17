/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 */
// import * as electron from "electron";
//
// const ipc = electron.ipcRenderer
//
// window.addEventListener('DOMContentLoaded', () => {
//   console.log("adding event listener...", document?.getElementById('web_btn'))
//   document?.getElementById('web_btn')?.addEventListener("click", function () {
//     let active_hotspot_id = 'hi'
//     const reply = ipc.sendSync('hotspot-event', active_hotspot_id)
//     console.log("reply", reply)
//   });
// })


import { contextBridge, ipcRenderer, shell } from 'electron'

contextBridge.exposeInMainWorld('tabsetApi', {
  doAThing: (url:string) => {
    console.log("did a thing", url)
    ipcRenderer.invoke('tabsetApi:load-prefs', url)
    //shell.openExternal(url)
  },
  loadPreferences: () => ipcRenderer.invoke('tabsetApi:load-prefs')
})
