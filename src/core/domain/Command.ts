import { ExecutionResult } from 'src/core/domain/ExecutionResult'

export default interface Command<T> {
  execute: () => Promise<ExecutionResult<T>>
}
