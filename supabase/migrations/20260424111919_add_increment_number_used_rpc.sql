create or replace function increment_number_used(item_ids uuid[])
returns void
language sql
as $$
  update vocabulary_items
  set number_used = number_used + 1
  where id = any(item_ids);
$$;
