import { useSettingsStore } from 'src/core/stores/settingsStore'

const version = import.meta.env.PACKAGE_VERSION

async function log(type: string, key: string, value: number) {
  const body = [
    {
      name: 'tabsets.metrics.count',
      interval: 10,
      value,
      tags: [`${type}=${key}`, 'source=extension', `version=${version}`],
      time: Math.round(new Date().getTime() / 1000),
    },
  ]

  const response = await fetch('https://graphite-prod-24-prod-eu-west-2.grafana.net/graphite/metrics', {
    method: 'post',
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${process.env.GRAFANA_METRICS_USER}:${process.env.GRAFANA_METRICS_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  await response.json()
}

export function useMetrics() {
  const gauge = (msg: string) => {
    // log(msg, 5)
  }

  const count = (key: string, value: number) => {
    //console.log('counting metrics', key, value)
    if (useSettingsStore().isDisabled('noMonitoring')) {
      log('count', key, value)
    }
  }

  return {
    gauge,
    count,
  }
}
