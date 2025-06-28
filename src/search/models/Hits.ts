import { Hit } from 'src/search/models/Hit'

export class Hits {
  constructor(
    public hits: Hit[],
    public moreHits: boolean,
  ) {}
}
