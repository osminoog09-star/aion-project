package com.aion.driver.notif

/**
 * Кольцевой буфер последних пойманных текстов Bolt (в пределах процесса).
 * Источник — уведомление ("notif") или экран через Accessibility ("screen").
 * Заполняется слушателем/читалкой, вычитывается JS через drainBuffer.
 * НИКАКОЙ логики заказов здесь — только сырой захват (source/title/text/time/pkg).
 */
object NotifBuffer {
  val BOLT_PACKAGES: Set<String> = setOf("ee.mtakso.driver")

  private const val MAX = 60

  data class Item(
    val source: String,
    val pkg: String,
    val title: String?,
    val text: String?,
    val time: Long,
  )

  private val items = ArrayDeque<Item>()

  @Synchronized
  fun add(source: String, pkg: String, title: String?, text: String?, time: Long) {
    // Анти-дубль: не пишем то же самое (source+text), что уже последним лежит —
    // Accessibility шлёт много одинаковых событий по одному экрану.
    val last = items.lastOrNull()
    if (last != null && last.source == source && last.text == text && last.title == title) return
    items.addLast(Item(source, pkg, title, text, time))
    while (items.size > MAX) items.removeFirst()
  }

  @Synchronized
  fun drain(): List<Item> {
    val out = items.toList()
    items.clear()
    return out
  }
}
