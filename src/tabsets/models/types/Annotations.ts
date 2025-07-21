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

declare const rgbKey: unique symbol
type RGBDefinition = string & { readonly [rgbKey]: 'rgb' }

export function toRGBDefinition(value: string): RGBDefinition {
  if (value.length != 7 || !value.startsWith('#')) {
    throw new Error('Invalid RGB format')
  }
  return value as RGBDefinition
}

export type Annotation = {
  text: string
  range: RangeDefinition
  color: RGBDefinition
  remark: string
  timestamp: number
}
