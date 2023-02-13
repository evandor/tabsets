import {formatDistance} from "date-fns";
//import normalizeUrl from 'normalize-url';

export function useUtils() {

  const formatDate = (timestamp: number | undefined) =>
    timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

  const createDataTestIdentifier = (prefix: string, url: string) =>
    prefix + "_" + url.replace("https://", "").replaceAll('.','').replaceAll("/", "")

  const inBexMode = () => process.env.MODE === 'bex'
  const modeIs = (ident: string) => process.env.MODE === ident

  const normalize = (url: string):string => {
    // if (url.startsWith("http://")) {
    //   return normalizeUrl(url);
    // } else {
    //   return normalizeUrl(url, {forceHttps: true});
    // }
    return url;
  }

  return {
    formatDate,
    createDataTestIdentifier,
    inBexMode,
    normalize,
    modeIs
  }
}
