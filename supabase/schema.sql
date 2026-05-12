-- Postcraft — Supabase Schema
-- Run this in the Supabase SQL editor for your project.

-- ============================================================
-- voice_profiles
-- One active profile per workspace. Stores tone, audience,
-- avoid-words, and per-platform notes used by the agent pipeline.
-- ============================================================
create table if not exists voice_profiles (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null,
  name             text not null,
  tone_descriptors text[]    default '{}',
  audience_description text  default '',
  avoid_words      text[]    default '{}',
  platform_notes   jsonb     default '{}',
  model_temp       numeric   default 0.7,
  is_active        boolean   default true,
  created_at       timestamptz default now()
);

create index if not exists voice_profiles_workspace_idx on voice_profiles (workspace_id, is_active, created_at desc);

-- ============================================================
-- exemplars
-- Gold-standard posts used as quality references by the eval agent.
-- is_gold_standard = true → shared across all workspaces.
-- ============================================================
create table if not exists exemplars (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid,
  platform         text not null check (platform in ('linkedin', 'twitter', 'instagram')),
  content_type     text not null default 'post',
  post_text        text not null,
  score_weighted   numeric,
  is_gold_standard boolean default false,
  is_active        boolean default true,
  created_at       timestamptz default now()
);

create index if not exists exemplars_workspace_idx on exemplars (workspace_id, is_active);
create index if not exists exemplars_gold_idx      on exemplars (is_gold_standard, is_active);

-- ============================================================
-- run_history
-- One row per /generate call. Stores inputs, outputs (JSON),
-- scores, and revision counts for future analysis / fine-tuning.
-- ============================================================
create table if not exists run_history (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid,
  voice_profile_id uuid references voice_profiles(id) on delete set null,
  brief_text       text,
  brief_url        text,
  outputs          jsonb,
  model_used       text,
  revision_count   integer default 0,
  status           text default 'completed',
  created_at       timestamptz default now()
);

create index if not exists run_history_workspace_idx on run_history (workspace_id, created_at desc);
