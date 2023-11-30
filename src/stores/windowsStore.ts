import {defineStore} from 'pinia';
import {ref} from "vue";
import PersistenceService from "src/services/PersistenceService";
import {useUtils} from "src/services/Utils";
import {Window} from "src/models/Window";
import _ from "lodash"
import throttledQueue from "throttled-queue";

/**
 * a pinia store for "Windows".
 *
 * Elements are persisted to the storage provided in the initialize function
 */

let storage: PersistenceService = null as unknown as PersistenceService

function closeTabWithTimeout(timeout: number, tabToCloseId: number | undefined = undefined): Promise<string> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (tabToCloseId) {
                chrome.tabs.remove(tabToCloseId).catch((err) => console.debug(err))
            }
            resolve("Success!");
        }, timeout);
    });
}

export const useWindowsStore = defineStore('windows', () => {

    const {inBexMode} = useUtils()

    /**
     * the map of all 'ever used' Chrome windows, even if they are not currently in use,
     * using the title as key. //TODO
     */
    const allWindows = ref<Map<number, Window>>(new Map())

    /**
     * the array all actually currently opened Chrome windows.
     */
    const currentWindows = ref<chrome.windows.Window[]>([])

    const currentWindow = ref<chrome.windows.Window>(null as unknown as chrome.windows.Window) //null as unknown as chrome.windows.Window

    const currentWindowName = ref<string | undefined>(undefined)

    const lastFocusedWindow = ref<chrome.windows.Window>(null as unknown as chrome.windows.Window)

    // screenshot Window
    const screenshotWindow = ref<number>(null as unknown as number)

    /**
     * Set of all names for windows from all tabsets, initialized when
     * tabsets are added during startup (tabsStore#addTabset)
     */
    const windowSet = ref<Set<string>>(new Set())

    /**
     * initialize store with
     * @param ps a persistence storage
     */
    async function initialize(providedDb: PersistenceService) {
        console.log("initializing windowsStore")
        storage = providedDb
        setup("initialization")
    }

    function setup(trigger: string = "") {
        if (!inBexMode()) {
            return
        }
        console.debug("init chrome windows listeners with trigger", trigger)
        chrome.windows.getAll((windows) => {

            currentWindows.value = windows
            console.debug("initializing current windows with", currentWindows.value)

            // adding potentially new windows to storage
            const res: Promise<any>[] = windows.flatMap((window: chrome.windows.Window) => {
                return storage.addWindow(new Window(window.id || 0, window, undefined))
            })

            // setting all (new and older) windows to 'allWindows'
            Promise.all(res)
                .then(() => {
                    allWindows.value = new Map()
                    storage.getWindows().then(res => {
                        res.forEach(r => {
                            allWindows.value.set(r.id || 0, r)
                            //console.log("assigned:", r.id)
                        })
                        //console.log("%callWindows assigned", "color:green", allWindows.value)

                        chrome.windows.getCurrent({windowTypes: ['normal']}, (window: chrome.windows.Window) => {
                            currentWindow.value = window
                            if (currentWindow.value && currentWindow.value.id) {
                                //console.log("%c******", "color:blue", currentWindow.value.id, windowNameFor(currentWindow.value.id))
                                currentWindowName.value = windowNameFor(currentWindow.value.id)
                            }
                        })
                    })

                })
        })

        chrome.windows.getLastFocused({windowTypes: ['normal']}, (window: chrome.windows.Window) => {
            lastFocusedWindow.value = window
        })

    }

    async function onRemoved(windowId: number) {
        // remove only if window does not have a title
        const w = await storage.getWindow(windowId)
        console.debug("on removed", w, windowId)
        if (w && !w.title) {
            removeWindow(windowId)
        }
        setup("onRemove")
    }

    async function onUpdate(windowId: number) {
        if (windowId >= 0) {
            //console.log("updating window for id", windowId)
            const window = await chrome.windows.get(windowId)
            //console.log("updating window", windowId, window)
            await storage.updateWindow(new Window(windowId, window))
        }
    }

    function initListeners() {
        if (inBexMode()) {
            chrome.windows.onCreated.addListener((window: chrome.windows.Window) => setup("onCreated"))
            chrome.windows.onRemoved.addListener((windowId: number) => onRemoved(windowId))
            chrome.windows.onFocusChanged.addListener((windowId) => onUpdate(windowId))
            chrome.windows.onBoundsChanged.addListener((window: chrome.windows.Window) => onUpdate(window.id || 0))
        }
    }

    function assignWindow(windowOpened: string, windowId: number) {
        // @ts-ignore
        // windowMap.value[windowOpened as keyof object] = windowId
        // console.log("windowMap", windowMap.value)
    }

    function windowNameFor(id: number) {
        return allWindows.value.get(id)?.title
    }

    function windowIdFor(name: string): number | undefined {
        return _.find([...allWindows.value.keys()], key => {
            const val = allWindows.value.get(key)
            return val?.title === name
        })
    }

    async function currentWindowFor(windowToOpen: string): Promise<chrome.windows.Window | undefined> {
        if (windowToOpen === 'current' && chrome && chrome.windows) {
            // @ts-ignore
            return await chrome.windows.getCurrent()
        } else if (windowIdFor(windowToOpen)) {
            const potentialWindowId = windowIdFor(windowToOpen)
            // console.log("windowFor2", potentialWindowId)
            if (potentialWindowId) {
                try {
                    return await chrome.windows.get(potentialWindowId)
                } catch (err) {
                    return Promise.resolve(undefined)
                }
            }
            // try {
            //     const realWindow = await chrome.windows.get(potentialWindowId)
            //     return Promise.resolve(potentialWindowId)
            // } catch (err) {
            //     // @ts-ignore
            //     //windowMap.value[potentialWindowId as keyof object] = null
            //     //delete windowMap.value.potentialWindowId
            //     return Promise.resolve(undefined)
            // }
        }
        return Promise.resolve(undefined)
    }

    async function windowFor(title: string): Promise<Window | undefined> {
        const windowsFromDb = await storage.getWindows()
        for (const w of windowsFromDb) {
            if (w['title' as keyof object] === title) {
                return w
            }
        }
        return undefined
    }

    function addToWindowSet(windowName: string) {
        if (windowName !== 'current') {
            windowSet.value.add(windowName)
        }
    }

    async function upsertWindow(window: chrome.windows.Window, ident: string, screenLabel: string | undefined = undefined) {
        await storage.upsertWindow(new Window(window.id || 0, window), ident, screenLabel)
    }

    async function removeWindow(windowId: number) {
        await storage.removeWindow(windowId)
            .catch((err) => console.warn("could not delete window " + windowId + " due to: " + err))
    }

    function openThrottledInWindow(urls: string[], windowCreateData: object = {focused: true, width: 1024, height: 800}) {
        console.log("%copenThrottledInWindow...", "color:green")
        const throttleOnePerXSeconds = throttledQueue(1, 1000, true)
        chrome.windows.create(windowCreateData, (window: any) => {

            //console.log("%cgot window", "color:green", window.id)

            useWindowsStore().screenshotWindow = window.id
            let tabToClose: number | undefined = undefined

            const promises: Promise<any>[] = []
            for (const u of urls) {
                if (u.indexOf("${") >= 0) {
                    console.debug("not monitoring url due to placeholder(s)", u)
                    break
                }
                const p = throttleOnePerXSeconds(async () => {
                    const createProperties = {windowId: window.id, url: u}
                    //console.log("createProperties", createProperties)
                    chrome.tabs.create(createProperties, (tab: chrome.tabs.Tab) => {
                        tabToClose = tab.id
                        closeTabWithTimeout(2000, tab.id)
                    })
                    return closeTabWithTimeout(1000)
                })
                promises.push(p)
            }

            Promise.all(promises)
                .then(() => {
                    setTimeout(() => {
                        //console.log("setting timeout")
                        chrome.windows.remove(window.id)
                        useWindowsStore().screenshotWindow = null as unknown as number
                    }, 2000)
                })
        })
    }

    return {
        initialize,
        initListeners,
        currentWindows,
        currentWindow,
        currentWindowName,
        assignWindow,
        windowFor,
        windowNameFor,
        currentWindowFor,
        addToWindowSet,
        windowSet,
        screenshotWindow,
        upsertWindow,
        removeWindow,
        openThrottledInWindow
    }
})
