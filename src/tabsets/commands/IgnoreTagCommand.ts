import { TAGS_IGNORED } from 'boot/constants'
import { LocalStorage } from 'quasar'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'

/**
 */
export class IgnoreTagCommand implements Command<string> {
  constructor(public tag: string) {}

  async execute(): Promise<ExecutionResult<string>> {
    const ignoredTags: string[] = LocalStorage.getItem(TAGS_IGNORED) || []
    ignoredTags.push(this.tag)
    LocalStorage.setItem(TAGS_IGNORED, ignoredTags)
    return new ExecutionResult<string>('done', 'This tag will not be suggested in future')
  }
}

IgnoreTagCommand.prototype.toString = function cmdToString() {
  return `IgnoreTagCommand: {tag=${this.tag}}`
}
