import { uid } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { RestParam, RestTab } from 'src/rest/models/RestTab'
import { RestApi, RestApiIdent } from 'src/rest/RestApi'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import { SaveOrReplaceResult } from 'src/tabsets/models/SaveOrReplaceResult'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class RestApiDefinitions {
  private static obsidianTabsetFetch: () => Promise<Tabset> = async () => {
    const res = await fetch('http://127.0.0.1:27123/vault/', {
      headers: { Authorization: 'Bearer bd6fc2c6598ef3bbf8501b9d295367f73994cd037516f53e645f94d6557937be' },
    })

    console.log('res', res)
    const json = await res.json()
    console.log('json', json)
    // const data = JSON.parse(json)
    // console.log('data', data)
    const files = json['files' as keyof object] as string[]
    const folders: Tabset[] = []
    const useTabs: chrome.tabs.Tab[] = files
      .map((f: string) => {
        if (!f.endsWith('/')) {
          return BrowserApi.createChromeTabObject(f, 'ts-obsidian://' + f)
        } else {
          folders.push(new Tabset(uid(), f, []))
          return null
        }
      })
      .filter((e) => e != null)

    const executionResult: ExecutionResult<SaveOrReplaceResult> = await useCommandExecutor().executeFromUi(
      new CreateTabsetCommand('Obsidian', useTabs),
    )
    const tabset = executionResult.result.tabset
    tabset.type = TabsetType.REST
    tabset.restDefinition = 'OBSIDIAN'
    return Promise.resolve(tabset)
  }

  private static websiteCatTabsetFetch: (context: { browserTab?: chrome.tabs.Tab }) => Promise<Tabset> =
    async (context: { browserTab?: chrome.tabs.Tab }): Promise<Tabset> => {
      try {
        const res = await fetch(
          'https://website-categorization-api-now-with-ai.p.rapidapi.com/website-categorization/heise.de',
          {
            headers: {
              'x-rapidapi-key': 'a5a5f0a978mshbe5240fb915e8f6p117f54jsn88b440fb1ec1',
              'x-rapidapi-host': 'website-categorization-api-now-with-ai.p.rapidapi.com',
            },
          },
        )

        console.log('res', res)
        const json = await res.json()
        console.log('json', json)
        const executionResult: ExecutionResult<SaveOrReplaceResult> = await useCommandExecutor().executeFromUi(
          new CreateTabsetCommand('RapidAPI'),
        )
        const tabset = executionResult.result.tabset
        tabset.type = TabsetType.REST
        tabset.restDefinition = 'OBSIDIAN'
        const tab = new RestTab(uid(), 'Rest API Call', 'http://www.test.de', 'RAPID_API_WEBSITE_CATEGORIZATION', [
          { name: 'domain', type: 'TEXT', val: '' },
        ])
        tab.description = context.browserTab!.url || 'unkonwn'
        tabset.tabs.push(tab)
        await useTabsetsStore().saveTabset(tabset)
        return Promise.resolve(tabset)
      } catch (err) {
        console.warn('got error', err)
      }

      return Promise.reject('to be done')
    }

  static restApis: RestApi[] = [
    new RestApi('OBSIDIAN', RestApiDefinitions.obsidianTabsetFetch, (params: RestParam[]) => {}),
    new RestApi(
      'RAPID_API_WEBSITE_CATEGORIZATION',
      RestApiDefinitions.websiteCatTabsetFetch,
      async (params: RestParam[]) => {
        const url = 'https://website-categorization-api-now-with-ai.p.rapidapi.com/website-categorization/' // + params[0].val
        const res = await fetch(url, {
          headers: {
            'x-rapidapi-key': 'a5a5f0a978mshbe5240fb915e8f6p117f54jsn88b440fb1ec1',
            'x-rapidapi-host': 'website-categorization-api-now-with-ai.p.rapidapi.com',
          },
        })

        console.log('res', res)
        const json = await res.json()
        console.log('json', json)
        return json
      },
    ),
  ]

  static getApi(ident: RestApiIdent): RestApi | undefined {
    const found = RestApiDefinitions.restApis.filter((api: RestApi) => api.ident === ident)
    if (found && found.length > 0) {
      return found[0]
    }
    return undefined
  }
  //
  // getFeatures(): Feature[] {
  //   return this.features
  // }
}
