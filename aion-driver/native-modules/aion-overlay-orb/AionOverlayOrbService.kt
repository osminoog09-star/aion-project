package com.aion.driver.orb

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

/**
 * Foreground service для overlay: не привязан к Activity; watchdog при отзыве overlay.
 * После kill процесса — восстановление только best-effort (BOOT / sticky restart).
 */
class AionOverlayOrbService : Service() {

  private val handler = Handler(Looper.getMainLooper())
  private var watchdogRunning = false

  private val permWatchdog: Runnable = object : Runnable {
    override fun run() {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
        !Settings.canDrawOverlays(this@AionOverlayOrbService)
      ) {
        stopOverlayAndService()
        return
      }
      handler.postDelayed(this, 12_000L)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    createChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == null) {
      val snap = OrbPersistence.load(applicationContext)
      if (!snap.visible) {
        stopSelf()
        return START_NOT_STICKY
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
        !Settings.canDrawOverlays(applicationContext)
      ) {
        OrbPersistence.clearVisible(applicationContext)
        stopSelf()
        return START_NOT_STICKY
      }
      goForeground()
      try {
        OrbWindowManager.show(applicationContext, snap.state, snap.shiftId)
      } catch (_: Exception) {
        stopOverlayAndService()
        return START_NOT_STICKY
      }
      startWatchdog()
      return START_STICKY
    }

    when (intent.action) {
      ACTION_SHOW -> {
        val state = intent.getStringExtra(EXTRA_STATE) ?: "idle"
        val shiftId = intent.getStringExtra(EXTRA_SHIFT_ID)?.takeIf { it.isNotEmpty() }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
          !Settings.canDrawOverlays(applicationContext)
        ) {
          OrbPersistence.clearVisible(applicationContext)
          stopSelf()
          return START_NOT_STICKY
        }
        goForeground()
        try {
          OrbWindowManager.show(applicationContext, state, shiftId)
        } catch (_: Exception) {
          stopOverlayAndService()
          return START_NOT_STICKY
        }
        startWatchdog()
        return START_STICKY
      }
      ACTION_UPDATE -> {
        goForeground()
        val state = intent.getStringExtra(EXTRA_STATE) ?: return START_STICKY
        val prev = OrbPersistence.load(applicationContext)
        OrbPersistence.saveRuntime(applicationContext, true, state, prev.shiftId)
        OrbWindowManager.updateState(state)
        startWatchdog()
        return START_STICKY
      }
      ACTION_UPDATE_HUD -> {
        goForeground()
        val t = intent.getStringExtra(EXTRA_HUD_TITLE)
        val b = intent.getStringExtra(EXTRA_HUD_BODY)
        if (t != null) hudTitle = t
        if (b != null) hudBody = b
        NotificationManagerCompat.from(this).notify(NOTIF_ID, buildNotification())
        startWatchdog()
        return START_STICKY
      }
      ACTION_HIDE -> {
        stopOverlayAndService()
        return START_NOT_STICKY
      }
      ACTION_PULSE -> {
        val kind = intent.getStringExtra(EXTRA_PULSE_KIND) ?: return START_STICKY
        OrbWindowManager.pulse(kind)
        return START_STICKY
      }
    }
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(permWatchdog)
    watchdogRunning = false
    super.onDestroy()
  }

  private fun startWatchdog() {
    if (watchdogRunning) return
    watchdogRunning = true
    handler.removeCallbacks(permWatchdog)
    handler.postDelayed(permWatchdog, 12_000L)
  }

  private fun stopOverlayAndService() {
    handler.removeCallbacks(permWatchdog)
    watchdogRunning = false
    OrbWindowManager.hide(applicationContext)
    try {
      ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
    } catch (_: Exception) {
    }
    stopSelf()
  }

  private fun goForeground() {
    val notif = buildNotification()
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(
        NOTIF_ID,
        notif,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
      )
    } else {
      @Suppress("DEPRECATION")
      startForeground(NOTIF_ID, notif)
    }
  }

  private fun buildNotification(): Notification {
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val title = hudTitle ?: "AION — орбита"
    val text = hudBody ?: "Тап по орбите открывает приложение"
    val b = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(text)
      .setSmallIcon(android.R.drawable.ic_menu_compass)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
    if (launch != null) {
      val pi = PendingIntent.getActivity(
        this,
        0,
        launch,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
      b.setContentIntent(pi)
    }
    return b.build()
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = getSystemService(NotificationManager::class.java)
    val ch = NotificationChannel(
      CHANNEL_ID,
      "AION overlay",
      NotificationManager.IMPORTANCE_LOW,
    )
    nm.createNotificationChannel(ch)
  }

  companion object {
    @Volatile
    var hudTitle: String? = null

    @Volatile
    var hudBody: String? = null

    const val ACTION_SHOW = "com.aion.driver.orb.action.SHOW"
    const val ACTION_UPDATE = "com.aion.driver.orb.action.UPDATE"
    const val ACTION_UPDATE_HUD = "com.aion.driver.orb.action.UPDATE_HUD"
    const val ACTION_HIDE = "com.aion.driver.orb.action.HIDE"
    const val ACTION_PULSE = "com.aion.driver.orb.action.PULSE"
    const val EXTRA_STATE = "state"
    const val EXTRA_SHIFT_ID = "shift_id"
    const val EXTRA_HUD_TITLE = "hud_title"
    const val EXTRA_HUD_BODY = "hud_body"
    const val EXTRA_PULSE_KIND = "pulse_kind"
    private const val CHANNEL_ID = "aion_orb_fgs_v1"
    private const val NOTIF_ID = 71042

    fun startShow(ctx: Context, state: String, shiftId: String?) {
      val app = ctx.applicationContext
      val i = Intent(app, AionOverlayOrbService::class.java).apply {
        action = ACTION_SHOW
        putExtra(EXTRA_STATE, state)
        if (shiftId != null) putExtra(EXTRA_SHIFT_ID, shiftId)
      }
      ContextCompat.startForegroundService(app, i)
    }

    fun requestUpdate(ctx: Context, state: String) {
      val app = ctx.applicationContext
      val i = Intent(app, AionOverlayOrbService::class.java).apply {
        action = ACTION_UPDATE
        putExtra(EXTRA_STATE, state)
      }
      ContextCompat.startForegroundService(app, i)
    }

    fun requestUpdateHud(ctx: Context, title: String, body: String) {
      val app = ctx.applicationContext
      val i = Intent(app, AionOverlayOrbService::class.java).apply {
        action = ACTION_UPDATE_HUD
        putExtra(EXTRA_HUD_TITLE, title)
        putExtra(EXTRA_HUD_BODY, body)
      }
      ContextCompat.startForegroundService(app, i)
    }

    fun requestHide(ctx: Context) {
      val app = ctx.applicationContext
      val i = Intent(app, AionOverlayOrbService::class.java).apply { action = ACTION_HIDE }
      app.startService(i)
    }

    fun requestPulse(ctx: Context, kind: String) {
      val app = ctx.applicationContext
      val i = Intent(app, AionOverlayOrbService::class.java).apply {
        action = ACTION_PULSE
        putExtra(EXTRA_PULSE_KIND, kind)
      }
      app.startService(i)
    }
  }
}
