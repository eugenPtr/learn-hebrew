-- Cosine-distance vector search across vocabulary_items.
-- Returns the top-N most semantically similar items to the query embedding,
-- skipping rows that have no embedding yet (e.g. legacy items pre-enrichment).
create or replace function match_vocabulary_items(
  query_embedding vector(384),
  match_count int default 20
)
returns table (
  id uuid,
  hebrew text,
  english text,
  pos pos_enum,
  gender gender_enum,
  binyan binyan_enum,
  conjugations jsonb,
  root text,
  similarity float
)
language sql stable as $$
  select
    v.id,
    v.hebrew,
    v.english,
    v.pos,
    v.gender,
    v.binyan,
    v.conjugations,
    v.root,
    1 - (v.embedding <=> query_embedding) as similarity
  from vocabulary_items v
  where v.embedding is not null
  order by v.embedding <=> query_embedding
  limit match_count;
$$;
