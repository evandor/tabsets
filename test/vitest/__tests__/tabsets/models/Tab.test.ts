import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import BrowserApi from 'src/app/BrowserApi'
import { TagInfo } from 'src/core/models/TagInfo'
import { Tab } from 'src/tabsets/models/Tab'
import { describe, expect, it } from 'vitest'

installQuasarPlugin()

describe('tags', () => {
  it('no tag duplication for manual tags', () => {
    const tab = new Tab('tabId', BrowserApi.createChromeTabObject('title', 'https://www.heise.de'))
    const newTags: TagInfo[] = [
      { label: 'heise', type: 'manual', score: 1 },
      { label: 'heise', type: 'manual', score: 1 },
    ]
    Tab.setTags(tab, newTags)
    expect(tab.tagsInfo.length).toBe(1)
  })
  it('manual tag has precedence over url tag', () => {
    const tab = new Tab('tabId', BrowserApi.createChromeTabObject('title', 'https://www.heise.de'))
    tab.tagsInfo = [{ label: 'heise', type: 'manual', score: 1 }]
    Tab.addTags(tab, [{ label: 'heise', type: 'url', score: 1 }])
    expect(tab.tagsInfo.length).toBe(1)
    expect(tab.tagsInfo[0]!.type).toBe('manual')
  })

  it('no tag duplication for url tags', () => {
    const tab = new Tab('tabId', BrowserApi.createChromeTabObject('title', 'https://www.heise.de'))
    const newTags: TagInfo[] = [
      { label: 'heise', type: 'url', score: 1 },
      { label: 'heise', type: 'url', score: 1 },
    ]
    Tab.setTags(tab, newTags)
    expect(tab.tagsInfo.length).toBe(1)
  })
  it('url tag has precedence over hierarchy tag', () => {
    const tab = new Tab('tabId', BrowserApi.createChromeTabObject('title', 'https://www.heise.de'))
    tab.tagsInfo = [{ label: 'heise', type: 'url', score: 1 }]
    Tab.addTags(tab, [{ label: 'heise', type: 'hierarchy', score: 1 }])
    expect(tab.tagsInfo.length).toBe(1)
    expect(tab.tagsInfo[0]!.type).toBe('url')
  })

  it('no tag duplication for hierarchy tags', () => {
    const tab = new Tab('tabId', BrowserApi.createChromeTabObject('title', 'https://www.heise.de'))
    const newTags: TagInfo[] = [
      { label: 'heise', type: 'hierarchy', score: 1 },
      { label: 'heise', type: 'hierarchy', score: 1 },
    ]
    Tab.setTags(tab, newTags)
    expect(tab.tagsInfo.length).toBe(1)
  })
  it('hierarchy tag has precedence over keywords tag', () => {
    const tab = new Tab('tabId', BrowserApi.createChromeTabObject('title', 'https://www.heise.de'))
    tab.tagsInfo = [{ label: 'heise', type: 'hierarchy', score: 1 }]
    Tab.addTags(tab, [{ label: 'heise', type: 'keyword', score: 1 }])
    expect(tab.tagsInfo.length).toBe(1)
    expect(tab.tagsInfo[0]!.type).toBe('hierarchy')
  })

  it('no tag duplication for keyword tags', () => {
    const tab = new Tab('tabId', BrowserApi.createChromeTabObject('title', 'https://www.heise.de'))
    const newTags: TagInfo[] = [
      { label: 'heise', type: 'keyword', score: 1 },
      { label: 'heise', type: 'keyword', score: 1 },
    ]
    Tab.setTags(tab, newTags)
    expect(tab.tagsInfo.length).toBe(1)
  })
  it('keyword tag has precedence over langDetection tag', () => {
    const tab = new Tab('tabId', BrowserApi.createChromeTabObject('title', 'https://www.heise.de'))
    tab.tagsInfo = [{ label: 'heise', type: 'keyword', score: 1 }]
    Tab.addTags(tab, [{ label: 'heise', type: 'langDetection', score: 1 }])
    expect(tab.tagsInfo.length).toBe(1)
    expect(tab.tagsInfo[0]!.type).toBe('keyword')
  })

  it('no tag duplication for langDetection tags', () => {
    const tab = new Tab('tabId', BrowserApi.createChromeTabObject('title', 'https://www.heise.de'))
    const newTags: TagInfo[] = [
      { label: 'heise', type: 'langDetection', score: 1 },
      { label: 'heise', type: 'langDetection', score: 1 },
    ]
    Tab.setTags(tab, newTags)
    expect(tab.tagsInfo.length).toBe(1)
  })
  it('langDetection tag has precedence over classification tag', () => {
    const tab = new Tab('tabId', BrowserApi.createChromeTabObject('title', 'https://www.heise.de'))
    tab.tagsInfo = [{ label: 'heise', type: 'langDetection', score: 1 }]
    Tab.addTags(tab, [{ label: 'heise', type: 'classification', score: 1 }])
    expect(tab.tagsInfo.length).toBe(1)
    expect(tab.tagsInfo[0]!.type).toBe('langDetection')
  })

  it('no tag duplication for classification tags', () => {
    const tab = new Tab('tabId', BrowserApi.createChromeTabObject('title', 'https://www.heise.de'))
    const newTags: TagInfo[] = [
      { label: 'heise', type: 'classification', score: 1 },
      { label: 'heise', type: 'classification', score: 1 },
    ]
    Tab.setTags(tab, newTags)
    expect(tab.tagsInfo.length).toBe(1)
  })
})
