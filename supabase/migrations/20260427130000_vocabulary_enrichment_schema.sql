-- Enable pgvector for embeddings
create extension if not exists vector;

-- Enums for grammatical metadata
do $$ begin
  create type pos_enum as enum (
    'noun', 'verb', 'adjective', 'adverb',
    'preposition', 'conjunction', 'pronoun', 'phrase', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type gender_enum as enum ('masculine', 'feminine');
exception when duplicate_object then null; end $$;

do $$ begin
  create type binyan_enum as enum (
    'paal', 'nifal', 'piel', 'pual', 'hitpael', 'hifil', 'hufal'
  );
exception when duplicate_object then null; end $$;

-- Add grammatical and embedding columns to vocabulary_items
alter table vocabulary_items
  add column if not exists pos pos_enum,
  add column if not exists gender gender_enum,
  add column if not exists binyan binyan_enum,
  add column if not exists conjugations jsonb,
  add column if not exists root text,
  add column if not exists embedding vector(384);

-- Themes
create table if not exists themes (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text not null,
  embedding vector(384) not null,
  created_at timestamptz not null default now()
);

-- Generated sentences (only persisted when rated)
create table if not exists generated_sentences (
  id uuid primary key default gen_random_uuid(),
  english text not null,
  hebrew text not null,
  item_ids uuid[] not null,
  theme_id uuid references themes(id) on delete set null,
  rating text not null check (rating in ('up', 'down')),
  feedback text,
  created_at timestamptz not null default now()
);

-- ivfflat indexes for cosine similarity search
create index if not exists vocabulary_items_embedding_idx
  on vocabulary_items
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists themes_embedding_idx
  on themes
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
