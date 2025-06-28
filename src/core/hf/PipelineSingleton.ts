import { pipeline, env as wasmEnv } from '@huggingface/transformers'

// wasmEnv.localModelPath = '/path/to/models/'
wasmEnv.allowRemoteModels = false
wasmEnv.allowLocalModels = true
// @ts-expect-error xxx
wasmEnv.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('/www/wasm/')

class PipelineSingleton {
  //static task = 'text-classification'
  static task = 'text-classification' as const
  static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
  static instance = null

  static async getInstance(progress_callback = null) {
    console.log('getting instance AI')
    // @ts-expect-error xxx
    this.instance ??= pipeline(this.task, this.model, { progress_callback })
    return this.instance
  }
}

export const classification = async (text: string) => {
  console.log('classifying', text.substring(0, 30) + '...')
  // Get the pipeline instance. This will load and build the model when run for the first time.
  let model = await PipelineSingleton.getInstance() //as unknown as Pipeline
  //(data: any) => {
  // You can track the progress of the pipeline creation here.
  // e.g., you can send `data` back to the UI to indicate a progress bar
  //console.log('progress', data)
  //})
  console.log('got model', model)
  if (model) {
    //let result = await model(text)
    return 'result'
  }
  return null
}
