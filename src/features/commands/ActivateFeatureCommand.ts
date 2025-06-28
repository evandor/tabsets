import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useLogger } from 'src/core/services/Logger'

const { info } = useLogger()

export class ActivateFeatureCommand implements Command<any> {
  constructor(public featureIdentifier: string) {}

  async execute(): Promise<ExecutionResult<any>> {
    useFeaturesStore().activateFeature(this.featureIdentifier.toLowerCase())
    info('feature activated: ' + this.featureIdentifier)
    return Promise.resolve(new ExecutionResult('done', `Feature ${this.featureIdentifier.toLowerCase()} was activated`))
  }
}

ActivateFeatureCommand.prototype.toString = function cmdToString() {
  return `ActivateFeatureCommand: {feature=${this.featureIdentifier}}`
}
