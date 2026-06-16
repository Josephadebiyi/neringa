ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS trip_number TEXT;

WITH numbered AS (
  SELECT
    id,
    LPAD((ROW_NUMBER() OVER (ORDER BY created_at, id))::TEXT, 4, '0') AS generated_number
  FROM public.trips
  WHERE trip_number IS NULL OR trip_number = ''
)
UPDATE public.trips t
SET trip_number = numbered.generated_number
FROM numbered
WHERE t.id = numbered.id;

CREATE SEQUENCE IF NOT EXISTS public.trips_trip_number_seq
  AS INTEGER
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 9999
  NO CYCLE;

SELECT setval(
  'public.trips_trip_number_seq',
  GREATEST(
    1,
    COALESCE((
      SELECT MAX(NULLIF(regexp_replace(trip_number, '[^0-9]', '', 'g'), '')::INT)
      FROM public.trips
    ), 0) + 1
  ),
  false
);

CREATE UNIQUE INDEX IF NOT EXISTS trips_trip_number_unique
  ON public.trips (trip_number)
  WHERE trip_number IS NOT NULL;
