import { useCategorizationService } from 'src/categorization/CategorizationService'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useNotificationHandler } from 'src/core/services/ErrorHandler'

const { handleSuccess } = useNotificationHandler()

export class DownloadAIModelsCommand implements Command<boolean> {
  constructor() {}

  async execute(): Promise<ExecutionResult<boolean>> {
    // console.log('about to send msg init-ai-module')
    // chrome.runtime.sendMessage({ name: 'init-ai-module' }, (callback: any) => {
    //   if (chrome.runtime.lastError) {
    //     console.warn('got error', chrome.runtime.lastError)
    //   } else {
    //     console.log('callback: ', callback)
    //   }
    // })

    console.log("checking availability of 'LanguageDetector' feature...")
    if (!('LanguageDetector' in self)) {
      console.log('no language detector available')
      return Promise.reject('LanguageDetector not available')
    }
    try {
      await this.downloadLanguageDetector()
      console.log('Language detector downloaded')
      handleSuccess(new ExecutionResult('', 'AI Language Detector available now'))
    } catch (e: any) {
      console.log('problem using language detector', e)
      return Promise.reject('problem using language detector' + e)
    }

    console.log("checking availability of 'Summarizer' feature...")
    try {
      await this.downloadSummarizer()
      console.log('Summarizer detector downloaded')
    } catch (e: any) {
      console.log('problem using summarizer detector', e)
      return Promise.reject('problem using summarizer' + e)
    }

    console.log("checking availability of 'LanguageModel' feature...")
    try {
      // await this.downloadSummarizer()
      // console.log('Summarizer LanguageModel downloaded')

      // @ts-expect-error xxx
      const session = await LanguageModel.create({
        monitor(m: any) {
          m.addEventListener('downloadprogress', (e: any) => {
            console.log(`Downloaded: ${e.loaded * 100}%`)
          })
        },
        initialPrompts: [
          {
            role: 'system',
            content:
              'Your purpose is to categorize text, using the following categories: food, travel, leisure, news. The user will give you texts as input for you to categorize.',
          },
        ],
      })
      // @ts-expect-error xxx
      const params = await LanguageModel.params()
      console.log('params', params)

      const result1 = await session.prompt(
        'Paprika-Reis-Pfanne mit Joghurtsauce. Über 1328 Bewertungen und für mega befunden. Mit ► Portionsrechner ► Kochbuch ► Video-Tipps! Jetzt entdecken und ausprobieren!',
      )
      console.log(result1)

      // const result2 = await session.prompt('That sounds great, but oh no, it is actually going to rain! New advice?')
      // console.log(result2)

      chrome.storage.local.set({ 'tabsets.ext.ai.active': true }).then(() => {
        useCategorizationService().initializeLanguageModel()
      })

      return Promise.resolve(new ExecutionResult(true, 'done'))
    } catch (e: any) {
      console.log('problem using language model', e)
      return Promise.reject('problem using language model' + e)
    }
  }

  private async downloadSummarizer() {
    const options = {
      sharedContext: 'This is a scientific article',
      type: 'key-points',
      format: 'markdown',
      length: 'medium',
    }

    // @ts-expect-error xxx
    const availability = await Summarizer.availability()
    let summarizer
    if (availability === 'unavailable') {
      return Promise.reject('Summarizer unavailable')
    }
    if (availability === 'available') {
      // @ts-expect-error xxx
      summarizer = await Summarizer.create(options)
    } else {
      // @ts-expect-error xxx
      summarizer = await Summarizer.create(options)
      summarizer.addEventListener('downloadprogress', (e: any) => {
        console.log(`Downloaded ${e.loaded * 100}%`)
      })
      await summarizer.ready
    }
    return Promise.resolve(new ExecutionResult(true, 'done'))
  }

  private async downloadLanguageDetector() {
    // @ts-expect-error xxx
    const availability = await LanguageDetector.availability()
    console.log('availability', availability)
    let detector
    if (availability === 'unavailable') {
      // The language detector isn't usable.
      console.log('no language detector unavailable')
      return Promise.reject('LanguageDetector unavailable')
    }
    if (availability === 'available') {
      // The language detector can immediately be used.
      // @ts-expect-error xxx
      detector = await LanguageDetector.create()
      const someUserText = 'Hallo und herzlich willkommen!'
      const results = await detector.detect(someUserText)
      for (const result of results) {
        // Show the full list of potential languages with their likelihood, ranked
        // from most likely to least likely. In practice, one would pick the top
        // language(s) that cross a high enough threshold.
        console.log(result.detectedLanguage, result.confidence)
      }
      return Promise.resolve(new ExecutionResult(true, 'done'))
    } else {
      // The language detector can be used after model download.
      // @ts-expect-error xxx
      detector = await LanguageDetector.create({
        monitor(m: any) {
          m.addEventListener('downloadprogress', (e: any) => {
            console.log(`Downloaded ${e.loaded * 100}%`)
          })
        },
      })
      await detector.ready
      return Promise.resolve(new ExecutionResult(true, 'done'))
    }
  }
}

DownloadAIModelsCommand.prototype.toString = function cmdToString() {
  return `DownloadAIModelsCommand`
}
