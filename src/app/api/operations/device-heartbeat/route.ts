import { NextResponse } from "next/server";
import { writeFileSync } from "node:fs";
import path from "node:path";
import type { DeviceBuildInfo } from "@/lib/shared/runtime-compatibility";
import { evaluateReleaseSafetyAsync } from "@/lib/operations/release-safety";
import { persistDeviceHeartbeatToSupabase } from "@/lib/operations/persist-device-heartbeat";
import { appendRuntimeEvent } from "@/lib/operations/runtime-event-log";
import { writeExecutionRuntimeToSupabase } from "@/lib/operations/execution-runtime-live-persist";
import { getLocalExecutionRuntime } from "@/lib/execution-runtime";

export const runtime = "nodejs";

const HEARTBEAT_FILE = path.join(process.cwd(), "src/content/device-build-heartbeat.json");

type Body = { device: DeviceBuildInfo };

export async function GET() {
  const safety = await evaluateReleaseSafetyAsync();
  return NextResponse.json({
    meta: { kind: "device_build_heartbeat" },
    lastDeviceHeartbeat: safety.lastDeviceHeartbeat,
    safety,
  });
}

export async function POST(req: Request) {
  try {
    return await handleDeviceHeartbeatPost(req);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[device-heartbeat] POST failed:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

async function handleDeviceHeartbeatPost(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.device?.runtimeVersion || !body.device?.appVersion) {
    return NextResponse.json(
      { ok: false, error: "device.appVersion and device.runtimeVersion required" },
      { status: 400 },
    );
  }

  const at = new Date().toISOString();
  const record = { at, device: body.device };
  const allowFs = process.env.OPERATIONS_ALLOW_FS_WRITE !== "0";

  if (allowFs && !process.env.VERCEL) {
    writeFileSync(HEARTBEAT_FILE, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  }

  const supabasePersisted = await persistDeviceHeartbeatToSupabase(record);

  const safety = await evaluateReleaseSafetyAsync();

  try {
    appendRuntimeEvent(
      "device_heartbeat",
      `Device ${body.device.appVersion} rv ${body.device.runtimeVersion}`,
      { features: body.device.features?.length ?? 0 },
    );
    if (safety.safeMode) {
      appendRuntimeEvent("safe_mode_entered", safety.headlineRu, {
        runtime: body.device.runtimeVersion,
      });
    }
    if (!safety.compatibility.compatible) {
      appendRuntimeEvent("compatibility_failed", safety.detailRu, {
        required: safety.requirements.minRuntimeVersion,
        actual: body.device.runtimeVersion,
      });
    }
  } catch (e) {
    console.error("[device-heartbeat] runtime event log:", e);
  }

  if (allowFs && !process.env.VERCEL) {
    try {
      const doc = getLocalExecutionRuntime();
      doc.runtime = {
        ...doc.runtime,
        heartbeatAt: at,
        updatedAt: at,
        validationProgress: safety.compatibility.compatible
          ? doc.runtime.validationProgress
          : `SAFE MODE: ${safety.headlineRu}`,
        blocker: safety.safeMode
          ? "Driver build incompatible with portal runtime"
          : doc.runtime.blocker,
      };
      writeFileSync(
        path.join(process.cwd(), "src/content/execution-runtime.json"),
        `${JSON.stringify(doc, null, 2)}\n`,
        "utf8",
      );
      await writeExecutionRuntimeToSupabase(doc);
    } catch {
      /* best effort */
    }
  }

  return NextResponse.json({ ok: true, at, supabasePersisted, safety });
}
