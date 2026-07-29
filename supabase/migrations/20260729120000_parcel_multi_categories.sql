-- Parcels can hold several kinds of items at once — category becomes a
-- multi-select array, mirroring trips.categories.

alter table public.parcels add column categories text[];
update public.parcels set categories = array[category];
alter table public.parcels alter column categories set not null;
alter table public.parcels add constraint parcels_categories_check check (
  categories <> '{}'
  and categories <@ array['documents','clothing','electronics','food',
                          'medicine','gifts','books','cosmetics','baby',
                          'shoes','other']::text[]
);
alter table public.parcels drop column category;
