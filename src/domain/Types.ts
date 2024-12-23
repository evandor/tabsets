import { Tab } from 'src/tabsets/models/Tab'

export type TabPredicate = (t: Tab) => boolean
export type Predicate<T> = (t: T) => boolean
