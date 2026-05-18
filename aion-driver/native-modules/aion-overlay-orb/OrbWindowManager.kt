package com.aion.driver.orb

import android.animation.ValueAnimator
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * Единственный overlay-орб: TYPE_APPLICATION_OVERLAY.
 *
 * Поверх OrbView строит:
 *  - drag (raw coords)
 *  - magnetic snap к ближайшему краю (X) на ACTION_UP с animation
 *  - tap (короткий клик) → открыть Driver
 *  - long press (>= 520ms) → открыть Driver с deep link /aion-status (mini-panel в JS)
 *  - smart positioning: clamp в safe-bounds дисплея, отступ от edge ~12dp
 */
object OrbWindowManager {
  private val main = Handler(Looper.getMainLooper())
  private const val ORB_DP = 60
  private const val EDGE_PAD_DP = 12
  private const val LONG_PRESS_MS = 520L
  private const val DRAG_THRESHOLD_DP = 6f

  @Volatile
  private var container: FrameLayout? = null

  @Volatile
  private var orbView: OrbView? = null

  @Volatile
  private var params: WindowManager.LayoutParams? = null

  @Volatile
  private var windowManager: WindowManager? = null

  @Volatile
  private var orbPixelSize: Int = 0

  @Volatile
  private var snapAnimator: ValueAnimator? = null

  private fun dp(ctx: Context, d: Int): Int =
    (d * ctx.resources.displayMetrics.density).roundToInt()

  private fun clampToDisplay(ctx: Context, p: WindowManager.LayoutParams, w: Int, h: Int) {
    val dm = ctx.resources.displayMetrics
    val pad = dp(ctx, EDGE_PAD_DP)
    val maxX = (dm.widthPixels - w - pad).coerceAtLeast(pad)
    val maxY = (dm.heightPixels - h - pad).coerceAtLeast(pad)
    p.x = p.x.coerceIn(pad, maxX)
    p.y = p.y.coerceIn(pad, maxY)
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
    val size = dp(appCtx, ORB_DP)
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
      p.x = dp(appCtx, EDGE_PAD_DP)
      p.y = dp(appCtx, 160)
    }
    clampToDisplay(appCtx, p, size, size)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      p.layoutInDisplayCutoutMode =
        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
    }
    val frame = FrameLayout(appCtx)
    val child = OrbView(appCtx).apply { applyState(state) }
    frame.addView(
      child,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT,
      ),
    )
    attachGestures(appCtx, frame, p, wm)
    wm.addView(frame, p)
    container = frame
    orbView = child
    params = p
    OrbPersistence.saveRuntime(appCtx, true, state, shiftId)
  }

  private fun attachGestures(
    appCtx: Context,
    frame: FrameLayout,
    p: WindowManager.LayoutParams,
    wm: WindowManager,
  ) {
    var lastRawX = 0f
    var lastRawY = 0f
    var startRawX = 0f
    var startRawY = 0f
    var startX = 0
    var startY = 0
    var dragging = false
    val threshold = DRAG_THRESHOLD_DP * appCtx.resources.displayMetrics.density
    val longPressRunnable = Runnable {
      if (!dragging) openApp(appCtx, longPress = true)
    }
    frame.setOnTouchListener { _, ev ->
      when (ev.actionMasked) {
        MotionEvent.ACTION_DOWN -> {
          lastRawX = ev.rawX
          lastRawY = ev.rawY
          startRawX = ev.rawX
          startRawY = ev.rawY
          startX = p.x
          startY = p.y
          dragging = false
          snapAnimator?.cancel()
          main.postDelayed(longPressRunnable, LONG_PRESS_MS)
          true
        }
        MotionEvent.ACTION_MOVE -> {
          val dx = ev.rawX - lastRawX
          val dy = ev.rawY - lastRawY
          val totalDx = abs(ev.rawX - startRawX)
          val totalDy = abs(ev.rawY - startRawY)
          if (!dragging && totalDx + totalDy > threshold) {
            dragging = true
            main.removeCallbacks(longPressRunnable)
          }
          if (dragging) {
            p.x += dx.roundToInt()
            p.y += dy.roundToInt()
            clampToDisplay(appCtx, p, orbPixelSize, orbPixelSize)
            try {
              wm.updateViewLayout(frame, p)
            } catch (_: Exception) {
              // intentionally ignored: layout race on rapid rotate
            }
          }
          lastRawX = ev.rawX
          lastRawY = ev.rawY
          true
        }
        MotionEvent.ACTION_UP -> {
          main.removeCallbacks(longPressRunnable)
          val total = abs(ev.rawX - startRawX) + abs(ev.rawY - startRawY)
          if (!dragging && total < threshold) {
            openApp(appCtx, longPress = false)
          } else {
            magneticSnap(appCtx, frame, p, wm)
          }
          true
        }
        MotionEvent.ACTION_CANCEL -> {
          main.removeCallbacks(longPressRunnable)
          if (dragging) magneticSnap(appCtx, frame, p, wm)
          true
        }
        else -> false
      }
    }
  }

  private fun magneticSnap(
    appCtx: Context,
    frame: FrameLayout,
    p: WindowManager.LayoutParams,
    wm: WindowManager,
  ) {
    val dm = appCtx.resources.displayMetrics
    val pad = dp(appCtx, EDGE_PAD_DP)
    val rightX = dm.widthPixels - orbPixelSize - pad
    val targetX = if (p.x + orbPixelSize / 2 < dm.widthPixels / 2) pad else rightX
    val fromX = p.x
    snapAnimator?.cancel()
    val anim = ValueAnimator.ofInt(fromX, targetX).apply {
      duration = 220L
      interpolator = DecelerateInterpolator(1.4f)
      addUpdateListener {
        p.x = it.animatedValue as Int
        try {
          wm.updateViewLayout(frame, p)
        } catch (_: Exception) {
          // intentionally ignored: layout race on rapid update
        }
      }
    }
    snapAnimator = anim
    anim.start()
    OrbPersistence.saveLayout(appCtx, targetX, p.y)
  }

  private fun openApp(ctx: Context, longPress: Boolean) {
    val pm = ctx.packageManager
    val launch = pm.getLaunchIntentForPackage(ctx.packageName) ?: return
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    if (longPress) {
      launch.data = Uri.parse("aion-driver://orb/status")
      launch.action = Intent.ACTION_VIEW
    }
    try {
      ctx.startActivity(launch)
    } catch (_: Exception) {
      // intentionally ignored: activity start race on background restrictions
    }
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
      // intentionally ignored: view already detached
    }
    snapAnimator?.cancel()
    snapAnimator = null
    container = null
    orbView = null
    params = null
    windowManager = null
  }

  fun updateState(state: String) {
    main.post {
      orbView?.applyState(state)
    }
  }

  fun pulse(kind: String) {
    main.post {
      orbView?.applyPulse(kind)
    }
  }
}
