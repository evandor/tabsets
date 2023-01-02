import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {chrome} from "jest-chrome";
import {createPinia, setActivePinia} from "pinia";
import {CreateSessionCommand} from "src/domain/commands/CreateSessionCommand";
import "fake-indexeddb/auto"
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {INDEX_DB_VERSION} from "boot/constants";
import {useJestHelper} from 'src/domain/JestHelper'

describe('CreateSessionCommand', () => {

  jest.setTimeout(10000)

  beforeEach(() => {
    setActivePinia(createPinia())
    const request = indexedDB.open('db', INDEX_DB_VERSION);
    request.onupgradeneeded = async function () {
      await useJestHelper().dbInit(request)
    }
    process.env.MODE = "bex"
    chrome.tabs.query.mockImplementation(async (o: object) => [])
  })

  it('creates new session', async () => {
    await IndexedDbPersistenceService.init()
    const cmd = new CreateSessionCommand('newSessionId', [])
    const res = await cmd.execute()
    expect(res.message).toBe("Session newSessionId created successfully")
    expect(res.undoCommand).not.toBe(null)
  })

  it('updates session', async () => {
    await IndexedDbPersistenceService.init()
    await new CreateSessionCommand('newSessionId', []).execute()

    const res = await new CreateSessionCommand('newSessionId', []).execute()

    expect(res.message).toBe("Existing Session newSessionId can be updated now")
    expect(res.undoCommand).not.toBe(null)
  })

  it('undoes create session', async () => {
    await IndexedDbPersistenceService.init()
    const res = await new CreateSessionCommand('newSessionId', []).execute()

    const undoRes = await res.undoCommand?.execute()

    expect(undoRes.message).toBe("Session was deleted again")
    expect(undoRes.undoCommand).not.toBe(null)
  })


})
