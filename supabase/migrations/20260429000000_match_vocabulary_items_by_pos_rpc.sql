-- Per-POS cosine-distance vector search.
-- Returns the top-N most similar items per part-of-speech category,
-- excluding phrase POS and items without embeddings.
create or replace function match_vocabulary_items_by_pos(
  query_embedding vector(384),
  match_count_per_pos int default 8
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
  with ranked as (
    select
      v.id,
      v.hebrew,
      v.english,
      v.pos,
      v.gender,
      v.binyan,
      v.conjugations,
      v.root,
      1 - (v.embedding <=> query_embedding) as similarity,
      row_number() over (
        partition by v.pos
        order by v.embedding <=> query_embedding
      ) as rn
    from vocabulary_items v
    where v.embedding is not null
      and v.pos is not null
      and v.pos != 'phrase'
  )
  select id, hebrew, english, pos, gender, binyan, conjugations, root, similarity
  from ranked
  where rn <= match_count_per_pos;
$$;
