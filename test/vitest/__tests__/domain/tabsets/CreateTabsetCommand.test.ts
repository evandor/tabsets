import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'
import { useDB } from 'src/services/usePersistenceService'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import IndexedDbTabsetsPersistence from 'src/tabsets/persistence/IndexedDbTabsetsPersistence'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'

installQuasarPlugin()

vi.mock('vue-router')

describe('CreateTabsetCommand', () => {
  let db = null as unknown as TabsetsPersistence
  //let suggestionsDB = IndexedDbSuggestionsPersistence

  beforeEach(async () => {
    setActivePinia(createPinia())
    await IndexedDbTabsetsPersistence.init(null as unknown as IFirebaseServices)
    db = useDB(undefined).tabsetsDb
    await useTabsetsStore().initialize(db)
    await useSuggestionsStore().init(useDB(undefined).suggestionsDb)
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
    // db.clear('tabs')
  })

  it('command has proper toString representation', () => {
    const cmd = new CreateTabsetCommand('tabsetName', [])
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    expect(cmd.toString()).toBe(
      'CreateTabsetCommand: {merge=true, tabsetName=tabsetName, tabs#=0, windowToOpen#=current}',
    )
  })

  it('creates new tabset in empty DB', async () => {
    const executionResult = await new CreateTabsetCommand('tabsetName', []).execute()
    expect(executionResult.result.replaced).toBe(false)
    expect(executionResult.result.tabset.name).toBe('tabsetName')
    expect(executionResult.message).toBe('Tabset created')

    const db = useDB(undefined).tabsetsDb
    await db.loadTabsets()
    const tabsets = useTabsetsStore().tabsets
    expect(tabsets.size).toBe(1)
    expect(tabsets.get(executionResult.result.tabset.id)?.name).toBe('tabsetName')
  })

  it('creates second tabset in non-empty DB', async () => {
    await new CreateTabsetCommand('tabsetName1', []).execute()
    const executionResult = await new CreateTabsetCommand('tabsetName2', []).execute()
    await db.loadTabsets()
    const tabsets = useTabsetsStore().tabsets
    expect(tabsets.size).toBe(2)
    expect(tabsets.get(executionResult.result.tabset.id)?.name).toBe('tabsetName2')
  })

  // it('overwrites existing tabset', async () => {
  //   await new CreateTabsetCommand("tabsetName3", []).execute()
  //   const executionResult = await new CreateTabsetCommand("tabsetName3", []).execute()
  //   expect(executionResult.result.replaced).toBe(true)
  //   expect(executionResult.result.tabset.name).toBe("tabsetName3")
  //   expect(executionResult.result.merged).toBe(true)
  //   expect(executionResult.message).toBe("Existing Tabset 'tabsetName3' can be updated now")
  //
  //   await db.loadTabsets()
  //   const tabsets = useTabsetsStore().tabsets
  //   expect(tabsets.size).toBe(1)
  //   expect(tabsets.get(executionResult.result.tabset.id)?.name).toBe("tabsetName3")
  // });
  //
  // it('can be undone', async () => {
  //   const executionResult = await new CreateTabsetCommand("tabsetName4", []).execute()
  //   const undoCommand = executionResult.undoCommand
  //   expect(undoCommand).not.toBeUndefined()
  //   await undoCommand?.execute()
  //   await db.loadTabsets()
  //   expect(useTabsetsStore().tabsets.size).toBe(0)
  // })
})
