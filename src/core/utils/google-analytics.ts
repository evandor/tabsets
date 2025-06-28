import { useUtils } from 'src/core/services/Utils'

// see https://developer.chrome.com/docs/extensions/how-to/integrate/google-analytics-4

const { inBexMode } = useUtils()

const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect'
const GA_DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect'

// Get via https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag#recommended_parameters_for_reports
// !== MIT
const MEASUREMENT_ID = 'G-XBYXVZ86J1'
const API_SECRET = '1N_ivSMnT2GHqZMcoXJDTw'
const DEFAULT_ENGAGEMENT_TIME_MSEC = 100

// Duration of inactivity after which a new session is created
const SESSION_EXPIRATION_IN_MIN = 30

class Analytics {
  private readonly debug: boolean

  constructor(debug = false) {
    this.debug = debug
  }

  // Returns the client id, or creates a new one if one doesn't exist.
  // Stores client id in local storage to keep the same client id as long as
  // the extension is installed.
  async getOrCreateClientId() {
    if (!chrome || !inBexMode()) {
      return Promise.reject('not creating client id')
    }
    let { clientId } = await chrome.storage.local.get('clientId')
    if (!clientId) {
      // Generate a unique client ID, the actual value is not relevant
      clientId = self.crypto.randomUUID()
      await chrome.storage.local.set({ clientId })
    }
    return clientId
  }

  // Returns the current session id, or creates a new one if one doesn't exist or
  // the previous one has expired.
  async getOrCreateSessionId() {
    if (!chrome || !inBexMode()) {
      return Promise.reject('not creating session id')
    }
    // Use storage.session because it is only in memory
    let { sessionData } = await chrome.storage.session.get('sessionData')
    const currentTimeInMs = Date.now()
    // Check if session exists and is still valid
    if (sessionData && sessionData.timestamp) {
      // Calculate how long ago the session was last updated
      const durationInMin = (currentTimeInMs - sessionData.timestamp) / 60000
      // Check if last update lays past the session expiration threshold
      if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
        // Clear old session id to start a new session
        sessionData = null
      } else {
        // Update timestamp to keep session alive
        sessionData.timestamp = currentTimeInMs
        await chrome.storage.session.set({ sessionData })
      }
    }
    if (!sessionData) {
      // Create and store a new session
      sessionData = {
        session_id: currentTimeInMs.toString(),
        timestamp: currentTimeInMs.toString(),
      }
      await chrome.storage.session.set({ sessionData })
    }
    return sessionData.session_id
  }

  // Fires an event with optional params. Event names must only include letters and underscores.
  async fireEvent(name: string, params: any = {}) {
    if (process.env.DEV) {
      console.log('not firing event (dev environment)', name, params)
      return
    }

    // Configure session id and engagement time if not present, for more details see:
    // https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag#recommended_parameters_for_reports
    if (!params.session_id) {
      try {
        params.session_id = await this.getOrCreateSessionId()
      } catch (e) {
        // ignore
        return Promise.resolve(e)
      }
    }
    if (!params.engagement_time_msec) {
      params.engagement_time_msec = DEFAULT_ENGAGEMENT_TIME_MSEC
    }

    try {
      const response = await fetch(
        `${this.debug ? GA_DEBUG_ENDPOINT : GA_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
        {
          method: 'POST',
          body: JSON.stringify({
            client_id: await this.getOrCreateClientId(),
            events: [
              {
                name,
                params,
              },
            ],
            // user_location: {
            //   // city: 'Mountain View',
            //   // region_id: 'US-CA',
            //   country_id: 'DE',
            //   // subcontinent_id: '021',
            //   // continent_id: '019',
            // },
          }),
        },
      )
      if (!this.debug) {
        return
      }
      console.log(await response.text())
    } catch (e) {
      console.error('Google Analytics request failed with an exception', e)
    }
  }

  // Fire a page view event.
  async firePageViewEvent(pageTitle: string, pageLocation: string, additionalParams = {}) {
    if (process.env.DEV) {
      console.log('not firing page view event (dev environment)', pageTitle, pageLocation, additionalParams)
      return
    }
    const location = pageLocation.indexOf('#') >= 0 ? pageLocation.split('#')[1] : pageLocation
    return this.fireEvent('page_view', {
      page_title: pageTitle,
      page_location: location,
      ...additionalParams,
    })
  }

  // Fire an error event.
  async fireErrorEvent(error: any, additionalParams = {}) {
    if (process.env.DEV) {
      console.log('not firing error view event (dev environment)', error, additionalParams)
      return
    }
    // Note: 'error' is a reserved event name and cannot be used
    // see https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference?client_type=gtag#reserved_names
    return this.fireEvent('extension_error', {
      ...error,
      ...additionalParams,
    })
  }
}

// export default new Analytics(process.env.TABSETS_STAGE === 'DEV')
export default new Analytics()
