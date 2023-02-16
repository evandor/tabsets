import {formatDistance} from "date-fns";

export function useUtils() {

  const formatDate = (timestamp: number | undefined) =>
    timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

  const createDataTestIdentifier = (prefix: string, url: string) =>
    prefix + "_" + url.replace("https://", "").replaceAll('.','').replaceAll("/", "")

  const inBexMode = () => process.env.MODE === 'bex'
  const modeIs = (ident: string) => process.env.MODE === ident

  const normalize = (url: string):string => {
    try {
      new URL(url)
      return url
    } catch (err) {
      return "https://" + url
    }
  }

  return {
    formatDate,
    createDataTestIdentifier,
    inBexMode,
    normalize,
    modeIs
  }
}
