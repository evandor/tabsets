import { useUiStore } from 'src/ui/stores/uiStore'

let session: any

export function useCategorizationService() {
  const initializeLanguageModel = () => {
    console.log('initializeLanguageModel')
    try {
      // @ts-expect-error xxx
      LanguageModel.create({
        monitor(m: any) {
          m.addEventListener('downloadprogress', (e: any) => {
            useUiStore().setProgress(e.loaded, 'downloading AI', true)
            console.log(`Downloaded: ${e.loaded * 100}%`)
            if (e.loaded >= 1) {
              useUiStore().stopProgress()
            }
          })
        },
        // output_language: ['en'],
        initialPrompts: [
          {
            role: 'system',
            content:
              'Your purpose is to categorize text, using only the following categories: food, travel, leisure, news, unknown. The user will give you texts as input for you to categorize. Please provide a score for your decision as well',
          },
        ],
      }).then((s: any) => {
        console.log('=== setting session ===', s)
        session = s
      })
    } catch (err) {
      console.log('categorization service error', err)
    }
  }

  const categorize = async (text: string) => {
    // // @ts-expect-error xxx
    // const params = await LanguageModel.params()
    // console.log('params', params)
    if (!session) {
      console.log('no session!!!')
      return
    }
    console.log('=======================')
    console.log(text)
    console.log('=======================')
    return await session.prompt(text)
  }

  return {
    initializeLanguageModel,
    categorize,
  }
}
