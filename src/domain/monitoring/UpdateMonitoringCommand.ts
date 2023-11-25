import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {Monitor, MonitoringType} from "src/models/Monitor";
import {Tab} from "src/models/Tab";

export class UpdateMonitoringCommand implements Command<any> {

    constructor(
        public tab: Tab,
        public monitoringType: MonitoringType,
        public data: object = {}
        ) {
    }

    async execute(): Promise<ExecutionResult<string>> {
        const monitor = new Monitor(this.monitoringType, this.data)
        if (this.monitoringType === MonitoringType.NONE) {
            // clear blobs if any

        }
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


    }

}

UpdateMonitoringCommand.prototype.toString = function cmdToString() {
    return `UpdateMonitoringCommand: {tab.id=${this.tab.id}, monitoringType=${this.monitoringType}, data=${this.data}}`;
};
