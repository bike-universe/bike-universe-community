create extension if not exists postgis;
create extension if not exists pgcrypto;

create type public.place_status as enum ('pending','published','rejected');
create type public.claim_status as enum ('pending','approved','rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  club_member boolean not null default false,
  organizer boolean not null default false,
  admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text,
  premium_default boolean not null default false
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  city text,
  country text,
  address text,
  location geography(point,4326) not null,
  is_premium boolean not null default false,
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  status public.place_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index places_location_gix on public.places using gist(location);
create index places_status_idx on public.places(status);

create table public.place_photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check(rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  unique(place_id,user_id)
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,place_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  meeting_location geography(point,4326),
  city text,
  country text,
  distance_km numeric(7,2),
  elevation_m int,
  difficulty text,
  bike_types text[],
  status public.place_status not null default 'published',
  created_at timestamptz not null default now()
);
create index events_meeting_location_gix on public.events using gist(meeting_location);

create table public.event_participants (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(event_id,user_id)
);

create table public.business_claims (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.claim_status not null default 'pending',
  proof text,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check(kind in ('club','business')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  stripe_payment_id text,
  created_at timestamptz not null default now()
);

insert into public.categories(name,slug,icon,premium_default) values
('Hidden Gems','hidden-gems','📍',true),
('Cafés','cafes','☕',false),
('Shops','shops','🛒',false),
('Repair','repair','🔧',false),
('Rental','rental','🚲',false),
('Clubs','clubs','👥',false)
on conflict do nothing;

alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.place_photos enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.business_claims enable row level security;
alter table public.subscriptions enable row level security;
alter table public.promotions enable row level security;

create policy "public profiles readable" on public.profiles for select using (true);
create policy "own profile update" on public.profiles for update using (auth.uid()=id);
create policy "published places readable" on public.places for select using (status='published');
create policy "users add places" on public.places for insert to authenticated with check (owner_id=auth.uid());
create policy "owners update own places" on public.places for update to authenticated using (owner_id=auth.uid());
create policy "reviews readable" on public.reviews for select using (true);
create policy "users create reviews" on public.reviews for insert to authenticated with check (user_id=auth.uid());
create policy "own favorites" on public.favorites for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "published events readable" on public.events for select using (status='published');
create policy "organizers create events" on public.events for insert to authenticated with check (organizer_id=auth.uid());
create policy "own event participation" on public.event_participants for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "own claims" on public.business_claims for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "own subscriptions readable" on public.subscriptions for select to authenticated using (user_id=auth.uid());
create policy "own promotions readable" on public.promotions for select to authenticated using (user_id=auth.uid());

-- IMPORTANT: Premium location coordinates should eventually be served through a secure RPC/view
-- that returns exact coordinates only to active Club members. Do not rely on hiding pins in the UI.
