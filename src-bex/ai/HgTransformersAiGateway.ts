import { env as henv, pipeline } from '@huggingface/transformers'
import AiGateway from 'app/src-bex/ai/AiGateway'

class XenovaAiGateway implements AiGateway {
  modelPromise: any = null

  async loadModule(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { pipeline, env } = require('@huggingface/transformers')

    await this.setupOnnxRuntime()

    console.log('initializing transformers....')

    henv.useBrowserCache = true
    //henv.remoteModels = true //false;
    //env.localModelPath = chrome.runtime.getURL('models/')
    henv.backends.onnx.wasm!.wasmPaths = chrome.runtime.getURL('www/wasm/')
    henv.backends.onnx.wasm!.numThreads = 1

    // const task = 'text-classification';
    //const model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    const task = 'zero-shot-classification'
    const model = 'Xenova/bart-large-mnli'
    //const model = 'Xenova/finbert';

    try {
      let start = 0
      console.log('hier', this.modelPromise)
      this.modelPromise ??= pipeline(task, model, {
        progress_callback: (data: any) => {
          if (data.status !== 'progress') {
            console.log('got progress_callback', data)
          }

          // if (data.progress < start + 5) {
          //   return
          // }
          start = data.progress

          const msg = {
            name: 'progress-indicator',
            percent: data.progress / 100,
            status: data.status,
            label: 'AI Module ' + data.name,
          }

          //console.log('msg', msg)
          //    useUiStore().setProgress(data.progress / 100, `AI Model... ${data.progress}%`)
          //chrome.runtime.sendMessage(msg)
          chrome.runtime.sendMessage(msg, (callback) => {
            if (chrome.runtime.lastError) {
              /* ignore */
              // TODO we get tons of errors here
              //console.log('runtime error encountered', chrome.runtime.lastError)
            } else {
              //console.log("cb", callback)
            }
          })
        },
      })
    } catch (err) {
      console.error('hier: error', JSON.stringify(err))
    }
  }

  private async setupOnnxRuntime() {
    try {
      // Dynamically import onnxruntime-web
      await import('onnxruntime-web')

      // Configure the ONNX backend
      henv.backends = {
        ...henv.backends,
        onnx: {
          wasm: {
            proxy: true,
          },
        },
      }

      console.log('ONNX Runtime initialized successfully')
      return true
    } catch (error) {
      console.error('Failed to initialize ONNX Runtime:', error)
      return false
    }
  }

  async zeroShotClassification(text: string, candidates: string[]): Promise<object> {
    console.log('got zero-shot-classification message', text, candidates)

    await this.loadModule()
    let model = await this.modelPromise //await modelPromise
    console.log('model', model)
    let result = await model(text, candidates)
    console.log('result:', result)
    return result
  }
}

export default new XenovaAiGateway()
