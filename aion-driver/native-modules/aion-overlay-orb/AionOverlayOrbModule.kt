package com.aion.driver.orb

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import android.os.Build
import android.provider.Settings

class AionOverlayOrbModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AionOverlayOrb"

  @ReactMethod
  fun isOverlayPermissionGranted(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        promise.resolve(true)
      } else {
        promise.resolve(Settings.canDrawOverlays(reactContext))
      }
    } catch (e: Exception) {
      promise.reject("ORB_PERM", e.message, e)
    }
  }

  @ReactMethod
  fun showOrb(options: ReadableMap?, promise: Promise) {
    try {
      val state =
        if (options != null && options.hasKey("state")) options.getString("state") ?: "idle" else "idle"
      val shiftId =
        if (options != null && options.hasKey("shiftId")) options.getString("shiftId")?.takeIf { it.isNotEmpty() } else null
      AionOverlayOrbService.startShow(reactApplicationContext, state, shiftId)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ORB_SHOW", e.message, e)
    }
  }

  @ReactMethod
  fun hideOrb(promise: Promise) {
    try {
      AionOverlayOrbService.requestHide(reactApplicationContext)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ORB_HIDE", e.message, e)
    }
  }

  @ReactMethod
  fun updateOrbHud(title: String, body: String, promise: Promise) {
    try {
      AionOverlayOrbService.requestUpdateHud(reactApplicationContext, title, body)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ORB_HUD", e.message, e)
    }
  }

  @ReactMethod
  fun updateOrbState(state: String, promise: Promise) {
    try {
      AionOverlayOrbService.requestUpdate(reactApplicationContext, state)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ORB_STATE", e.message, e)
    }
  }

  @ReactMethod
  fun pulseOrb(kind: String, promise: Promise) {
    try {
      AionOverlayOrbService.requestPulse(reactApplicationContext, kind)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ORB_PULSE", e.message, e)
    }
  }
}
