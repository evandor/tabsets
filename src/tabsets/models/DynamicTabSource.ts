export enum DynamicTabSourceType {
  WIKIPEDIA = 'WIKIPEDIA',
  TAG = 'TAG',
  CLASSIFICATION = 'CLASSIFICATION',
}

export class DynamicTabSource {
  constructor(
    public type: DynamicTabSourceType,
    public config: object = {},
  ) {}
}
