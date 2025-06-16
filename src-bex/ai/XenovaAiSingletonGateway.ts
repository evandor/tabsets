import AiGateway from 'app/src-bex/ai/AiGateway'

class XenovaAiSingletonGateway implements AiGateway {
  modelPromise: any = null

  async loadModule(): Promise<void> {}

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

export default new XenovaAiSingletonGateway()
