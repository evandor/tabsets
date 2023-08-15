import {defineStore} from 'pinia';
import {WindowIdent} from "src/models/WindowIdent";
import PersistenceService from "src/services/PersistenceService";
import {ref} from "vue";

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
    const windowMap = ref<Map<string, chrome.windows.Window>>(new Map())

    /**
     * Set of all names for windows from all tabsets
     */
    const windowSet = ref<Set<string>> (new Set())

    /**
     * the (internal) storage for this store to use
     */
    let storage: PersistenceService = null as unknown as PersistenceService

    /**
     * initialize store with
     * @param ps a persistence storage
     */
    async function initialize(ps: PersistenceService) {
        console.log("initializing windowsStore", ps)
        storage = ps
        init("initialization")
        //await storage.loadSpaces()
    }

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

    function assignWindow (windowOpened: string, w: chrome.windows.Window) {
        windowMap.value.set(windowOpened, w)
    }

    async function windowFor(windowToOpen: string) {
        if (windowToOpen === 'current') {
            return chrome.windows.getCurrent()
        } else if (windowMap.value.has(windowToOpen)) {
            // console.log("windowFor2", windowMap.value.get(windowToOpen))
            return windowMap.value.get(windowToOpen)
        }
        return Promise.resolve(undefined)
    }

    function addToWindowSet (windowName: string) {
        windowSet.value.add(windowName)
    }

    return {
        initialize,
        initListeners,
        currentWindow,
        assignWindow,
        windowFor,
        addToWindowSet,
        windowSet
    }
})
