import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";
import {useDB} from "src/services/usePersistenceService";
import {useTabsStore} from "stores/tabsStore";
import PersistenceService from "src/services/PersistenceService";
import {useTabsetService} from "src/services/TabsetService2";
import {CreateDocumentationCommand} from "src/domain/pages/CreateDocumentationCommand";

installQuasarPlugin();

vi.mock('vue-router')

describe('AddTabToTabsetCommand', () => {

  let db = null as unknown as PersistenceService

  vi.stubGlobal('open', vi.fn());

  beforeEach(async () => {
    setActivePinia(createPinia())
    await IndexedDbPersistenceService.init("db")
    db = useDB(undefined).db
    await useTabsetService().init(db)
  })

  afterEach(async() => {
    db.clear("tabsets")
  })

  it('command has proper toString representation', async () => {
    const cmd = await new CreateDocumentationCommand("docName")
    expect(cmd.toString()).toBe("CreateDocumentationCommand: {tabsetName=docName}")
  })

  // https://dev.to/lesalvucci/how-to-test-windowopen-in-vue-with-vitest-56pn
  it('creates new documentation in empty DB', async () => {
    const spy = vi.spyOn(window, 'open');
    const executionResult = await new CreateDocumentationCommand("doc1").execute()
    expect(executionResult.result.tabset.name).toBe("doc1")
    //expect(executionResult.message).toBe("Tabset 'tabsetName' created successfully")
    expect(spy).toHaveBeenCalledOnce()
    //toBeCalledWith("#/mainpanel/notes/?tsId=a869ee9f-2bbb-4b4a-9273-269a6f1be1cf&edit=true", '_blank');

    const db = useDB(undefined).db
    await db.loadTabsets()
    const tabsets = useTabsStore().tabsets
    expect(tabsets.size).toBe(1)
    expect(tabsets.get(executionResult.result.tabset.id)?.name).toBe("doc1")
  });

  it('creates second doc in non-empty DB', async () => {
    const spy = vi.spyOn(window, 'open');
    await new CreateDocumentationCommand("doc2").execute()
    const executionResult = await new CreateDocumentationCommand("doc3").execute()
    await db.loadTabsets()
    const tabsets = useTabsStore().tabsets
    expect(tabsets.size).toBe(2)
    expect(tabsets.get(executionResult.result.tabset.id)?.name).toBe("doc3")
  });



});
