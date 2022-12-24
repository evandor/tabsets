import {formatDistance} from "date-fns";

export function useUtils() {

  const formatDate = (timestamp: number | undefined) =>
    timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""



  return {
    formatDate
  }
}
