import AsyncStorage from "@react-native-async-storage/async-storage";

const OFFLINE = "@aion/ota_test_simulate_offline";
const FAIL_ONCE = "@aion/ota_test_simulate_fetch_fail_once";

export async function getOtaSimulateOffline(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(OFFLINE)) === "1";
  } catch {
    return false;
  }
}

export async function setOtaSimulateOffline(value: boolean): Promise<void> {
  if (value) await AsyncStorage.setItem(OFFLINE, "1");
  else await AsyncStorage.removeItem(OFFLINE);
}

/** Одноразовый сбой fetchUpdate (для UI ошибки). */
export async function consumeOtaSimulateFetchFailOnce(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(FAIL_ONCE);
    if (v !== "1") return false;
    await AsyncStorage.removeItem(FAIL_ONCE);
    return true;
  } catch {
    return false;
  }
}

export async function setOtaSimulateFetchFailOnce(): Promise<void> {
  await AsyncStorage.setItem(FAIL_ONCE, "1");
}
