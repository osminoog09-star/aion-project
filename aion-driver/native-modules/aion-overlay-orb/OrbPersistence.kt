package com.aion.driver.orb

import android.content.Context

/**
 * Persisted overlay runtime (process death / reboot — best-effort; OEM может убить FGS).
 */
object OrbPersistence {
  private const val PREF = "aion_orb_runtime_v1"
  private const val K_VISIBLE = "visible"
  private const val K_X = "x"
  private const val K_Y = "y"
  private const val K_STATE = "state"
  private const val K_SHIFT = "shift_id"

  data class Snapshot(
    val visible: Boolean,
    val x: Int,
    val y: Int,
    val state: String,
    val shiftId: String?,
  )

  fun load(ctx: Context): Snapshot {
    val sp = ctx.applicationContext.getSharedPreferences(PREF, Context.MODE_PRIVATE)
    return Snapshot(
      visible = sp.getBoolean(K_VISIBLE, false),
      x = sp.getInt(K_X, Int.MIN_VALUE),
      y = sp.getInt(K_Y, Int.MIN_VALUE),
      state = sp.getString(K_STATE, "idle") ?: "idle",
      shiftId = sp.getString(K_SHIFT, null)?.takeIf { it.isNotEmpty() },
    )
  }

  fun hasSavedPosition(s: Snapshot): Boolean =
    s.x != Int.MIN_VALUE && s.y != Int.MIN_VALUE

  fun saveRuntime(ctx: Context, visible: Boolean, state: String, shiftId: String?) {
    val sp = ctx.applicationContext.getSharedPreferences(PREF, Context.MODE_PRIVATE)
    val e = sp.edit().putBoolean(K_VISIBLE, visible).putString(K_STATE, state)
    if (shiftId != null) {
      e.putString(K_SHIFT, shiftId)
    } else {
      e.remove(K_SHIFT)
    }
    e.apply()
  }

  fun saveLayout(ctx: Context, x: Int, y: Int) {
    ctx.applicationContext.getSharedPreferences(PREF, Context.MODE_PRIVATE).edit()
      .putInt(K_X, x)
      .putInt(K_Y, y)
      .apply()
  }

  fun clearVisible(ctx: Context) {
    ctx.applicationContext.getSharedPreferences(PREF, Context.MODE_PRIVATE).edit()
      .putBoolean(K_VISIBLE, false)
      .apply()
  }
}
