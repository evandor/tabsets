import mqtt, {MqttClient} from "mqtt";
import {LocalStorage, uid, useQuasar} from "quasar";
import {Tab, TabComment} from "src/models/Tab";
import {useAppStore} from "stores/appStore";
import {Message} from "src/models/Message";
import {useMessagesStore} from "stores/messagesStore";
import {useTabsStore} from "stores/tabsStore";
import {Tabset, TabsetSharing} from "src/models/Tabset";
import _ from "lodash"
import {useTabsetService} from "src/services/TabsetService2";
import {useUiStore} from "stores/uiStore";

class MqttPayload {

  public id: string;
  public tabId: string;
  public installationId: string;

  constructor(
    public event: string,
    tab: Tab,
    public comment: TabComment | undefined = undefined
  ) {
    this.id = uid()
    this.tabId = tab.id
    this.installationId = useAppStore().getInstallationId()
  }
}

class MqttService {

  private client: MqttClient | undefined = undefined

  private publisher: number = 0
  private closedCounter: number = 0
  private alreadyInitialized = false

  init(mqttUrl: string | undefined = undefined) {
    if (this.alreadyInitialized) {
      console.log("Mqtt: already initialized")
      return
    }
    if (!mqttUrl) {
      console.log("Mqtt: no Mqtt Url")
      return
    }
    this.alreadyInitialized = true
    useUiStore().mqttOffline = true
    console.log("Mqtt: Starting  client...", mqttUrl)
    const author = LocalStorage.getItem("sharing.author") || 'default-author'
    const installation = LocalStorage.getItem("sharing.installation") || 'default-installation'
    const opts = {clientId: 'ts-' + installation}
    //this.client =  mqtt.connectAsync("mqtt://test.mosquitto.org")
    //this.client = mqtt.connect("mqtts://public:public@public.cloud.shiftr.io:443", opts)
    //this.client = mqtt.connect("mqtts://tabsets:3dAkqY8glIIecUBs@tabsets.cloud.shiftr.io:443", opts)
    //this.client = mqtt.connect("mqtts://tabsets-dev:6b1CjPBf502SO6Kx@tabsets-dev.cloud.shiftr.io:443", opts)
    //this.client = mqtt.connect("mqtts://tabsets-test:YtHueGI9AO2Wns7P@tabsets-test.cloud.shiftr.io:443", opts)
    //this.client = mqtt.connect("mqtts://tabsets-prd:EqgBLL7SwABHk13W@tabsets-prd.cloud.shiftr.io:443", opts)
    //this.client = mqtt.connect("mqtts://gpgpaxfd:zH8P4i6hZee4SVCqK_uS6KRcuTnPeRu7@sparrow.rmq.cloudamqp.com:8883", opts)
    //this.client = mqtt.connect("mqtts://demo.flashmq.org", opts)

    // @ts-ignore
    this.client = mqtt.connect(mqttUrl, opts)


    const ctx = this
    this.client?.on('connect', function () {
      console.log('Mqtt: connected!');
      useUiStore().mqttOffline = false
    });

    this.client?.on('reconnect', function () {
      console.log('Mqtt: reconnected!');
    })

    this.client?.on('close', function () {
      console.log('Mqtt: closed!');
      useUiStore().mqttOffline = true
      ctx.closedCounter = ctx.closedCounter + 1
      if (ctx.closedCounter > 5) {
        console.log("Mqtt: Mqtt: closing connection due to 10 close events")
        useUiStore().mqttOffline = true
        ctx.client?.end()
      }
    })

    this.client?.on('disconnect', function () {
      console.log('Mqtt: disconnected!');
      useUiStore().mqttOffline = true
    })

    this.client?.on('offline', function () {
      console.log('Mqtt: offline!');
      useUiStore().mqttOffline = true
    })

    this.client?.on('error', function () {
      console.log('Mqtt: error!');
    })

    this.client?.on('end', function () {
      console.log('Mqtt: ended!');
      useUiStore().mqttOffline = true
    })

    // this.client?.on('packetsend', function () {
    //   console.log('Mqtt: packetsend!');
    // })
    //
    // this.client?.on('packetreceive', function () {
    //   console.log('Mqtt: packetreceive!');
    // })

    this.client?.on('message', function (topic, message) {
      const payload: MqttPayload = JSON.parse(message.toString())
      if (payload.installationId === useAppStore().getInstallationId()) {
        console.log("Mqtt: Mqtt: not for me...")
        return
      }
      switch (payload.event) {
        case 'tabComment':
          console.log("Mqtt: got tabComment message for topic", topic);
          const tabset =
            _.first(
              _.filter(
              [...useTabsStore().tabsets.values()] as Tabset[],
              (ts: Tabset) => ts.sharedId === topic &&
                ts.sharing !== TabsetSharing.UNSHARED && ts.sharing !== undefined)
            )
          if (tabset) {
            console.log("Mqtt: found tabset for message")
            const tab = _.first(_.filter(tabset.tabs, (t: Tab) => t.id === payload.tabId))
            if (tab) {
              console.log("Mqtt: found tab for message", tab.id)
              if (!tab.comments) {
                tab.comments = []
              }
              tab.comments.push(payload.comment || new TabComment("", "..."))
              useTabsetService().saveTabset(tabset)
            }
          }

          const msg = new Message(payload.id)
          console.log("Mqtt: adding message", msg)
          useMessagesStore().addMessage(msg)
          break;
        default:
          console.log("Mqtt: got unknown message", payload)
      }

    });

  }

  async reset() {
    console.log("Mqtt: resetting client")
    this.alreadyInitialized = false
    await this.client?.endAsync()
    console.log("Mqtt: resetting client, ended")
  }


  stop() {
    console.log("Mqtt: stopping mqtt client", this.publisher)
    clearTimeout(this.publisher)
    this.client?.end()
  }

  subscribe(topic: string) {
    this.client?.subscribe(topic)
  }

  publishTabComment(topic: string, tab: Tab, comment: TabComment) {
    const payload = new MqttPayload('tabComment', tab, comment)
    this.client?.publish(topic, JSON.stringify(payload))
  }
}

export default new MqttService();