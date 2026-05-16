import { NextResponse } from "next/server";
import { writeFileSync } from "node:fs";
import path from "node:path";
import type { DeviceBuildInfo } from "@/lib/shared/runtime-compatibility";
import { evaluateReleaseSafetyAsync } from "@/lib/operations/release-safety";
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
    safety,
  });
}

export async function POST(req: Request) {
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

  if (process.env.OPERATIONS_SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.OPERATIONS_SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
      );
      const kind = "portal_device_build_heartbeat";
      const row = {
        kind,
        payload: record,
        is_public: true,
        updated_at: at,
      };
      const { data: existing } = await supabase
        .from("ecosystem_public_snapshots")
        .select("id")
        .eq("kind", kind)
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        await supabase.from("ecosystem_public_snapshots").update(row).eq("id", existing.id);
      } else {
        await supabase.from("ecosystem_public_snapshots").insert(row);
      }
    } catch {
      /* optional */
    }
  }

  const safety = await evaluateReleaseSafetyAsync();

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

  return NextResponse.json({ ok: true, at, safety });
}
