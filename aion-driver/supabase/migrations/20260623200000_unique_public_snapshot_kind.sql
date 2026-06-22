-- Each portal snapshot kind is a singleton document. Keep the newest legacy row
-- before enforcing the invariant so this migration is safe on existing projects.
delete from public.ecosystem_public_snapshots as older
using public.ecosystem_public_snapshots as newer
where older.kind = newer.kind
  and (
    older.updated_at < newer.updated_at
    or (older.updated_at = newer.updated_at and older.id < newer.id)
  );

create unique index if not exists ecosystem_public_snapshots_kind_uidx
  on public.ecosystem_public_snapshots (kind);
