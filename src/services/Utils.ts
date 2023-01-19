import {formatDistance} from "date-fns";

export function useUtils() {

  const formatDate = (timestamp: number | undefined) =>
    timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

  const createDataTestIdentifier = (prefix: string, url: string) =>
    prefix + "_" + url.replace("https://", "").replaceAll('.','').replaceAll("/", "")

  const inBexMode = () => process.env.MODE === 'bex'

  return {
    formatDate,
    createDataTestIdentifier,
    inBexMode
  }
}
