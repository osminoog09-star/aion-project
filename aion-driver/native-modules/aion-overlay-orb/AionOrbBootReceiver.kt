package com.aion.driver.orb

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings

/** Best-effort: после перезагрузки устройства — если орбита была видима и разрешение есть. */
class AionOrbBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
    val app = context.applicationContext
    val snap = OrbPersistence.load(app)
    if (!snap.visible) return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(app)) {
      OrbPersistence.clearVisible(app)
      return
    }
    AionOverlayOrbService.startShow(app, snap.state, snap.shiftId)
  }
}
