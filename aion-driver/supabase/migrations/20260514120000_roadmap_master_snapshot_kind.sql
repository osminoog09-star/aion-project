-- Optional: publish a second public snapshot row for richer roadmap overlays.
-- Table public.ecosystem_public_snapshots already exists (ecosystem_platform_foundation).
-- Use kind = 'portal_roadmap_master' with the same JSON shape as portal_ecosystem / ecosystem-status.json
-- (validated by aion-project portal parseEcosystemStatusPayload). Subsystem rows merge by id over repo JSON + extensions.
--
-- Example (run in SQL editor with service role; adjust payload):
-- insert into public.ecosystem_public_snapshots (kind, payload, is_public)
-- values ('portal_roadmap_master', '{}'::jsonb, true);

comment on table public.ecosystem_public_snapshots is 'Public portal JSON payloads; kinds include portal_ecosystem, portal_roadmap_master (subsystem merge overlay), portal_releases.';
