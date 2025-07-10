import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import { AssociateWindowWithTabsetCommand } from 'src/domain/tabsets/AssociateWindowWithTabsetCommand'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'
import { useDB } from 'src/services/usePersistenceService'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import IndexedDbTabsetsPersistence from 'src/tabsets/persistence/IndexedDbTabsetsPersistence'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'

installQuasarPlugin()

vi.mock('vue-router')

describe('AssociateWindowWithTabsetCommand', () => {
  let db = null as unknown as TabsetsPersistence

  beforeEach(async () => {
    setActivePinia(createPinia())
    await IndexedDbTabsetsPersistence.init(null as unknown as IFirebaseServices)
    db = useDB(undefined).tabsetsDb
    await useTabsetsStore().initialize(db)
    await useTabsetService().init()
    await useTabsetsStore().initialize(db)
    const chromeMock = {
      windows: {
        getCurrent: async () => window,
      },
      runtime: {
        sendMessage: vi.fn(() => {}),
      },
    }
    vi.stubGlobal('chrome', chromeMock)
  })

  afterEach(async () => {
    db.clear('tabsets')
  })

  it('command has proper toString representation', async () => {
    const cmd = await new AssociateWindowWithTabsetCommand('tabsetName', 'windowName')
    expect(cmd.toString()).toBe('AssociateWindowWithTabsetCommand: {tabsetId=tabsetName, windowName=windowName}')
  })

  it('associates window name with existing tabset', async () => {
    const tsRes = await new CreateTabsetCommand('existingTabset', []).execute()
    const tabsetId = tsRes.result.tabset.id
    const executionResult = await new AssociateWindowWithTabsetCommand(tabsetId, 'newWindowName').execute()
    expect(executionResult.result).toBe(tabsetId)
    expect(executionResult.message).toBe("Window set to 'newWindowName'")

    const db = useDB(undefined).tabsetsDb
    await db.loadTabsets()
    const tabsets = useTabsetsStore().tabsets
    expect(tabsets.size).toBe(1)
    expect(tabsets.get(tabsetId)?.name).toBe('existingTabset')
    expect(tabsets.get(tabsetId)?.window).toBe('newWindowName')

    const windows = useWindowsStore().windowSet
    expect(windows.has('newWindowName')).toBeTruthy()
  })

  // it('fails associating window name with non-existing tabset', async () => {
  //   const executionResult = await new AssociateWindowWithTabsetCommand("tabsetId", "newWindowName").execute()
  //   expect(executionResult).toBe("Window set to 'newWindowName'")
  // });
})
