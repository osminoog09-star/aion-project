package com.aion.driver.notif

/**
 * Кольцевой буфер последних пойманных уведомлений Bolt (в пределах процесса).
 * Заполняется слушателем, вычитывается JS через drainBuffer. Синхронизирован.
 * НИКАКОЙ логики заказов здесь — только сырой захват (title/text/time/pkg).
 */
object NotifBuffer {
  val BOLT_PACKAGES: Set<String> = setOf("ee.mtakso.driver")

  private const val MAX = 50

  data class Item(val pkg: String, val title: String?, val text: String?, val time: Long)

  private val items = ArrayDeque<Item>()

  @Synchronized
  fun add(pkg: String, title: String?, text: String?, time: Long) {
    items.addLast(Item(pkg, title, text, time))
    while (items.size > MAX) items.removeFirst()
  }

  @Synchronized
  fun drain(): List<Item> {
    val out = items.toList()
    items.clear()
    return out
  }
}
