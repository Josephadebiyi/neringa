-- Removes everything created by seed_demo_dashboard_data.sql.
-- Only touches rows reachable from profiles tagged signup_source = 'demo_seed_20260714'.
-- Paste this whole block into your SQL editor when you're done with the screenshot.

do $$
declare
  demo_tag text := 'demo_seed_20260714';
  demo_ids uuid[];
  request_ids uuid[];
begin
  select array_agg(id) into demo_ids from public.profiles where signup_source = demo_tag;

  if demo_ids is null then
    raise notice 'No demo profiles found tagged %. Nothing to clean up.', demo_tag;
    return;
  end if;

  raise notice 'Found % demo profiles.', array_length(demo_ids, 1);

  select array_agg(id) into request_ids
  from public.shipment_requests
  where sender_id = any(demo_ids) or traveler_id = any(demo_ids);

  delete from public.shipment_ledgers where shipment_id = any(request_ids);
  delete from public.shipment_requests where id = any(request_ids);
  delete from public.packages where user_id = any(demo_ids);
  delete from public.trips where user_id = any(demo_ids);
  delete from public.wallet_accounts where user_id = any(demo_ids);
  delete from public.profiles where id = any(demo_ids);

  raise notice 'Demo data fully removed.';
end $$;
