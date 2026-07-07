import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as ExpoLinking from "expo-linking";
import {
  listGpsTripShiftIds,
  loadGpsTripSession,
} from "../features/gps/tripStore/gpsTripStorage";
import { parseGeoUri } from "../features/maps/parseGeoUri";
import { fetchRoadRoute, type RoadRoute } from "../features/maps/osrmRoute";
import { haversineMeters } from "../utils/geo";
import {
  fetchNearbyFuelStations,
  type FuelStationMarker,
} from "../features/maps/overpassFuel";
import { GradientButton } from "../components/ui/GradientButton";
import { useShift } from "../hooks/useShift";
import {
  loadFuelFavoriteIds,
  toggleFuelFavoriteId,
} from "../storage/driver/fuelFavoritesStorage";
import { spacing } from "../tokens";
import { useTheme } from "../contexts/ThemeContext";

// Пярну — рабочий город владельца; карта тут только до первого GPS-фикса.
const DEFAULT_CENTER = { lat: 58.3859, lng: 24.4971 };
const MAX_ROUTE_POINTS = 1500;

type LatLng = { lat: number; lng: number };
type MapData = {
  center: LatLng;
  user: LatLng | null;
  route: LatLng[];
  routeIsLive: boolean;
  destination: (LatLng & { label: string | null }) | null;
  roadRoute: LatLng[] | null;
  stations: { id: string; lat: number; lng: number; name: string; fav: boolean }[];
};

/**
 * Карта на OpenStreetMap через Leaflet в WebView — БЕЗ Google-ключа
 * (react-native-maps на Android без реального ключа рисует пустоту). Показывает
 * тёмные тайлы, маршрут смены по GPS, точку назначения + маршрут по дорогам,
 * заправки. Данные — только реальные.
 */
const LEAFLET_HTML = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0;background:#0a0d0f}
.leaflet-container{background:#0a0d0f}
.dot{border-radius:50%;border:2px solid rgba(255,255,255,.9)}</style>
</head><body><div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([58.3859,24.4971],13);
L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
var layers=L.layerGroup().addTo(map);
function post(m){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(m));}
function icon(color,size){return L.divIcon({className:'',html:'<div class="dot" style="width:'+size+'px;height:'+size+'px;background:'+color+'"></div>',iconSize:[size,size]});}
function applyData(d){
  try{
    layers.clearLayers();
    var bounds=[];
    if(d.route&&d.route.length>1){var rl=d.route.map(function(p){return [p.lat,p.lng]});L.polyline(rl,{color:'#22d3ee',weight:4,opacity:.9}).addTo(layers);bounds=bounds.concat(rl);
      L.marker(rl[0],{icon:icon('#34d399',14)}).addTo(layers).bindPopup('Старт смены');
      if(!d.routeIsLive)L.marker(rl[rl.length-1],{icon:icon('#f59e0b',14)}).addTo(layers).bindPopup('Финиш');}
    if(d.roadRoute&&d.roadRoute.length>1){var rr=d.roadRoute.map(function(p){return [p.lat,p.lng]});L.polyline(rr,{color:'#22d3ee',weight:6,opacity:.95}).addTo(layers);bounds=bounds.concat(rr);}
    if(d.destination){var dc=[d.destination.lat,d.destination.lng];L.marker(dc,{icon:icon('#22d3ee',18)}).addTo(layers).bindPopup(d.destination.label||'Точка назначения');bounds.push(dc);}
    if(d.user){var uc=[d.user.lat,d.user.lng];L.marker(uc,{icon:icon('#67e8f9',16)}).addTo(layers).bindPopup('Вы здесь');bounds.push(uc);}
    (d.stations||[]).forEach(function(s){var m=L.marker([s.lat,s.lng],{icon:icon(s.fav?'#fbbf24':'#8b5cf6',12)}).addTo(layers).bindPopup(s.name);m.on('click',function(){post({type:'station',id:s.id})});});
    if(d.roadRoute&&d.roadRoute.length>1){map.fitBounds(L.latLngBounds(d.roadRoute.map(function(p){return [p.lat,p.lng]})),{padding:[60,60]});}
    else if(d.destination&&d.user){map.fitBounds(L.latLngBounds([[d.user.lat,d.user.lng],[d.destination.lat,d.destination.lng]]),{padding:[70,70]});}
    else if(d.user){map.setView([d.user.lat,d.user.lng],14);}
    else if(bounds.length>1){map.fitBounds(L.latLngBounds(bounds),{padding:[50,50]});}
    else if(d.center){map.setView([d.center.lat,d.center.lng],13);}
  }catch(e){post({type:'err',msg:String(e)});}
}
post({type:'ready'});
</script></body></html>`;

export function MapExplorerScreen() {
  const insets = useSafeAreaInsets();
  const { semantic, canvas } = useTheme();
  const { activeShift } = useShift();
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [rawStations, setRawStations] = useState<FuelStationMarker[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loadingFuel, setLoadingFuel] = useState(false);
  const [fuelError, setFuelError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [routeIsLive, setRouteIsLive] = useState(false);
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [roadRoute, setRoadRoute] = useState<RoadRoute | null>(null);

  const incomingUrl = ExpoLinking.useURL();
  const destination = useMemo(
    () => (incomingUrl ? parseGeoUri(incomingUrl) : null),
    [incomingUrl],
  );

  const loadFuel = useCallback(async (lat: number, lng: number) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoadingFuel(true);
    setFuelError(null);
    try {
      const rows = await fetchNearbyFuelStations(lat, lng, ac.signal);
      setRawStations(rows);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setFuelError("Не удалось загрузить АЗС (сеть или лимит).");
      setRawStations([]);
    } finally {
      setLoadingFuel(false);
    }
  }, []);

  useEffect(() => {
    void loadFuelFavoriteIds().then(setFavoriteIds);
  }, []);

  // Реальный маршрут смены (активная или последняя) — только настоящие GPS-точки.
  useEffect(() => {
    let alive = true;
    void (async () => {
      let shiftId = activeShift?.id ?? null;
      if (!shiftId) {
        const ids = await listGpsTripShiftIds();
        shiftId = ids[0] ?? null;
      }
      if (!shiftId) return;
      const session = await loadGpsTripSession(shiftId);
      if (!alive || !session || session.points.length < 2) return;
      const step = Math.max(1, Math.ceil(session.points.length / MAX_ROUTE_POINTS));
      setRoute(session.points.filter((_, i) => i % step === 0).map((p) => ({ lat: p.lat, lng: p.lng })));
      setRouteIsLive(Boolean(activeShift?.id));
    })();
    return () => {
      alive = false;
    };
  }, [activeShift?.id]);

  // Геолокация + заправки рядом.
  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({});
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserPos(p);
      void loadFuel(p.lat, p.lng);
    })();
    return () => abortRef.current?.abort();
  }, [loadFuel]);

  // Маршрут по дорогам до точки (OSRM); недоступен → null (карта покажет прямую).
  useEffect(() => {
    setRoadRoute(null);
    if (!destination || !userPos) return;
    const ac = new AbortController();
    void fetchRoadRoute(
      { latitude: userPos.lat, longitude: userPos.lng },
      { latitude: destination.lat, longitude: destination.lng },
      ac.signal,
    ).then(
      (r) => {
        if (!ac.signal.aborted) setRoadRoute(r);
      },
    );
    return () => ac.abort();
  }, [destination, userPos]);

  const mapData: MapData = useMemo(
    () => ({
      center: userPos ?? DEFAULT_CENTER,
      user: userPos,
      route,
      routeIsLive,
      destination: destination
        ? { lat: destination.lat, lng: destination.lng, label: destination.label }
        : null,
      roadRoute: roadRoute
        ? roadRoute.coords.map((c) => ({ lat: c.latitude, lng: c.longitude }))
        : destination && userPos
          ? [userPos, { lat: destination.lat, lng: destination.lng }]
          : null,
      stations: rawStations.map((s) => ({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        name: s.name,
        fav: favoriteIds.includes(s.id),
      })),
    }),
    [userPos, route, routeIsLive, destination, roadRoute, rawStations, favoriteIds],
  );

  // Пушим данные в карту при готовности и любом изменении.
  useEffect(() => {
    if (!ready) return;
    webRef.current?.injectJavaScript(`applyData(${JSON.stringify(mapData)});true;`);
  }, [ready, mapData]);

  const onMessage = useCallback(
    (raw: string) => {
      try {
        const m = JSON.parse(raw) as { type: string; id?: string };
        if (m.type === "ready") setReady(true);
        if (m.type === "station" && m.id) void toggleFuelFavoriteId(m.id).then(setFavoriteIds);
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const recenter = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return;
    const pos = await Location.getCurrentPositionAsync({});
    const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setUserPos(p);
    void loadFuel(p.lat, p.lng);
  };

  return (
    <View style={{ flex: 1, backgroundColor: canvas }}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: LEAFLET_HTML }}
        onMessage={(e) => onMessage(e.nativeEvent.data)}
        style={{ flex: 1, backgroundColor: "#0a0d0f" }}
        javaScriptEnabled
        domStorageEnabled
      />
      <View style={{ position: "absolute", top: insets.top + spacing.sm, left: spacing.md, right: spacing.md }}>
        <View
          style={{
            borderRadius: 16,
            backgroundColor: semantic.surface,
            borderWidth: 1,
            borderColor: semantic.borderStrong,
            padding: spacing.md,
          }}
        >
          <Text style={{ color: semantic.textPrimary, fontSize: 15, fontWeight: "800" }}>Карта Driver</Text>
          <Text style={{ color: semantic.textTertiary, fontSize: 11, marginTop: 6, lineHeight: 16 }}>
            {route.length >= 2
              ? routeIsLive
                ? "Маршрут текущей смены по GPS."
                : "Маршрут последней смены."
              : "Начните смену — маршрут появится по GPS."}{" "}
            Заправки — из OpenStreetMap.
          </Text>
          <Text style={{ color: semantic.textTertiary, fontSize: 9, marginTop: 4 }}>
            © OpenStreetMap · © CARTO
          </Text>
          {destination ? (
            <Text style={{ color: semantic.accent, fontSize: 12, marginTop: 8, fontWeight: "700" }}>
              Точка назначения{destination.label ? `: ${destination.label}` : ""}
              {roadRoute
                ? ` · ${(roadRoute.distanceMeters / 1000).toFixed(1)} км · ~${Math.max(1, Math.round(roadRoute.durationSec / 60))} мин по дорогам`
                : userPos
                  ? ` · ${(haversineMeters({ lat: userPos.lat, lng: userPos.lng }, { lat: destination.lat, lng: destination.lng }) / 1000).toFixed(1)} км по прямой`
                  : ""}
            </Text>
          ) : null}
          {roadRoute && roadRoute.steps.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              {roadRoute.steps.slice(0, 4).map((s, i) => (
                <Text key={`step_${i}`} style={{ color: semantic.textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                  {i + 1}. {s.instruction}
                  {s.distanceMeters >= 50 ? ` · ${Math.round(s.distanceMeters)} м` : ""}
                </Text>
              ))}
            </View>
          ) : null}
          {loadingFuel ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
              <ActivityIndicator color={semantic.accent} size="small" />
              <Text style={{ color: semantic.textSecondary, fontSize: 11 }}>Загрузка заправок…</Text>
            </View>
          ) : fuelError ? (
            <Text style={{ color: semantic.danger, fontSize: 11, marginTop: 8 }}>{fuelError}</Text>
          ) : (
            <Text style={{ color: semantic.accent, fontSize: 11, marginTop: 8 }}>
              АЗС: {rawStations.length} · избранное {favoriteIds.length}
            </Text>
          )}
          <Pressable
            onPress={() => userPos && void loadFuel(userPos.lat, userPos.lng)}
            style={{
              marginTop: 10,
              alignSelf: "flex-start",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: semantic.border,
            }}
          >
            <Text style={{ color: semantic.accent, fontSize: 11, fontWeight: "700" }}>Обновить АЗС</Text>
          </Pressable>
        </View>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + spacing.lg,
          right: spacing.md,
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        <Pressable
          onPress={() => void recenter()}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 14,
            backgroundColor: semantic.surface,
            borderWidth: 1,
            borderColor: semantic.borderStrong,
          }}
        >
          <Text style={{ color: semantic.accent, fontSize: 12, fontWeight: "800" }}>Я здесь</Text>
        </Pressable>
        <GradientButton title="Назад" variant="glass" onPress={() => router.back()} />
      </View>
    </View>
  );
}
