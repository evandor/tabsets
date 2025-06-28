import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'

export class DownloadAIModelsCommand implements Command<boolean> {
  constructor() {}

  async execute(): Promise<ExecutionResult<boolean>> {
    console.log('about to send msg init-ai-module')
    chrome.runtime.sendMessage({ name: 'init-ai-module' }, (callback: any) => {
      if (chrome.runtime.lastError) {
        console.warn('got error', chrome.runtime.lastError)
      } else {
        console.log('callback: ', callback)
      }
    })

    if (!('LanguageDetector' in self)) {
      console.log('no language detector available')
      return Promise.reject('LanguageDetector not available')
    }
    try {
      await this.downloadLanguageDetector()
    } catch (e: any) {
      console.log('problem using language detector', e)
      return Promise.reject('problem using language detector' + e)
    }
    try {
      return await this.downloadSummarizer()
    } catch (e: any) {
      console.log('problem using language detector', e)
      return Promise.reject('problem using language detector' + e)
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
      // detector = await LanguageDetector.create()
      // const someUserText = 'Hallo und herzlich willkommen!'
      // const results = await detector.detect(someUserText)
      // for (const result of results) {
      //   // Show the full list of potential languages with their likelihood, ranked
      //   // from most likely to least likely. In practice, one would pick the top
      //   // language(s) that cross a high enough threshold.
      //   console.log(result.detectedLanguage, result.confidence)
      // }
      return Promise.resolve(new ExecutionResult(true))
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
