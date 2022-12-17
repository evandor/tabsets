// export default interface Types {

import {Tab} from "src/models/Tab";

export type Programmer = {
  name: string;
  knownFor: string[];
};

// export type Predicate = {
//   tabPredicate: (t: Tab) => boolean;
// }

export type TabPredicate = (t: Tab) => boolean;

// add: (x: number, y: number) => number;
// }
