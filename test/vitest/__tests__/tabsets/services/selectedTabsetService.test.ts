import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import { LocalStorage } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { useSelectedTabsetService } from 'src/tabsets/services/selectedTabsetService'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

installQuasarPlugin()

vi.mock('vue-router')

function mockBrowserWindowsToReturn(window: chrome.windows.Window) {
  const chromeMock = {
    windows: {
      getCurrent: async () => window,
    },
  }
  vi.stubGlobal('chrome', chromeMock)
}

describe('selectTabsetServices', () => {
  const window100: chrome.windows.Window = BrowserApi.createChromeWindowObject(100, 17, 28, [])
  const window200: chrome.windows.Window = BrowserApi.createChromeWindowObject(200, 17, 28, [])

  beforeEach(async () => {
    setActivePinia(createPinia())

    LocalStorage.remove('selectedTabset')
    LocalStorage.remove('selectedTabsets')
  })

  afterEach(async () => {
    // db.clear('tabsets')
  })

  it('default tabset', async () => {
    LocalStorage.setItem('selectedTabset', '123')
    const localStorage = await useSelectedTabsetService().getFromStorage()
    expect(localStorage).toBe('123')
  })

  it('tabset from windowToTabsetMap', async () => {
    LocalStorage.setItem('selectedTabset', '123')
    mockBrowserWindowsToReturn(window100)
    await useSelectedTabsetService().setCurrentTabsetId('tabsetId1')
    const localStorage = await useSelectedTabsetService().getFromStorage()
    expect(localStorage).toBe('tabsetId1')
  })

  it('set current tabset id for first window', async () => {
    mockBrowserWindowsToReturn(window100)
    await useSelectedTabsetService().setCurrentTabsetId('tabsetId1')
    expect(LocalStorage.getItem('selectedTabset')).toBe('tabsetId1')
    expect(LocalStorage.getItem('selectedTabsets')).toStrictEqual({ 'window-100': 'tabsetId1' })
  })

  it('set new current tabset id for first window', async () => {
    mockBrowserWindowsToReturn(window100)
    await useSelectedTabsetService().setCurrentTabsetId('tabsetId1')
    await useSelectedTabsetService().setCurrentTabsetId('tabsetId2')
    expect(LocalStorage.getItem('selectedTabset')).toBe('tabsetId2')
    expect(LocalStorage.getItem('selectedTabsets')).toStrictEqual({ 'window-100': 'tabsetId2' })
  })

  it('set new current tabset id to undefined', async () => {
    mockBrowserWindowsToReturn(window100)
    await useSelectedTabsetService().setCurrentTabsetId('tabsetId1')
    await useSelectedTabsetService().setCurrentTabsetId(undefined)
    expect(LocalStorage.getItem('selectedTabset')).toBe(null)
    expect(LocalStorage.getItem('selectedTabsets')).toStrictEqual({})
  })

  it('set current tabset ids for two windows', async () => {
    mockBrowserWindowsToReturn(window100)
    await useSelectedTabsetService().setCurrentTabsetId('tabsetId1')
    mockBrowserWindowsToReturn(window200)
    await useSelectedTabsetService().setCurrentTabsetId('tabsetId2')

    expect(LocalStorage.getItem('selectedTabset')).toBe('tabsetId2')
    expect(LocalStorage.getItem('selectedTabsets')).toStrictEqual({
      'window-100': 'tabsetId1',
      'window-200': 'tabsetId2',
    })
  })

  it('get selected tabset id', async () => {
    mockBrowserWindowsToReturn(window100)
    const selectedTabset = await useSelectedTabsetService().getSelectedTabsetId()
    expect(selectedTabset).toBe(undefined)

    await useSelectedTabsetService().setCurrentTabsetId('tabsetId1')
    const res2 = await useSelectedTabsetService().getSelectedTabsetId()
    expect(res2).toBe('tabsetId1')
  })

  it('clears the current tabset id', async () => {
    mockBrowserWindowsToReturn(window100)
    await useSelectedTabsetService().setCurrentTabsetId('tabsetId1')
    mockBrowserWindowsToReturn(window200)
    await useSelectedTabsetService().setCurrentTabsetId('tabsetId2')
    expect(await useSelectedTabsetService().getSelectedTabsetId()).toBe('tabsetId2')

    await useSelectedTabsetService().clearCurrentTabsetId('tabsetId2')
    expect(await useSelectedTabsetService().getSelectedTabsetId()).toBe(undefined)
  })

  it('clears a window by id', async () => {
    mockBrowserWindowsToReturn(window100)
    await useSelectedTabsetService().setCurrentTabsetId('tabsetId1')
    expect(await useSelectedTabsetService().getSelectedTabsetId()).toBe('tabsetId1')

    await useSelectedTabsetService().clearWindow(100)
    expect(await useSelectedTabsetService().getSelectedTabsetId()).toBe(undefined)
  })
})
