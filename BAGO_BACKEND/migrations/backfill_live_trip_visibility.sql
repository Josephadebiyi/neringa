alter table public.trips
  add column if not exists travel_document_verified boolean default false;

update public.trips
set travel_document_verified = true,
    updated_at = timezone('utc', now())
where status in ('active', 'verified', 'approved', 'live')
  and coalesce(travel_document_verified, false) = false;
