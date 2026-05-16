# AION Ecosystem — System Audit Report

**Phase:** STABILIZATION & RECOVERY  
**Date:** 2026-05-16  
**Scope:** Portal (`aion-com`), Driver (`aion-driver`), shared runtime, release pipeline  
**Priority:** Truth / Consistency / Reliability — not feature development

---

## Executive summary

AION is **partially operational**: local development and git-backed JSON give a coherent picture, but **production live state is fragmented** across build snapshots, optional Supabase, and device heartbeats that are not always read back. The portal can **advance runtime expectations** (field validation 8/8, OTA smoke, BG gate) while the **installed mobile build lags** (e.g. APK manifest **1.0.4** vs code/requirements **1.0.6**). That produced a **false operational state**: UI implied actionable validation on a build that cannot run those flows.

**Verdict:** SYSTEMIC ORCHESTRATION / RUNTIME RELIABILITY ISSUE — addressable via stabilization (this document) + release safety (partially implemented in commit `621b674`).

---

## 1. Working systems

| System | Evidence | Paths |
|--------|----------|-------|
| Execution runtime model (v2/v3) | Phases, timeline, heartbeats, validation matrix | `src/contracts/execution-runtime.ts`, `src/content/execution-runtime.json` |
| CLI runtime control | phase, heartbeat, action, autonomous-next | `scripts/execution-runtime.mjs`, `execution-action.mjs` |
| Owner-facing Russian UX | Phase/control copy, live panel | `src/lib/operations/execution-owner-ru.ts`, `LiveExecutionPanel.tsx` |
| Release safety (logic) | Semver + features + routes gate | `src/lib/shared/runtime-compatibility.ts`, `release-safety.ts` |
| Field validation (driver) | 8/8 checklist, FGS, merge state | `aion-driver/features/route/computeRouteFieldValidation.ts` |
| Driver CI | field-validation, economics, fgs, stop-zone, bg-gate | `aion-driver/package.json` `validate:code` |
| Deploy validation (HTTP) | post-deploy route checks | `scripts/post-deploy-validate.mjs` |
| Honest stale UI (recent) | build_snapshot banner, ai_stale | `LiveExecutionPanel.tsx` (after `6a5ed5f`) |
| SAFE MODE gating | Hides 8/8 when build incompatible | `ReleaseSafetyBanner.tsx`, `ReleaseSafetyGatedPanel.tsx` |

---

## 2. Partially broken systems

| System | Issue | Severity |
|--------|-------|----------|
| **Production live runtime** | Vercel reads git JSON unless Supabase + `execution:push-live` | CRITICAL |
| **Device heartbeat** | POST → Supabase; GET/release-safety read **only local JSON** (empty on prod) | CRITICAL |
| **Heartbeat → live sync** | `execution:heartbeat` / daemon do not call `execution-push-live` | HIGH |
| **Deployment status in UI** | Static import at build time, not live API | MEDIUM |
| **Device heartbeat cadence** | Once per cold start only | MEDIUM |
| **APK manifest** | `1.0.4` on portal vs `1.0.6` in driver source | CRITICAL |
| **Triple compatibility module** | 3 copies must be manually kept in sync | MEDIUM |
| **GH Actions vs deploy-pipeline** | CI does not mirror full local pipeline (runtime stamp, etc.) | MEDIUM |
| **continuous health semantics** | Can read “active” while heartbeat is hours old (mitigated by stale banner) | MEDIUM |

---

## 3. Fake / live mismatch

| Symptom | Root cause | Status |
|---------|------------|--------|
| “работа в процессе” with no real task | Default in `execution-action.mjs` / `execution-runtime.mjs` heartbeat | FIXED in action script; heartbeat default remains |
| Panel polls every 8s but data unchanged | `build_snapshot` on Vercel | MITIGATED (stale banner) |
| “AI ждёт вас” + 22h heartbeat | `waiting_approval` masked stale | FIXED (`ai_stale` priority) |
| Portal shows 8/8 checklist on incompatible APK | No release gate | FIXED (SAFE MODE) |
| Feed/i18n cite `execution-runtime-state.json` | File removed | OPEN (docs debt) |
| Ecosystem stub pages | Simulated modules | OK if labeled stubs |
| APK manifest proxy as “device” | `channel: preview-manifest`, empty features | BY DESIGN but must be labeled |

---

## 4. Stale risks

| Source | TTL / rule | Recovery |
|--------|------------|----------|
| `heartbeatAt` | >60s → health `stale` | `execution-stale-recover.mjs` (local only) |
| `build_snapshot` | Until next git deploy | `execution-push-live` + Supabase |
| `deployment-status.json` | Until next build | No auto-refresh |
| `device-build-heartbeat.json` | Often `null` in repo | Device POST |
| OTA on old runtime | channel/runtime mismatch | New APK or compatible OTA |
| Mandate `endsAt` | Wall clock | Manual extension script |

---

## 5. Runtime risks

- **No formal transition guard** — any phase can be written by scripts without validation (mitigation: `runtime-state-machine.ts` added in stabilization).
- **Autonomous loop in chat** — background `execution:runtime-loop` freezes Cursor (policy: do not run during owner-visible sessions).
- **Orchestrator resets progress** — `execution-autonomous-next` can drop progress % (observed 99→52).
- **Blocker vs phase drift** — `blocked` task text can disagree with `waiting_approval` phase.
- **Single-writer ambiguity** — git commit, Supabase push, and PATCH API can race.

---

## 6. Release risks

| Risk | Mitigation |
|------|------------|
| Portal ahead of mobile | `portal-runtime-requirements.json` + SAFE MODE |
| OTA-only after native change | `aion-driver/scripts/detect-native-change.mjs` |
| Manifest not synced after EAS | `release:apk-manifest:sync`, `release-safety-pipeline.mjs` |
| `build-manifest.json` drift | `npm run build:manifest` (not in validate yet) |
| Runtime activation before compatible APK | Pipeline step 3 fails if manifest < min |

**Current blocker:** Install **preview APK ≥1.0.6** (vc10), sync manifest, device heartbeat.

---

## 7. Security risks

| Area | Notes |
|------|-------|
| `OPERATIONS_OWNER_SECRET` | Gates PATCH, live-sync, field-validation POST — must stay ≥16 chars, not in git |
| `OPERATIONS_SUPABASE_SERVICE_ROLE_KEY` | Server-only; powers live snapshots |
| Device heartbeat POST | **Unauthenticated** — acceptable for build telemetry; rate-limit recommended |
| Agent key header | `x-aion-agent-key` for automation |

---

## 8. Reliability risks

- Supabase optional → silent degradation to snapshot mode.
- No append-only **event log** for audit trail (added: `runtime-event-log.json` + API).
- No centralized **operational dashboard** (partial: `/operations/live`, `/operations/deployment`).
- Driver errors / OTA failures not aggregated to portal telemetry.

---

## 9. Critical blockers (ordered)

1. **Mobile build desync** — APK 1.0.4 vs portal min 1.0.6 → user cannot run validation (SAFE MODE active).
2. **Live truth layer incomplete** — Supabase env on Vercel + push-live on every heartbeat/action.
3. **Device heartbeat read path** — Supabase write without read on GET (fix in stabilization).
4. **EAS preview build + manifest sync** — operational, not code-only.
5. **Stale documentation** — `execution-runtime-state.json` references.

---

## 10. Architecture debt

| Debt | Recommendation |
|------|----------------|
| Multiple SoT for runtime | **Authoritative:** Supabase `portal_execution_runtime_live`; fallback: git JSON |
| Static deployment in bundle | Expose `/api/deployment-status` live |
| Duplicated compatibility TS | Single package or CI hash sync test |
| 15+ execution scripts | Document matrix in this repo; deprecate unused |
| Feed as narrative SoT | Feed = audit only, not live status |
| Legacy `state` key in JSON | Already normalized on read |

---

## 11. Sources of truth matrix

| Domain | Live (when configured) | Fallback | Consumer |
|--------|------------------------|----------|----------|
| AI execution | Supabase `portal_execution_runtime_live` | `execution-runtime.json` | `/api/execution-runtime` |
| Device build | Supabase `portal_device_build_heartbeat` | `device-build-heartbeat.json` | `/api/operations/device-heartbeat` |
| APK channel | EAS → `apk-manifest.preview.json` | — | `/releases`, release-safety |
| Portal requirements | `portal-runtime-requirements.json` | — | release-safety |
| Priorities | FS + optional Supabase | — | `/api/strategic-priorities` |
| Deployment | `deployment-status.json` (build-time) | — | Live panel import |

---

## 12. Stabilization roadmap (implementation status)

### Phase 1 — Full system audit ✅
This document (`docs/system-audit-report.md`).

### Phase 2 — Autonomous release orchestration ✅ (baseline)
| Component | Path |
|-----------|------|
| Release intelligence | `src/lib/operations/release-intelligence.ts` |
| Mandatory orchestrator | `scripts/release-orchestrator.mjs` → `npm run release:orchestrate` |
| Release safety pipeline | `scripts/release-safety-pipeline.mjs` |
| Governance gate (CLI) | `scripts/execution-governance-gate.mjs` — wired into `execution-runtime.mjs` |
| Orchestration state | `src/content/release-orchestration-state.json` |

**Still operational (human):** EAS preview build ≥1.0.6, `release:apk-manifest:sync`, device install.

### Phase 3 — Runtime governance ✅ (baseline)
| Component | Path |
|-----------|------|
| Formal state machine | `runtime-state-machine.ts` |
| Governance layer | `runtime-governance.ts` (activation + validation gates) |
| Watchdog / stale | `runtime-watchdog.ts` |
| Transition enforcement | `execution-governance-gate.mjs` on phase change |

Canonical governance phases map to execution phases (`testing`→`validating`, `stale`→`recovering`, etc.).

### Phase 4 — Autonomous recovery ✅ (baseline)
| Flow | Command |
|------|---------|
| Runtime stale | `npm run runtime:recover` |
| Release incompatible | `node scripts/runtime-recovery.mjs --mode release` |
| Deploy failed | `node scripts/runtime-recovery.mjs --mode deploy` |
| Stale detect | `execution-stale-recover.mjs` |

### Phase 5 — Observability ✅ (baseline)
| Component | Path |
|-----------|------|
| Event sourcing | `runtime-event-log.ts` + `runtime-event-log.json` |
| Unified dashboard | `/operations/governance` + `GET /api/operations/governance` |
| Live panel | `/operations/live` (stale banner, SAFE MODE) |

**Gaps:** Sentry bridge; live `/api/deployment-status`; CI status feed.

### Phase 6 — Engineering governance ✅
| Component | Path |
|-----------|------|
| Cursor rule | `.cursor/rules/aion-engineering-governance.mdc` |
| No fake states policy | Enforced in UI + scripts |
| SAFE MODE | `ReleaseSafetyGatedPanel` |

### Post-stabilization exit ⏳ BLOCKED ON APK
No autonomous feature expansion until §14 sign-off criteria are met.

**Runbook:** `docs/stabilization-signoff-runbook.md`  
**Automated check:** `npm run stabilization:signoff` → `src/content/stabilization-signoff-status.json`

---

## 13. Operational commands (stabilization)

```bash
# Portal
cd aion-com
npm run test:runtime-compatibility
npm run release:safety          # fails until APK manifest >= requirements
npm run execution:push-live     # needs OPERATIONS_OWNER_SECRET
npm run stabilization:verify    # audit + compatibility + build

# Driver
cd aion-driver
npm run build:manifest
npm run validate:code
npm run native:check            # before OTA-only release
```

---

## 14. Sign-off criteria (exit stabilization)

- [ ] Vercel: `OPERATIONS_SUPABASE_SERVICE_ROLE_KEY` + live push verified
- [ ] `/api/execution-runtime` returns `persistedVia: supabase_live` with heartbeat <60s during active work
- [ ] `apk-manifest.preview.json` runtime ≥ `portal-runtime-requirements.json`
- [ ] Physical device: heartbeat POST + compatibility `compatible: true`
- [ ] Field validation 8/8 achievable on device
- [ ] No CRITICAL items open in §9
- [ ] SAFE MODE off on `/operations/live`

---

## 15. System Reliability Layer — automation & recovery gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| EAS build not auto-triggered in CI | HIGH | `release:orchestrate --trigger-eas` needs `EXPO_TOKEN` + manual sync |
| Device heartbeat read on Vercel SSR | MEDIUM | Supabase read path added; env must be set |
| Deploy rollback not automated | MEDIUM | `runtime-recovery --mode deploy` marks blocked only |
| GH Actions ≠ `release-orchestrator` | MEDIUM | Wire workflow to `npm run release:orchestrate` |
| Periodic driver heartbeat | MEDIUM | Only cold-start today |
| Triple `runtime-compatibility.ts` | MEDIUM | CI hash sync test still missing |
| Event log not in Supabase | LOW | JSON file only — not multi-writer safe |

**Recovery paths (implemented):**

```bash
npm run runtime:recover              # stale → recovering → heal → push-live
npm run release:orchestrate          # full gate chain
node scripts/runtime-recovery.mjs --mode release   # block incompatible rollout
```

**Dashboard:** https://aion-com.vercel.app/operations/governance (after deploy)

---

*Generated as part of STABILIZATION phase. Update this file when blockers close.*
