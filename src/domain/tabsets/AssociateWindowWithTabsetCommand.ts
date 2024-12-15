import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {STRIP_CHARS_IN_USER_INPUT} from "src/boot/constants";
import {useWindowsStore} from "src/windows/stores/windowsStore";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

export class AssociateWindowWithTabsetCommand implements Command<string> {

    public merge: boolean = true

    constructor(
        public tabsetId: string,
        public windowName: string ) {
    }

    async execute(): Promise<ExecutionResult<string>> {
        try {
            const trustedWindowName = this.windowName.replace(STRIP_CHARS_IN_USER_INPUT, '')
            const tabset = useTabsetsStore().getTabset(this.tabsetId)
            if (tabset) {
                tabset.window = trustedWindowName
                await useTabsetService().saveTabset(tabset)
                useWindowsStore().addToWindowSet(trustedWindowName)
                return Promise.resolve(new ExecutionResult<any>(tabset.id, "Window set to '"+trustedWindowName+"'"))
            } else {
                return Promise.reject("could not find tabset")
            }
        } catch (err) {
            return Promise.reject(err)
        }
    }
}

AssociateWindowWithTabsetCommand.prototype.toString = function cmdToString() {
    return `AssociateWindowWithTabsetCommand: {tabsetId=${this.tabsetId}, windowName=${this.windowName}}`;
};
