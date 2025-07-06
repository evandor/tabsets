// import _ from 'lodash'
// import Command from 'src/core/domain/Command'
// import { ExecutionResult } from 'src/core/domain/ExecutionResult'
// import { DeleteTabsetCommand } from 'src/tabsets/commands/DeleteTabsetCommand'
// import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
// import { useTabsetService } from 'src/tabsets/services/TabsetService2'
// import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
//
// class UndoCreateTabsetCommand implements Command<object> {
//   constructor(public tabsetId: string) {}
//
//   execute(): Promise<ExecutionResult<object>> {
//     return new DeleteTabsetCommand(this.tabsetId)
//       .execute()
//       .then((res) => Promise.resolve(new ExecutionResult(res, 'Tabset was deleted again')))
//   }
// }
//
// export class CreateDynamicTabset implements Command<object> {
//   public merge: boolean = true
//
//   constructor(
//     public tabsetName: string,
//     public sourceType: DynamicTabSourceType = DynamicTabSourceType.TAG,
//   ) {}
//
//   async execute(): Promise<ExecutionResult<object>> {
//     try {
//       // test existence
//       const existingTabsets = _.find([...useTabsetsStore().tabsets.values()], (ts: Tabset) => {
//         if (
//           ts.dynamicTabs &&
//           ts.dynamicTabs &&
//           ts.dynamicTabs.config &&
//           ts.dynamicTabs.type === DynamicTabSourceType.TAG
//         ) {
//           const tags = ts.dynamicTabs.config['tags' as keyof object] as Array<string>
//           console.log('tags', tags)
//           if (tags.indexOf(this.tabsetName) >= 0) {
//             return true
//           }
//         }
//         return false
//       })
//       if (existingTabsets) {
//         return Promise.reject("Dynamic tag for '" + this.tabsetName + "' exists already")
//       }
//
//       const result: NewOrReplacedTabset = await useTabsetsStore().updateOrCreateTabset(
//         'Tag: ' + this.tabsetName,
//         [],
//         false,
//         'current',
//         TabsetType.DYNAMIC,
//       )
//       if (result && result.tabset) {
//         if (this.sourceType === DynamicTabSourceType.TAG) {
//           result.tabset.dynamicTabs = new DynamicTabSource(this.sourceType, { tags: [this.tabsetName] })
//         } else {
//           result.tabset.dynamicTabs = new DynamicTabSource(this.sourceType)
//         }
//         //result.tabset.type = TabsetType.DYNAMIC
//         console.log('tabset', result.tabset)
//         await useTabsetService().saveTabset(result.tabset)
//       }
//
//       const executionResult = new ExecutionResult(
//         result,
//         'Dynamic Tabset was created',
//         new UndoCreateTabsetCommand(result['tabsetId' as keyof object]),
//       )
//       return Promise.resolve(executionResult)
//     } catch (err) {
//       return Promise.reject(err)
//     }
//   }
// }
//
// CreateDynamicTabset.prototype.toString = function cmdToString() {
//   return `CreateDynamicTabsetCommand: {merge=${this.merge}, tabsetName=${this.tabsetName}}`
// }
