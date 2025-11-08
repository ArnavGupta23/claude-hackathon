-- LinkUp Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor to set up the database schema

-- Create profiles table
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  name text,
  major text,
  interests text[],
  bio text,
  nfc_tag text unique,
  latitude double precision,
  longitude double precision,
  last_seen timestamp default now(),
  created_at timestamp default now()
);

-- Create connections table
create table connections (
  id serial primary key,
  user_a uuid references profiles(id),
  user_b uuid references profiles(id),
  connected_at timestamp default now(),
  unique(user_a, user_b)
);

-- Create index for faster lookups
create index idx_connections_user_a on connections(user_a);
create index idx_connections_user_b on connections(user_b);
create index idx_profiles_nfc_tag on profiles(nfc_tag);
create index idx_profiles_location on profiles(latitude, longitude);
create index idx_profiles_last_seen on profiles(last_seen);

-- Enable Row Level Security (optional, for production)
alter table profiles enable row level security;
alter table connections enable row level security;

-- Create policies for public access (adjust for your security needs)
-- For development/demo: allow all operations
create policy "Profiles are viewable by everyone" 
  on profiles for select using (true);

create policy "Profiles are insertable by everyone" 
  on profiles for insert with check (true);

create policy "Profiles are updatable by everyone" 
  on profiles for update using (true);

create policy "Connections are viewable by everyone" 
  on connections for select using (true);

create policy "Connections are insertable by everyone" 
  on connections for insert with check (true);

-- For production, you might want more restrictive policies:
-- Example: Users can only update their own profile
-- create policy "Users can update own profile" 
--   on profiles for update 
--   using (auth.uid() = id);

