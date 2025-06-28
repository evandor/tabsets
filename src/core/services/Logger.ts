import { getLokiLogger } from '@miketako3/cloki'
import { LocalStorage, Platform } from 'quasar'
import { EXTENSION_NAME } from 'src/boot/constants'
import { useErrorHandlingConfig } from 'src/core/config/errorHandlingConfig'
import { useSettingsStore } from 'src/core/stores/settingsStore'

const version = import.meta.env?.PACKAGE_VERSION || '0.0.0'

const { setupErrorHandling } = useErrorHandlingConfig()

var scope = setupErrorHandling()

const postLogsToLoki = async (message: string, labels: object) => {
  const lokiURL = 'https://logs-prod-012.grafana.net/loki/api/v1/push'
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Authorization: `Basic ${btoa(`${process.env.GRAFANA_LOKI_USER as string}:${process.env.GRAFANA_LOKI_TOKEN as string}`)}`,
  }

  const logData = {
    streams: [
      {
        stream: Object.assign({ level: 'info' }, labels),
        values: [[`${Date.now().toString()}000000`, JSON.stringify(message)]],
      },
    ],
  }

  try {
    fetch(lokiURL, { method: 'POST', headers, body: JSON.stringify(logData) }).catch((response) => {
      console.error('loki error:', response)
    })
  } catch (error) {
    console.error('Error posting logs to Loki:', error)
  }
}

async function log(msg: string, level: number) {
  if (useSettingsStore().isEnabled('noMonitoring')) {
    return
  }
  const logger = getLokiLogger({
    lokiHost: 'logs-prod-012.grafana.net',
    lokiUser: process.env.GRAFANA_LOKI_USER as string,
    lokiToken: process.env.GRAFANA_LOKI_TOKEN as string,
  })

  const platform = LocalStorage.getItem('platform') as Platform | undefined

  if (level === 3) {
    await logger.error(
      { message: msg },
      {
        _mode: process.env.MODE || 'unknown',
        _version: version,
        _stage: process.env.TABSETS_STAGE || 'unknown',
        _platform: platform ? platform.is['name'] : 'unknown',
        service_name: EXTENSION_NAME,
      },
    )
  } else {
    postLogsToLoki(msg, {
      _mode: process.env.MODE || 'unknown',
      _version: version,
      _stage: process.env.TABSETS_STAGE || 'unknown',
      _platform: platform ? platform.is['name'] : 'unknown',
      service_name: EXTENSION_NAME,
    })
  }
}

export function useLogger() {
  const info = (msg: string) => {
    if (process.env.MODE === 'bex') {
      log(msg, 5) // do not log for pwa, there's faro-collector for that
    }
  }

  const error = (msg: string) => {
    console.log('sending message to sentry...', scope)
    scope.captureMessage(msg)
    log(msg, 3)
  }

  return {
    info,
    error,
  }
}
