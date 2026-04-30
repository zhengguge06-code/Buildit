-- Fix auth user deletion failures caused by public-table foreign keys.
-- Run this once in the Supabase / MemFire SQL editor.
--
-- Behavior after this migration:
-- - Deleting an auth user deletes that user's tool_submissions rows.
-- - Published tools are preserved, but their user_id is set to null.
-- - Admin permission rows for the deleted auth user are removed.
-- - Historical granted_by values are set to null if the granting admin is deleted.

begin;

alter table if exists public.tool_submissions
  drop constraint if exists tool_submissions_user_id_fkey;

alter table if exists public.tool_submissions
  add constraint tool_submissions_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

alter table if exists public.tools
  alter column user_id drop not null;

alter table if exists public.tools
  drop constraint if exists tools_user_id_fkey;

alter table if exists public.tools
  add constraint tools_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete set null;

do $$
begin
  if to_regclass('public.ai_tools') is not null then
    alter table public.ai_tools
      alter column user_id drop not null;

    alter table public.ai_tools
      drop constraint if exists ai_tools_user_id_fkey;

    alter table public.ai_tools
      add constraint ai_tools_user_id_fkey
      foreign key (user_id)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

do $$
begin
  if to_regclass('public.admin_users') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'admin_users'
        and column_name = 'user_id'
    )
  then
    alter table public.admin_users
      drop constraint if exists admin_users_user_id_fkey;

    alter table public.admin_users
      add constraint admin_users_user_id_fkey
      foreign key (user_id)
      references auth.users(id)
      on delete cascade;
  end if;

  if to_regclass('public.admin_users') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'admin_users'
        and column_name = 'granted_by'
    )
  then
    alter table public.admin_users
      drop constraint if exists admin_users_granted_by_fkey;

    alter table public.admin_users
      add constraint admin_users_granted_by_fkey
      foreign key (granted_by)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

commit;
