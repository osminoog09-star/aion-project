package com.aion.driver.notif

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * Слушатель уведомлений: ловит ТОЛЬКО уведомления Bolt и складывает их сырой
 * текст в NotifBuffer. Ничего не рисует, не запускает foreground-сервис, не
 * трогает заказы/деньги — минимальная поверхность (урок орбиты). Весь колбэк
 * в try/catch: слушатель НИКОГДА не роняет процесс приложения.
 *
 * Активен только если пользователь дал «Доступ к уведомлениям» для AION в
 * настройках Android (по умолчанию выключено).
 */
class AionNotifListenerService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    try {
      if (sbn == null) return
      val pkg = sbn.packageName ?: return
      if (!NotifBuffer.BOLT_PACKAGES.contains(pkg)) return
      val extras = sbn.notification?.extras
      val title = extras?.getCharSequence("android.title")?.toString()
      val text = extras?.getCharSequence("android.text")?.toString()
      NotifBuffer.add("notif", pkg, title, text, sbn.postTime)
    } catch (_: Throwable) {
      // Никогда не роняем процесс из колбэка слушателя.
    }
  }
}
