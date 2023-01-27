export enum DynamicTabSourceType {
  WIKIPEDIA = "WIKIPEDIA"
}


export class DynamicTabSource {


  constructor(public type: DynamicTabSourceType) {
  }
}
