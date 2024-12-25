import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useDB } from 'src/services/usePersistenceService'
import { CreateSpaceCommand } from 'src/spaces/commands/CreateSpaceCommand'
import { Space } from 'src/spaces/models/Space'
import SpacesPersistence from 'src/spaces/persistence/SpacesPersistence'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import { SaveOrReplaceResult } from 'src/tabsets/models/SaveOrReplaceResult'
import { TabsetStatus } from 'src/tabsets/models/Tabset'
import { LocalStorageTabsetsPersistence } from 'src/tabsets/persistence/LocalStorageTabsetsPersistence'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

installQuasarPlugin()

const storage = new LocalStorageTabsetsPersistence()

describe('tabsetsUiStore', () => {
  let startTime = 0
  let db = null as unknown as TabsetsPersistence
  let spacesDb = null as unknown as SpacesPersistence

  beforeEach(async () => {
    setActivePinia(createPinia())
    await useTabsetsUiStore().initialize(storage)
    db = useDB(undefined).tabsetsIndexedDb
    await useTabsetsStore().initialize(db)
    await useTabsetService().init()
    spacesDb = useDB(undefined).spacesDb
    await useSpacesStore().initialize(spacesDb)
    startTime = useTabsetsUiStore().lastUpdate
  })

  afterEach(async () => {
    db.clear('tabsets')
    spacesDb.clear('spaces')
    storage.clear(undefined)
  })

  it('initial load yields empty list', () => {
    useTabsetsUiStore().load()
    expect(useTabsetsUiStore().lastUsedTabsets.length).toBe(0)
  })

  it('addTabsetToLastUsedList adds tabset id to list', () => {
    useTabsetsUiStore().load()

    useTabsetsUiStore().addTabsetToLastUsedList('tsId')

    expect(useTabsetsUiStore().lastUsedTabsets.length).toBe(1)
    expect(useTabsetsUiStore().lastUpdate).greaterThanOrEqual(startTime)
  })

  it('addTabsetToLastUsedList adds tabset id to list for space', async () => {
    useTabsetsUiStore().load()

    const res: ExecutionResult<Space> = await useCommandExecutor().execute(
      new CreateSpaceCommand('spaceA'),
    )
    useSpacesStore().space = res.result
    useTabsetsUiStore().addTabsetToLastUsedList('tsId')

    expect(useTabsetsUiStore().lastUsedTabsets.length).toBe(1)
    expect(useTabsetsUiStore().lastUpdate).greaterThanOrEqual(startTime)

    useSpacesStore().space = null as unknown as Space
    useTabsetsUiStore().load()
    expect(useTabsetsUiStore().lastUsedTabsets.length).toBe(0)
  })

  it('favorite tabsets are added to list', async () => {
    const res: ExecutionResult<SaveOrReplaceResult> = await useCommandExecutor().execute(
      new CreateTabsetCommand('tabsetName'),
    )
    const ts = res.result.tabset
    ts.status = TabsetStatus.FAVORITE
    await useTabsetsStore().saveTabset(ts)

    useTabsetsUiStore().load()

    expect(useTabsetsUiStore().lastUsedTabsets.length).toBe(1)
    expect(useTabsetsUiStore().lastUpdate).greaterThanOrEqual(startTime)
  })

  it('favorite and added tabsets are combined', async () => {
    const res: ExecutionResult<SaveOrReplaceResult> = await useCommandExecutor().execute(
      new CreateTabsetCommand('tabsetName'),
    )
    const ts = res.result.tabset
    ts.status = TabsetStatus.FAVORITE
    await useTabsetsStore().saveTabset(ts)

    useTabsetsUiStore().load()
    useTabsetsUiStore().addTabsetToLastUsedList('tsId')

    expect(useTabsetsUiStore().lastUsedTabsets.length).toBe(2)
    expect(useTabsetsUiStore().lastUpdate).greaterThanOrEqual(startTime)
  })

  it('id is added only once', async () => {
    useTabsetsUiStore().addTabsetToLastUsedList('tsId')
    useTabsetsUiStore().addTabsetToLastUsedList('tsId')

    expect(useTabsetsUiStore().lastUsedTabsets.length).toBe(1)
  })

  it('limit is kept', async () => {
    useTabsetsUiStore().addTabsetToLastUsedList('tsId1')
    useTabsetsUiStore().addTabsetToLastUsedList('tsId2')
    useTabsetsUiStore().addTabsetToLastUsedList('tsId3')

    expect(useTabsetsUiStore().lastUsedTabsets.length).toBe(3)

    useTabsetsUiStore().addTabsetToLastUsedList('tsId4')

    const tsIds = useTabsetsUiStore().lastUsedTabsets
    expect(tsIds.length).toBe(3)
    expect(tsIds.join(',')).toBe('tsId2,tsId3,tsId4')
  })

  it('id can be removed', async () => {
    useTabsetsUiStore().addTabsetToLastUsedList('tsId1')
    useTabsetsUiStore().addTabsetToLastUsedList('tsId2')
    expect(useTabsetsUiStore().lastUsedTabsets.length).toBe(2)

    useTabsetsUiStore().clearFromLastUsedTabsets(undefined, 'tsId1')
    expect(useTabsetsUiStore().lastUsedTabsets.length).toBe(1)
  })
})
