import {defineStore} from 'pinia';
import {ref, watchEffect} from "vue";
import {LocalStorage} from "quasar";

/**
 * a pinia store for "Windows".
 *
 * Elements are persisted to the storage provided in the initialize function
 */

export const useWindowsStore = defineStore('windows', () => {

    const currentWindow = ref<chrome.windows.Window>(null as unknown as chrome.windows.Window) //null as unknown as chrome.windows.Window

    const lastFocusedWindow = ref<chrome.windows.Window>(null as unknown as chrome.windows.Window)

    // screenshot Window
    const screenshotWindow = ref<number>(null as unknown as number)

    const chromeWindows = ref<chrome.windows.Window[]>([])

    /**
     * Map between window name and actual chrome window
     */
    const windowMap = ref<object>(LocalStorage.getItem("ui.windowMap") || {})

    /**
     * Set of all names for windows from all tabsets
     */
    const windowSet = ref<Set<string>>(new Set())

    /**
     * initialize store with
     * @param ps a persistence storage
     */
    async function initialize() {
        console.log("initializing windowsStore")
        init("initialization")
    }

    watchEffect(() => {
        console.log("updating windowMap", windowMap.value)
        LocalStorage.set("ui.windowMap", windowMap.value)
    })

    function init(trigger: string = "") {
        if (process.env.MODE === 'bex') {
            console.debug("initializing chrome windows listeners", trigger)
            chrome.windows.getAll((windows) => {
                chromeWindows.value = windows
            })
            chrome.windows.getCurrent({windowTypes: ['normal']}, (window: chrome.windows.Window) => {
                currentWindow.value = window
            })
            chrome.windows.getLastFocused({windowTypes: ['normal']}, (window: chrome.windows.Window) => {
                lastFocusedWindow.value = window
            })
        }
    }

    function initListeners() {
        if (process.env.MODE === 'bex') {
            chrome.windows.onCreated.addListener((window: chrome.windows.Window) => init("onCreated"))
            chrome.windows.onRemoved.addListener((window: number) => init("onRemoved"))
            chrome.windows.onFocusChanged.addListener(() => init("onFocusChanged"))
        }
    }

    function assignWindow(windowOpened: string, windowId: number) {
        // @ts-ignore
        windowMap.value[windowOpened as keyof object] = windowId
        console.log("windowMap", windowMap.value)
    }

    async function windowFor(windowToOpen: string) {
        if (windowToOpen === 'current') {
            return (await chrome.windows?.getCurrent()).id
        } else if (windowMap.value[windowToOpen as keyof object]) {
            const potentialWindowId = windowMap.value[windowToOpen as keyof object]
            console.log("windowFor2", potentialWindowId)
            try {
                const realWindow = await chrome.windows.get(potentialWindowId)
                return Promise.resolve(potentialWindowId)
            } catch (err) {
                // @ts-ignore
                //windowMap.value[potentialWindowId as keyof object] = null
                delete windowMap.value.potentialWindowId
                return Promise.resolve(undefined)
            }
        }
        return Promise.resolve(undefined)
    }

    function windowNameFor (id: number) {
        for (const key in windowMap.value) {
            if (windowMap.value[key as keyof object] === id) {
                return key
            }
        }
        return undefined
    }

    function addToWindowSet(windowName: string) {
        windowSet.value.add(windowName)
    }

    return {
        initialize,
        initListeners,
        currentWindow,
        assignWindow,
        windowFor,
        windowNameFor,
        addToWindowSet,
        windowSet,
        screenshotWindow
    }
})
