import {formatDistance} from "date-fns";
import sanitizeHtml from "sanitize-html";
import {Tab} from "src/models/Tab";
import {useWindowsStore} from "stores/windowsStore";
import {useTabsStore} from "stores/tabsStore";

export function useUtils() {

    const formatDate = (timestamp: number | undefined) =>
        timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

    const createDataTestIdentifier = (prefix: string, url: string) =>
        prefix + "_" + url.replace("https://", "").replaceAll('.', '').replaceAll("/", "")

    const inBexMode = () => process.env.MODE === 'bex'
    const modeIs = (ident: string) => process.env.MODE === ident

    const normalize = (url: string): string => {
        try {
            new URL(url)
            return url
        } catch (err) {
            return "https://" + url
        }
    }

    const sanitize = (input: string): string => {
        return sanitizeHtml(input, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
            allowedAttributes: sanitizeHtml.defaults.allowedAttributes = {
                a: ['href', 'name', 'target'],
                img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading']
            },
            allowedSchemesByTag: {
                img: ['data']
            }
        })
    }

    const sanitizeAsText = (input: string): string => {
        return sanitizeHtml(input, {
            allowedTags: sanitizeHtml.defaults.allowedTags,//.concat(['img']),
            allowedAttributes: sanitizeHtml.defaults.allowedAttributes = {
                a: ['href', 'name', 'target']
            }
        })
    }

    const sendMsg = (msgName: string, data: object) => {
        if (inBexMode() && chrome) {
            console.log("sending message", {name: msgName, data})
            chrome.runtime.sendMessage({
                name: msgName, data: data
            }, (callback: any) => {
                if (callback) {
                    console.log("got callback", callback)
                }
                if (chrome.runtime.lastError) { /* ignore */
                }
            });
        }
    }
    const isCurrentTab = (tab: Tab) => {
        if (!inBexMode() && !tab.url) {
            return false
        }
        const windowId = useWindowsStore().currentWindow?.id || 0
        const currentChromeTab = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
        if  (currentChromeTab.url === tab.url) {
            return true
        }
        //console.log("checking", currentChromeTab.url, "/" + btoa(tab.url || ''), currentChromeTab.url?.indexOf("/" + btoa(tab.url || '')) )
        if (currentChromeTab.url && currentChromeTab.url?.indexOf("/" + btoa(tab.url || '')) >= 0) {
            return true
        }
        return false
    }

    return {
        formatDate,
        createDataTestIdentifier,
        inBexMode,
        normalize,
        modeIs,
        sanitize,
        sanitizeAsText,
        sendMsg,
        isCurrentTab
    }
}
