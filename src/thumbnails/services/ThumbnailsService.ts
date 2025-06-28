import AppEventDispatcher from 'src/app/AppEventDispatcher'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import ThumbnailsPersistence from 'src/thumbnails/persistence/ThumbnailsPersistence'

let db: ThumbnailsPersistence = null as unknown as ThumbnailsPersistence

export function useThumbnailsService() {
  const init = async (storage: ThumbnailsPersistence) => {
    db = storage
    await db.init()
    //initListeners()
    // console.debug(` ...initialized thumbnails: Service`, '✅')
  }

  const saveThumbnailFor = (tabId: string, tabsetId: string, thumbnail: string) => {
    console.log(`saving thumbnail for ${tabsetId}:${tabId}`)
    db.saveThumbnail(tabId, tabsetId, thumbnail)
      //.then(() => console.log('added thumbnail'))
      .catch((err) => console.log('err', err))
  }

  const getThumbnailFor = (tabId: string | undefined, userId: string) => {
    return tabId && db ? db.getThumbnail(tabId, userId) : Promise.reject(`no thumbnail for tabId ${tabId}`)
  }

  const removeThumbnailsFor = (tabId: string): Promise<any> => {
    return db.deleteThumbnail(tabId)
  }

  const cleanUpThumbnails = (fnc: (url: string) => boolean) => {
    return //db.cleanUpThumbnails(fnc)
  }

  const handleCaptureCallback = (tabId: string, tabsetId: string, dataUrl: string) => {
    if (chrome.runtime.lastError) {
      console.log('got error', chrome.runtime.lastError)
      return
    }
    if (dataUrl === undefined) {
      console.log('dataUrl was undefined')
      return
    }
    console.log(`capturing thumbnail for ${tabId}, original size ${Math.round(dataUrl.length / 1024) + 'kB'}`)

    var img = new Image()

    // https://stackoverflow.com/questions/19262141/resize-image-with-javascript-canvas-smoothly
    img.onload = function () {
      // set size proportional to image
      //canvas.height = canvas.width * (img.height / img.width);

      var oc = document.createElement('canvas')
      var octx = oc.getContext('2d')
      let quality = 0.5 * useSettingsStore().thumbnailQuality
      oc.width = Math.round((img.width * 0.7 * quality) / 100)
      oc.height = Math.round((img.height * 0.7 * quality) / 100)
      // @ts-expect-error TODO
      octx.drawImage(img, 0, 0, oc.width, oc.height)

      console.log(
        `capturing ${oc.width}x${oc.height} thumbnail with quality ${useSettingsStore().thumbnailQuality}, ${Math.round(oc.toDataURL().length / 1024)}kB`,
      )
      saveThumbnailFor(tabId, tabsetId, oc.toDataURL())
      //sendResponse({imgSrc: dataUrl});
    }
    img.src = dataUrl //"https://i.imgur.com/SHo6Fub.jpg";
  }

  const captureVisibleTab = (
    tabId: string,
    tabsetId: string,
    fnc: (tabId: string, tabsetId: string, dataUrl: string) => void = function (
      tabId: string,
      tabsetId: string,
      dataUrl,
    ) {
      AppEventDispatcher.dispatchEvent('capture-screenshot', {
        tabId: tabId,
        tabsetId: tabsetId,
        data: dataUrl,
      })
    },
  ) => {
    try {
      chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl: string) => {
        //console.log("hier2", dataUrl.length, fnc, tabId)
        // @ts-expect-error TODO
        fnc.call<any, string[], void>(this, tabId, tabsetId, dataUrl)
      })
    } catch (err) {
      console.warn('got error when saving thumbnail', err)
    }
  }

  return {
    init,
    saveThumbnailFor,
    removeThumbnailsFor,
    cleanUpThumbnails,
    getThumbnailFor,
    handleCaptureCallback,
    captureVisibleTab,
  }
}
