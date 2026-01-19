-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS Table
create table users (
  id uuid references auth.users not null primary key,
  email text,
  stripe_customer_id text,
  subscription_status text check (subscription_status in ('active', 'trialing', 'canceled', 'past_due', 'unpaid')),
  trial_end_date timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- VIDEOS Table
create table videos (
  id uuid default uuid_generate_v4() primary key,
  yt_video_id text unique not null,
  title text not null,
  summary_json jsonb,
  published_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- DELIVERY_LOGS Table
create table delivery_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) not null,
  video_id uuid references videos(id) not null,
  sent_at timestamp with time zone default now()
);

-- RLS Policies
alter table users enable row level security;
alter table videos enable row level security;
alter table delivery_logs enable row level security;

-- Policies for USERS
-- Service Role can do anything (handled by Supabase service_role key)
-- Users can view their own data
create policy "Users can view own data" on users
  for select using (auth.uid() = id);

-- Policies for VIDEOS
-- Public read access (or restricted to active subscribers? For now, public read for simpler logic in dashboard, refined later)
create policy "Videos are viewable by everyone" on videos
  for select using (true);

-- Policies for DELIVERY_LOGS
-- Users generally don't need to see this, mainly for backend. But maybe for debugging.
create policy "Users can view own logs" on delivery_logs
  for select using (auth.uid() = user_id);
