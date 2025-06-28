import { LocalStorage } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { GITHUB_AUTO_SYNC, GITHUB_AUTO_SYNC_LASTUPDATE } from 'src/boot/constants'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { Space } from 'src/spaces/models/Space'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { GithubCommands } from 'src/tabsets/commands/github/GithubCommands'
import { SpaceEvent, TabEvent, TabsetEvent, TabsetEventType } from 'src/tabsets/commands/github/GithubWriteEventCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'

export class GithubReadEventsCommand extends GithubCommands<string> {
  constructor(public lastUpdate: number) {
    super()
  }

  async execute(): Promise<ExecutionResult<string>> {
    const githubPath = 'events'
    //console.log('useData', useData, this.event)
    if (!LocalStorage.getItem(GITHUB_AUTO_SYNC)) {
      return Promise.resolve(new ExecutionResult('done', 'not active'))
    }
    try {
      const events = await this.githubGetContentRequest(githubPath)
      //console.log('events', events)
      // if (events.status == 404) {
      //   await this.githubPutContentRequest(githubPath, useData)

      if (events.ok) {
        let firstErrorOccuredAt: number | undefined = undefined
        let lastSuccessOccuredAt: number | undefined = undefined

        const existing = await events.json()
        const decodedContent = decodeURIComponent(escape(window.atob(existing.content)))
        // console.log('got existing', decodedContent)
        let index = 0
        const lines = decodedContent.split('\n')
        for (const line of lines) {
          if (line.trim().length === 0) {
            continue
          }
          const parts = line.split('|')
          let timestampLine = 0
          try {
            timestampLine = Number.parseInt(parts[0]!)
            if (timestampLine < this.lastUpdate) {
              continue
            }

            const progress = Math.round((100 * index) / lines.length)
            useUiStore().setProgress(progress / 100, `syncing... ${progress}%`)

            if (parts.length < 5) {
              console.warn(`found incomplete line ${line}"`)
              continue
            }

            switch (parts[1]) {
              case 'tabset':
                if (parts[3] && parts[5]) {
                  // 1743063915313|tabset|added|0339a468-4df1-4e00-94ba-496171cf8d88||Mails
                  const tabsetEvent = new TabsetEvent(
                    parts[2] as TabsetEventType,
                    parts[3],
                    parts[4],
                    parts[5],
                    parts[6] ? parts[6].split(',') : [],
                  )
                  switch (tabsetEvent.event) {
                    case 'added':
                      if (tabsetEvent.parentId) {
                        // console.log('processing line', line)
                        const folderChain = useTabsetsStore().getFolderChain(tabsetEvent.parentId)
                        // console.log('folderChain', folderChain)
                        if (folderChain.length > 0) {
                          const rootTabset = useTabsetsStore().getTabset(folderChain[folderChain.length - 1]!)
                          //console.log('found root tabset', rootTabset)
                          const tabsetOrFolder = useTabsetsStore().getActiveFolder(rootTabset!, tabsetEvent.parentId)
                          //console.log('tabsetOrfolder', tabsetOrFolder)
                          if (tabsetOrFolder) {
                            const newTabset = new Tabset(
                              tabsetEvent.tabsetId,
                              tabsetEvent.name,
                              [],
                              [],
                              tabsetEvent.spaces,
                            )
                            tabsetOrFolder.folders.push(newTabset)
                            await useTabsetsStore().saveTabset(rootTabset!)
                          }
                        }
                      } else {
                        // console.log('processing line II', line)
                        const newTabset = new Tabset(tabsetEvent.tabsetId, tabsetEvent.name, [], [], tabsetEvent.spaces)
                        await useTabsetsStore().addTabset(newTabset)
                      }
                      break
                    case 'deleted':
                      await useTabsetsStore().deleteTabset(tabsetEvent.tabsetId)
                      break
                    default:
                      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                      console.log(`unknown event ${tabsetEvent.event}`)
                  }
                  if (tabsetEvent.event === 'added') {
                  }
                }
                break
              case 'tab':
                if (parts[3] && parts[6]) {
                  const tabsetEvent = new TabEvent(
                    parts[2] as TabsetEventType,
                    parts[3],
                    parts[4],
                    parts[5]!,
                    parts[6],
                    parts[7],
                  )
                  const ts = useTabsetsStore().getTabset(tabsetEvent.tabsetId)
                  if (!ts) {
                    console.log('could not find tabset for id', tabsetEvent.tabsetId)
                    break
                  }
                  switch (tabsetEvent.event) {
                    case 'added':
                      const newTab = new Tab(
                        tabsetEvent.tabId!,
                        BrowserApi.createChromeTabObject(tabsetEvent.name, tabsetEvent.url!, tabsetEvent.favIconUrl),
                      )
                      ts.tabs.push(newTab)
                      await useTabsetsStore().saveTabset(ts)
                      break
                    case 'deleted':
                      const tabset = useTabsetsStore().getTabset(tabsetEvent.tabsetId)
                      const tab = useTabsetsStore().getTabAndTabsetId(tabsetEvent.tabId!)?.tab
                      if (tab && tabset) {
                        await useTabsetService().deleteTab(tab, tabset, true)
                      }
                      break
                    default:
                      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                      console.log(`unknown event '${tabsetEvent.event}'`)
                  }
                }
                break
              case 'space':
                if (parts[3]) {
                  const spaceEvent = new SpaceEvent(parts[2] as TabsetEventType, parts[3], undefined, parts[5]!)
                  if (spaceEvent.event === 'added') {
                    // useTabsetsStore().addTabset(new Tabset(tabsetEvent.tabsetId!, tabsetEvent.name, []))
                    const space = new Space(spaceEvent.spaceId, spaceEvent.name)
                    //console.log('space', space)
                    await useSpacesStore().addSpace(space)
                  }
                }
                break
              // case 'note':
              //   // console.log('processing line', line)
              //   if (parts[3]) {
              //     const decoded = atob(parts[5]!)
              //     //console.log('decoded', decoded)
              //     const noteEvent = new NoteEvent(parts[2] as TabsetEventType, parts[3], parts[4]!, JSON.parse(decoded))
              //     if (noteEvent.event === 'added') {
              //       //console.log('noteEvent', noteEvent)
              //       // const notebook = new Notebook(uid(), noteEvent.tabsetId, NotebookType.TABSET, noteEvent.name)
              //       // console.log('notebook', notebook)
              //       //await useNotesStore().saveNotebook(noteEvent.content as unknown as Notebook)
              //     }
              //   }
              //   break
              default:
                console.log(`unknown part '${parts[1]}' in '${line}'`)
            }
          } catch (err: any) {
            if (!firstErrorOccuredAt) {
              firstErrorOccuredAt = timestampLine - 1
            }
            console.warn('issue with sync: ', err)
          }
          lastSuccessOccuredAt = timestampLine
          index++
        }

        // const sha = existing['sha' as keyof object]
        // await this.githubPutContentRequest(githubPath, decodedContent + useData, sha)
        console.log(
          `sync finished with firstErrorOccuredAt ${firstErrorOccuredAt}, lastSuccessOccuredAt ${lastSuccessOccuredAt}`,
        )
        if (firstErrorOccuredAt) {
          LocalStorage.setItem(GITHUB_AUTO_SYNC_LASTUPDATE, firstErrorOccuredAt)
        } else if (lastSuccessOccuredAt) {
          LocalStorage.setItem(GITHUB_AUTO_SYNC_LASTUPDATE, lastSuccessOccuredAt)
        }
      }
      useUiStore().stopProgress()

      // const result = await this.githubPutContentRequest('logs/' + today, useData)
      // console.log('result', result)
      return Promise.resolve(new ExecutionResult('', 'done'))
    } catch (error) {
      return Promise.reject(error)
    }
  }
}

GithubReadEventsCommand.prototype.toString = function cmdToString() {
  return `GithubReadEventsCommand: {timestamp: ${this.lastUpdate}`
}
