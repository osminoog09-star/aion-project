package com.aion.driver.orb

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.view.View
import android.view.animation.LinearInterpolator
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

/**
 * Живой overlay-орб.
 *  - Радиальный градиент по состоянию
 *  - Дыхание (alpha + scale) через ValueAnimator
 *  - Тонкое кольцо энергии + орбитальные точки (упрощённо, без particles GPU)
 *  - Drag/snap делает OrbWindowManager; OrbView отвечает только за рендер
 */
class OrbView(context: Context) : View(context) {

  private val corePaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val rimPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.STROKE
    strokeWidth = dp(1.2f)
  }
  private val dotPaint = Paint(Paint.ANTI_ALIAS_FLAG)

  private var breathPhase: Float = 0f
  private var rotationPhase: Float = 0f

  private val breathAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
    duration = 2400L
    repeatCount = ValueAnimator.INFINITE
    repeatMode = ValueAnimator.REVERSE
    interpolator = LinearInterpolator()
    addUpdateListener {
      breathPhase = it.animatedValue as Float
      invalidate()
    }
  }
  private val rotationAnimator = ValueAnimator.ofFloat(0f, 360f).apply {
    duration = 6000L
    repeatCount = ValueAnimator.INFINITE
    interpolator = LinearInterpolator()
    addUpdateListener {
      rotationPhase = it.animatedValue as Float
      invalidate()
    }
  }

  private var coreColor: Int = 0xFF22D3EE.toInt()
  private var rimColor: Int = 0x88BAE6FD.toInt()
  private var dotColor: Int = 0xBBE0F2FE.toInt()

  fun applyState(state: String) {
    when (state) {
      "shift_active", "syncing" -> {
        coreColor = 0xFF22C55E.toInt()
        rimColor = 0xCCA7F3D0.toInt()
        dotColor = 0xCCD1FAE5.toInt()
        breathAnimator.duration = 1400L
        rotationAnimator.duration = 4000L
      }
      "thinking" -> {
        coreColor = 0xFFA78BFA.toInt()
        rimColor = 0xCCC4B5FD.toInt()
        dotColor = 0xCCDDD6FE.toInt()
        breathAnimator.duration = 1500L
        rotationAnimator.duration = 4500L
      }
      "updating" -> {
        coreColor = 0xFFFBBF24.toInt()
        rimColor = 0xCCFDE68A.toInt()
        dotColor = 0xCCFEF3C7.toInt()
        breathAnimator.duration = 1700L
        rotationAnimator.duration = 5000L
      }
      "paused", "warning" -> {
        coreColor = 0xFFF59E0B.toInt()
        rimColor = 0xAAFDE68A.toInt()
        dotColor = 0xAAFEF3C7.toInt()
        breathAnimator.duration = 1000L
        rotationAnimator.duration = 5500L
      }
      "critical", "error" -> {
        coreColor = 0xFFFB7185.toInt()
        rimColor = 0xCCFECDD3.toInt()
        dotColor = 0xCCFEE2E2.toInt()
        breathAnimator.duration = 900L
        rotationAnimator.duration = 4200L
      }
      "offline" -> {
        coreColor = 0xFF475569.toInt()
        rimColor = 0x66CBD5E1.toInt()
        dotColor = 0x66E2E8F0.toInt()
        breathAnimator.duration = 3200L
        rotationAnimator.duration = 14000L
      }
      "background" -> {
        coreColor = 0xFF38BDF8.toInt()
        rimColor = 0xCCBAE6FD.toInt()
        dotColor = 0xCCE0F2FE.toInt()
        breathAnimator.duration = 2200L
        rotationAnimator.duration = 7000L
      }
      else -> {
        coreColor = 0xFF22D3EE.toInt()
        rimColor = 0x99BAE6FD.toInt()
        dotColor = 0xBBE0F2FE.toInt()
        breathAnimator.duration = 2400L
        rotationAnimator.duration = 6000L
      }
    }
    invalidate()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    breathAnimator.start()
    rotationAnimator.start()
  }

  override fun onDetachedFromWindow() {
    breathAnimator.cancel()
    rotationAnimator.cancel()
    super.onDetachedFromWindow()
  }

  override fun onDraw(canvas: Canvas) {
    val w = width.toFloat()
    val h = height.toFloat()
    val cx = w / 2f
    val cy = h / 2f
    val maxR = min(w, h) / 2f - dp(2f)
    val breathScale = 0.94f + breathPhase * 0.1f
    val coreR = maxR * 0.62f * breathScale
    val rimR = maxR * 0.94f * breathScale

    val haloR = maxR * (1f - 0.15f * breathPhase)
    val haloPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      shader = RadialGradient(
        cx,
        cy,
        haloR,
        intArrayOf(withAlpha(coreColor, 0.55f), withAlpha(coreColor, 0.0f)),
        floatArrayOf(0f, 1f),
        Shader.TileMode.CLAMP,
      )
    }
    canvas.drawCircle(cx, cy, haloR, haloPaint)

    rimPaint.color = rimColor
    canvas.drawCircle(cx, cy, rimR, rimPaint)

    corePaint.shader = RadialGradient(
      cx - coreR * 0.25f,
      cy - coreR * 0.35f,
      coreR * 1.4f,
      intArrayOf(blend(coreColor, Color.WHITE, 0.35f), coreColor, blend(coreColor, Color.BLACK, 0.45f)),
      floatArrayOf(0f, 0.55f, 1f),
      Shader.TileMode.CLAMP,
    )
    canvas.drawCircle(cx, cy, coreR, corePaint)

    val specularPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = withAlpha(Color.WHITE, 0.35f)
    }
    canvas.drawCircle(cx - coreR * 0.32f, cy - coreR * 0.36f, coreR * 0.22f, specularPaint)

    val orbitR = rimR + dp(2.5f)
    dotPaint.color = dotColor
    val dotCount = 4
    for (i in 0 until dotCount) {
      val angle = Math.toRadians((rotationPhase + i * (360f / dotCount)).toDouble())
      val px = cx + cos(angle).toFloat() * orbitR
      val py = cy + sin(angle).toFloat() * orbitR
      canvas.drawCircle(px, py, dp(1.6f), dotPaint)
    }
  }

  private fun withAlpha(color: Int, alpha: Float): Int {
    val a = (alpha.coerceIn(0f, 1f) * 255f).toInt()
    return (a shl 24) or (color and 0x00FFFFFF)
  }

  private fun blend(a: Int, b: Int, t: Float): Int {
    val tc = t.coerceIn(0f, 1f)
    val ar = (a shr 16) and 0xFF
    val ag = (a shr 8) and 0xFF
    val ab = a and 0xFF
    val br = (b shr 16) and 0xFF
    val bg = (b shr 8) and 0xFF
    val bb = b and 0xFF
    val r = (ar + (br - ar) * tc).toInt()
    val g = (ag + (bg - ag) * tc).toInt()
    val bch = (ab + (bb - ab) * tc).toInt()
    return (0xFF shl 24) or (r shl 16) or (g shl 8) or bch
  }

  private fun dp(v: Float): Float =
    v * resources.displayMetrics.density
}
