import mqtt, {MqttClient} from "mqtt";
import {uid, useQuasar} from "quasar";
import {Tab, TabComment} from "src/models/Tab";
import {useAppStore} from "stores/appStore";
import {Message} from "src/models/Message";
import {useMessagesStore} from "stores/messagesStore";
import {useTabsStore} from "stores/tabsStore";
import {Tabset, TabsetSharing} from "src/models/Tabset";
import _ from "lodash"
import {useTabsetService} from "src/services/TabsetService2";

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

  private client: MqttClient = null

  private publisher: number = 0

  init() {
    console.log("starting mqtt client...")
    const author = useQuasar().localStorage.getItem("sharing.author") || ''
    //this.client =  mqtt.connectAsync("mqtt://test.mosquitto.org")
    //this.client = mqtt.connect("mqtts://public:public@public.cloud.shiftr.io:443", {clientId: 'javascript'})
    //this.client = mqtt.connect("mqtts://tabsets:3dAkqY8glIIecUBs@tabsets.cloud.shiftr.io:443", {clientId: 'tabsets' + author})
    //this.client = mqtt.connect("mqtts://gpgpaxfd:zH8P4i6hZee4SVCqK_uS6KRcuTnPeRu7@sparrow.rmq.cloudamqp.com:8883", {clientId: 'tabsets' + author})
    this.client = mqtt.connect("mqtts://demo.flashmq.org", {clientId: 'tabsets' + author})

    const ctx = this
    this.client.on('connect', function () {
      console.log('connected!', ctx.client);

      ctx.client.subscribe('hello2');

      // ctx.publisher = setInterval(function () {
      //   console.log("publishing")
      //   ctx.client.publish('hello2', 'world');
      // }, 1000);
    });

    this.client.on('message', function (topic, message) {
      const payload: MqttPayload = JSON.parse(message.toString())
      if (payload.installationId === useAppStore().getInstallationId()) {
        console.log("not for me...")
        return
      }
      switch (payload.event) {
        case 'tabComment':
          console.log("===============")
          console.log(topic + ': ' + payload.toString());
          console.log("===============")

          const tabset =
            _.first(_.filter(
            [...useTabsStore().tabsets.values()],
            (ts: Tabset) => ts.sharedId === topic &&
              ts.sharing !== TabsetSharing.UNSHARED && ts.sharing !== undefined))
          if (tabset) {
            console.log("found tabset for message")
            const tab = _.first(_.filter(tabset.tabs, (t: Tab) => t.id === payload.tabId))
            if (tab) {
              console.log("found tab for message", tab.id)
              if (!tab.comments) {
                tab.comments = []
              }
              tab.comments.push(payload.comment || new TabComment("","..."))
              useTabsetService().saveTabset(tabset)
            }
          }

          const msg = new Message(payload.id)
          console.log("adding message", msg)
          useMessagesStore().addMessage(msg)
          break;
        default:
          console.log("got unknown message", payload)
      }

    });

  }


  stop() {
    console.log("stopping mqtt client", this.publisher)
    clearTimeout(this.publisher)
    this.client.end()
  }

  subscribe(topic: string) {
    this.client.subscribe(topic)
  }

  publishTabComment(topic: string, tab: Tab, comment: TabComment) {
    const payload = new MqttPayload('tabComment', tab, comment)
    this.client.publish(topic, JSON.stringify(payload))
  }
}

export default new MqttService();
