-- Already applied manually in Supabase on 2026-08-30.
-- Kept here so the repository matches production schema.
alter table public.categories
add column if not exists parent_id bigint
references public.categories(id)
on delete cascade;

create index if not exists categories_parent_id_idx
on public.categories(parent_id);
