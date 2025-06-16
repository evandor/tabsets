// 2 expected diffs to localstorage

interface AiGateway {
  loadModule(): Promise<void>

  zeroShotClassification(text: string, candidates: string[]): Promise<object>
}

export default AiGateway
