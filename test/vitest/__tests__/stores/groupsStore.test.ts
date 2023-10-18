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
import {DeleteChromeGroupCommand} from "src/domain/groups/DeleteChromeGroupCommand";
import {useGroupsStore} from "stores/groupsStore";
import ChromeApi from "src/services/ChromeApi";

installQuasarPlugin();

vi.mock('vue-router')

describe('GroupsStore', () => {

    let db = null as unknown as PersistenceService

    beforeEach(async () => {
        setActivePinia(createPinia())
        await IndexedDbPersistenceService.init("db")
        db = useDB(undefined).db
        await useTabsetService().init(db)

        // https://groups.google.com/a/chromium.org/g/chromium-extensions/c/hssoAlvluW8
        const chromeMock = {
            tabGroups: {
                query: vi.fn((_queryInfo, callback) => {
                    console.log("mocking chrome.tabGroups.query", _queryInfo)
                    callback([]);
                }),
            },
            runtime: {
                sendMessage: vi.fn(() => {})
            }
        };

        vi.stubGlobal('chrome', chromeMock);
    })

    afterEach(async() => {
        db.clear("tabsets")
        db.clear("groups")
    })

    it('persists group', async () => {
        await useGroupsStore().initialize(db)
        await useGroupsStore().persistGroup(ChromeApi.createChromeTabGroupObject(1, "groupName", 'grey' as chrome.tabGroups.ColorEnum))

        const groups = await  db.getGroups()
        expect(groups.length).toBe(1)
    })

    it('persists group with changing title', async () => {
        await useGroupsStore().initialize(db)
        await useGroupsStore().persistGroup(ChromeApi.createChromeTabGroupObject(1, "ab", 'grey' as chrome.tabGroups.ColorEnum))
        await useGroupsStore().persistGroup(ChromeApi.createChromeTabGroupObject(1, "abc", 'grey' as chrome.tabGroups.ColorEnum))

        const groups = await  db.getGroups()
        expect(groups.length).toBe(1)
        expect(groups[0].title).toBe("abc")
    })






});
