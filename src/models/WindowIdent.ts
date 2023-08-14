
export class WindowIdent {
    created: number

    constructor(public id: string, public label: string) {
        this.created = new Date().getTime()
    }

}
