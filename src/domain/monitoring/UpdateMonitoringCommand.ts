import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {useUtils} from "src/services/Utils";
import {RestoreTabsetCommand} from "src/domain/tabsets/RestoreTabset";
import {Monitor, MonitoringType} from "src/models/Monitor";
import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";

const {sendMsg} = useUtils()


export class UpdateMonitoringCommand implements Command<any> {

    constructor(
        public tab: Tab,
        public monitoringType: MonitoringType) {
    }

    async execute(): Promise<ExecutionResult<string>> {
        const monitor = new Monitor(this.monitoringType)
        // const tabAndTabsetId = await useTabsStore().getTab(this.tabsetId)
        // if (tabAndTabsetId) {
            return TabsetService.setMonitoring(this.tab, monitor)
                .then(res => {
                    //sendMsg('tabset-renamed', {tabsetId: this.tabsetId, newName: this.newName, newColor: this.newColor})
                    return res
                })
                .then((oldValues: any) => Promise.resolve(
                    new ExecutionResult(
                        oldValues.oldName,
                        "Started Monitoring"))
                )
                .catch(err => Promise.reject(err))
        //}
        //return Promise.reject("no tab found")


    }

}

UpdateMonitoringCommand.prototype.toString = function cmdToString() {
    return `UpdateMonitoringCommand: {tabsetId=${this.tabsetId}, monitoringType=${this.monitoringType}}`;
};
