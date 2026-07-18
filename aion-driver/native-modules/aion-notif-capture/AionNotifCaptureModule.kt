package com.aion.driver.notif

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray

/**
 * JS-мост к захвату уведомлений: статус доступа, открыть настройки доступа,
 * вычитать буфер. Всё в try/catch с promise.reject — никаких падений в JS.
 */
class AionNotifCaptureModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AionNotifCapture"

  @ReactMethod
  fun isAccessGranted(promise: Promise) {
    try {
      val pkg = reactContext.packageName
      val flat = Settings.Secure.getString(
        reactContext.contentResolver,
        "enabled_notification_listeners",
      )
      promise.resolve(flat != null && flat.contains(pkg))
    } catch (e: Exception) {
      promise.reject("NOTIF_PERM", e.message, e)
    }
  }

  @ReactMethod
  fun openAccessSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("NOTIF_SETTINGS", e.message, e)
    }
  }

  @ReactMethod
  fun isAccessibilityGranted(promise: Promise) {
    try {
      val svc = reactContext.packageName + "/com.aion.driver.notif.AionBoltReaderService"
      val flat = Settings.Secure.getString(
        reactContext.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
      )
      promise.resolve(flat != null && flat.contains(svc))
    } catch (e: Exception) {
      promise.reject("A11Y_PERM", e.message, e)
    }
  }

  @ReactMethod
  fun openAccessibilitySettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("A11Y_SETTINGS", e.message, e)
    }
  }

  @ReactMethod
  fun drainBuffer(promise: Promise) {
    try {
      val arr: WritableArray = Arguments.createArray()
      for (it in NotifBuffer.drain()) {
        val m = Arguments.createMap()
        m.putString("source", it.source)
        m.putString("packageName", it.pkg)
        m.putString("title", it.title)
        m.putString("text", it.text)
        m.putDouble("postedAtMs", it.time.toDouble())
        arr.pushMap(m)
      }
      promise.resolve(arr)
    } catch (e: Exception) {
      promise.reject("NOTIF_DRAIN", e.message, e)
    }
  }
}
