package com.aion.driver.notif

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Читалка экрана Bolt (Accessibility): собирает ТЕКСТ карточки заказа Bolt
 * (сумма, адрес, наличные/карта) — готовые текстовые узлы, без OCR. Читает
 * ТОЛЬКО пакет Bolt (в конфиге packageNames), складывает сырой текст в
 * NotifBuffer(source="screen"). Ничего не рисует, не пишет в доход — только
 * захват. Весь колбэк в try/catch: НИКОГДА не роняет процесс.
 *
 * Активна только если пользователь включил AION в «Спец. возможности» Android
 * (по умолчанию выключено; инвазивно — только с явного согласия).
 */
class AionBoltReaderService : AccessibilityService() {
  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    try {
      if (event == null) return
      val pkg = event.packageName?.toString() ?: return
      if (!NotifBuffer.BOLT_PACKAGES.contains(pkg)) return
      val root = rootInActiveWindow ?: return
      val sb = StringBuilder()
      collectText(root, sb, 0)
      val text = sb.toString().trim().trimEnd('|', ' ')
      if (text.isNotEmpty()) {
        NotifBuffer.add("screen", pkg, "Экран Bolt", text.take(1500), System.currentTimeMillis())
      }
    } catch (_: Throwable) {
      // Никогда не роняем процесс из колбэка читалки.
    }
  }

  override fun onInterrupt() {}

  private fun collectText(node: AccessibilityNodeInfo?, sb: StringBuilder, depth: Int) {
    if (node == null || depth > 40) return
    val t = node.text?.toString()?.trim()
    if (!t.isNullOrEmpty()) sb.append(t).append(" | ")
    val cd = node.contentDescription?.toString()?.trim()
    if (!cd.isNullOrEmpty() && cd != t) sb.append(cd).append(" | ")
    val n = node.childCount
    var i = 0
    while (i < n) {
      collectText(node.getChild(i), sb, depth + 1)
      i += 1
    }
  }
}
