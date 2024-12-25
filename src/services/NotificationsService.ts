import { Notification } from 'src/core/models/Notification'

class NotificationsService {
  async init() {
    console.debug('initializing notificationsService')
    // db.getNotifications(true)
    //   .then((res: Notification[]) => {
    //     useNotificationsStore().notifications = res
    //   })
  }

  addNotification(notification: Notification) {
    // const notification = new Notification(uid(), title, msg)
    //  db.addNotification(notification)
    //    .then(() => useNotificationsStore().notifications.push(notification))
  }

  markRead(notificationId: string) {
    console.log('read', notificationId)
    // db.notificationRead(notificationId)
  }
}

export default new NotificationsService()
