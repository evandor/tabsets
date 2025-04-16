const version = import.meta.env.PACKAGE_VERSION

async function log(msg: string, level: number) {
  const body = [
    {
      name: 'test.metric',
      interval: 10,
      value: 12.345,
      tags: ['foo=bar', 'source=grafanacloud-tabsets-prom'],
      time: new Date().getTime() * 1000000,
    },
    {
      name: 'test.metric',
      interval: 10,
      value: 12.245,
      tags: ['foo=baz', 'source=grafanacloud-tabsets-prom'],
      time: new Date().getTime() * 1000000,
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

  const data = await response.json()

  console.log(data)
}

export function useMetrics() {
  const gauge = (msg: string) => {
    log(msg, 5)
  }

  return {
    gauge,
  }
}
