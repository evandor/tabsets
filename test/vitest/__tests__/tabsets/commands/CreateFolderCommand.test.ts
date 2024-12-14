import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import {CreateTabsetCommand} from "src/tabsets/commands/CreateTabsetCommand";
import {useDB} from "src/services/usePersistenceService";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {CreateFolderCommand} from "src/tabsets/commands/CreateFolderCommand";
import {uid} from "quasar";

installQuasarPlugin();

vi.mock('vue-router')

async function createTabset() {
  const createTabsetResult = await new CreateTabsetCommand("new Tabset", []).execute()
  return createTabsetResult.result.tabset;
}


describe('CreateFolderCommand', () => {

  let db = null as unknown as TabsetsPersistence

  beforeEach(async () => {
    setActivePinia(createPinia())
    db = useDB(undefined).tabsetsIndexedDb
    await useTabsetsStore().initialize(db)
    // await useTabsetService().init()
  })

  afterEach(async () => {
    db.clear("tabsets")
  })



  it('add sub folder to tabset root', async () => {
    const tabset = await createTabset();
    await new CreateFolderCommand(uid(),"subA", [], tabset.id).execute()
    expect(tabset.folders.length).toBe(1)
    expect(tabset.folders[0]!.name).toBe("subA")
  });

  it('add subsub folder using parentFolderId', async () => {
    const tabset = await createTabset();
    const res = await new CreateFolderCommand(uid(),"subB", [], tabset.id).execute()
    const subBId = res.result
    await new CreateFolderCommand(uid(),"subsubB", [], tabset.id, subBId.id).execute()
    expect(tabset.folderActive).toBe(undefined)
    expect(tabset.folders.length).toBe(1)
    expect(tabset.folders[0]!.name).toBe("subB")
    const subSubFolders = tabset.folders[0]!.folders
    expect(subSubFolders.length).toBe(1)
    expect(subSubFolders[0]!.name).toBe("subsubB")
  });

  it('add subsub folder using active folder of tabset', async () => {
    const tabset = await createTabset();
    const res = await new CreateFolderCommand(uid(),"subC", [], tabset.id).execute()
    const subCId = res.result
    tabset.folderActive = subCId.id
    await new CreateFolderCommand(uid(),"subsubC", [], tabset.id).execute()
    expect(tabset.folderActive).toBe(subCId.id)
    expect(tabset.folders.length).toBe(1)
    expect(tabset.folders[0]!.name).toBe("subC")
    const subSubFolders = tabset.folders[0]!.folders
    expect(subSubFolders.length).toBe(1)
    expect(subSubFolders[0]!.name).toBe("subsubC")
  });


});
