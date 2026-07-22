-- Final security sweep.
--
-- Migrations are executed alphabetically and several tables are created after
-- enable_rls_all_tables.sql.  Enabling RLS from a fixed list therefore leaves
-- newer tables exposed through Supabase's Data API.  Keep this file sorted last
-- and secure every ordinary/partitioned table that currently exists in public.
--
-- The application uses a direct Postgres connection for server-side access, so
-- it does not depend on anon/authenticated Data API access to these tables.

DO $security$
DECLARE
  table_record record;
BEGIN
  FOR table_record IN
    SELECT c.oid::regclass AS qualified_name
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND NOT c.relrowsecurity
  LOOP
    EXECUTE format(
      'ALTER TABLE %s ENABLE ROW LEVEL SECURITY',
      table_record.qualified_name
    );
  END LOOP;
END
$security$;

-- Fail the migration if any public API table is still missing RLS.  This turns
-- future schema drift into a deployment error instead of a silent exposure.
DO $verification$
DECLARE
  unsecured_tables text;
BEGIN
  SELECT string_agg(format('%I.%I', n.nspname, c.relname), ', ' ORDER BY c.relname)
  INTO unsecured_tables
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
    AND NOT c.relrowsecurity;

  IF unsecured_tables IS NOT NULL THEN
    RAISE EXCEPTION 'RLS is disabled on public tables: %', unsecured_tables;
  END IF;
END
$verification$;
