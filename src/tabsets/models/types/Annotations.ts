// e.g. "2,8,0,5,7,1,5,1,4,2,1;144;2,8,0,5,7,1,5,1,4,2,1;156"
declare const rangeKey: unique symbol
type RangeDefinition = string & { readonly [rangeKey]: 'range' }

export function toRangeDefinition(value: string): RangeDefinition {
  const split = value.split(';')
  if (split.length != 4) {
    throw new Error('Invalid range format')
  }

  return value as RangeDefinition
}
export type Annotation = {
  text: string
  range: RangeDefinition
  color: 'yellow' | 'green' | 'blue'
  remark: string
  timestamp: number
}
