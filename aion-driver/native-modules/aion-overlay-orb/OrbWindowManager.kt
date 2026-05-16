package com.aion.driver.orb

import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * Единственный overlay-орб: TYPE_APPLICATION_OVERLAY.
 * Позиция и runtime — OrbPersistence; show() снимает предыдущий слой (без дубликатов).
 */
object OrbWindowManager {
  private val main = Handler(Looper.getMainLooper())

  @Volatile
  private var container: FrameLayout? = null

  @Volatile
  private var inner: View? = null

  @Volatile
  private var params: WindowManager.LayoutParams? = null

  @Volatile
  private var windowManager: WindowManager? = null

  @Volatile
  private var orbPixelSize: Int = 0

  private fun dp(ctx: Context, d: Int): Int =
    (d * ctx.resources.displayMetrics.density).roundToInt()

  private fun applyStateColor(view: View, state: String) {
    val color = when (state) {
      "shift_active" -> 0xFF22C55E.toInt()
      "paused" -> 0xFFF59E0B.toInt()
      "background" -> 0xFF38BDF8.toInt()
      else -> 0xFF64748B.toInt()
    }
    val d = GradientDrawable()
    d.shape = GradientDrawable.OVAL
    d.setColor(color)
    view.background = d
  }

  private fun clampToDisplay(ctx: Context, p: WindowManager.LayoutParams, w: Int, h: Int) {
    val dm = ctx.resources.displayMetrics
    val maxX = (dm.widthPixels - w).coerceAtLeast(0)
    val maxY = (dm.heightPixels - h).coerceAtLeast(0)
    p.x = p.x.coerceIn(0, maxX)
    p.y = p.y.coerceIn(0, maxY)
  }

  fun show(context: Context, state: String, shiftId: String?) {
    main.post { showInternal(context.applicationContext, state, shiftId) }
  }

  private fun showInternal(appCtx: Context, state: String, shiftId: String?) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
      !Settings.canDrawOverlays(appCtx)
    ) {
      throw IllegalStateException("SYSTEM_ALERT_WINDOW not granted")
    }
    detachViewOnly()
    val snap = OrbPersistence.load(appCtx)
    val wm = appCtx.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    windowManager = wm
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      @Suppress("DEPRECATION")
      WindowManager.LayoutParams.TYPE_PHONE
    }
    val size = dp(appCtx, 56)
    orbPixelSize = size
    val p = WindowManager.LayoutParams(
      size,
      size,
      type,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT,
    )
    p.gravity = Gravity.TOP or Gravity.START
    if (OrbPersistence.hasSavedPosition(snap)) {
      p.x = snap.x
      p.y = snap.y
    } else {
      p.x = dp(appCtx, 16)
      p.y = dp(appCtx, 160)
    }
    clampToDisplay(appCtx, p, size, size)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      p.layoutInDisplayCutoutMode =
        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
    }
    val frame = FrameLayout(appCtx)
    val child = View(appCtx)
    applyStateColor(child, state)
    frame.addView(
      child,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT,
      ),
    )
    var lastRawX = 0f
    var lastRawY = 0f
    var startRawX = 0f
    var startRawY = 0f
    var dragging = false
    frame.setOnTouchListener { _, ev ->
      when (ev.actionMasked) {
        MotionEvent.ACTION_DOWN -> {
          lastRawX = ev.rawX
          lastRawY = ev.rawY
          startRawX = ev.rawX
          startRawY = ev.rawY
          dragging = false
          true
        }
        MotionEvent.ACTION_MOVE -> {
          val dx = ev.rawX - lastRawX
          val dy = ev.rawY - lastRawY
          if (abs(dx) + abs(dy) > 6) dragging = true
          p.x += dx.roundToInt()
          p.y += dy.roundToInt()
          clampToDisplay(appCtx, p, orbPixelSize, orbPixelSize)
          lastRawX = ev.rawX
          lastRawY = ev.rawY
          try {
            wm.updateViewLayout(frame, p)
          } catch (_: Exception) {
          }
          true
        }
        MotionEvent.ACTION_UP -> {
          clampToDisplay(appCtx, p, orbPixelSize, orbPixelSize)
          OrbPersistence.saveLayout(appCtx, p.x, p.y)
          val total = abs(ev.rawX - startRawX) + abs(ev.rawY - startRawY)
          if (!dragging && total < 24f) {
            openApp(appCtx)
          }
          true
        }
        else -> false
      }
    }
    wm.addView(frame, p)
    container = frame
    inner = child
    params = p
    OrbPersistence.saveRuntime(appCtx, true, state, shiftId)
  }

  private fun openApp(ctx: Context) {
    val intent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName) ?: return
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    ctx.startActivity(intent)
  }

  fun hide(appCtx: Context) {
    main.post {
      detachViewOnly()
      OrbPersistence.clearVisible(appCtx.applicationContext)
    }
  }

  private fun detachViewOnly() {
    val frame = container ?: return
    val wm = windowManager
    try {
      wm?.removeView(frame)
    } catch (_: Exception) {
    }
    container = null
    inner = null
    params = null
    windowManager = null
  }

  fun updateState(state: String) {
    main.post {
      val v = inner ?: return@post
      applyStateColor(v, state)
    }
  }
}
