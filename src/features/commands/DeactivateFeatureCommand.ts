import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useLogger } from 'src/core/services/Logger'
import { useFeaturesStore } from '../stores/featuresStore'

const { info } = useLogger()

export class DeactivateFeatureCommand implements Command<any> {
  constructor(public featureIdentifier: string) {}

  async execute(): Promise<ExecutionResult<any>> {
    useFeaturesStore().deactivateFeature(this.featureIdentifier.toLowerCase())
    info('feature deactivated: ' + this.featureIdentifier)
    return Promise.resolve(
      new ExecutionResult('done', `Feature ${this.featureIdentifier.toLowerCase()} was deactivated`),
    )
  }
}

DeactivateFeatureCommand.prototype.toString = function cmdToString() {
  return `DeactivateFeatureCommand: {feature=${this.featureIdentifier}}`
}
