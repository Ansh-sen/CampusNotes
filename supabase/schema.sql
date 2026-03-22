-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  university text,
  major text,
  year text,
  avatar_url text,
  bio text,
  rating_avg numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LISTINGS
create table public.listings (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  course_code text,
  subject text,
  description text,
  price numeric not null,
  condition text,
  type text default 'Notes', -- 'Notes' or 'Tutoring'
  images text[] default '{}',
  status text default 'available', -- 'available', 'sold', 'draft'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CONVERSATIONS
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  last_message_at timestamp with time zone default timezone('utc'::text, now()),
  unique (listing_id, buyer_id)
);

-- MESSAGES
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read_status boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REVIEWS
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete set null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) Policies Setup
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- Profile Policies
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Listing Policies
create policy "Listings are viewable by everyone" on public.listings for select using (true);
create policy "Users can insert own listings" on public.listings for insert with check (auth.uid() = seller_id);
create policy "Users can update own listings" on public.listings for update using (auth.uid() = seller_id);
create policy "Users can delete own listings" on public.listings for delete using (auth.uid() = seller_id);

-- Conversation Policies
create policy "Users can view their conversations" on public.conversations for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Users can insert conversations" on public.conversations for insert with check (auth.uid() = buyer_id);

-- Message Policies
create policy "Users can view messages in their conversations" on public.messages for select 
  using (exists (
    select 1 from public.conversations c 
    where c.id = messages.conversation_id 
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  ));
create policy "Users can insert messages in their conversations" on public.messages for insert 
  with check (auth.uid() = sender_id and exists (
    select 1 from public.conversations c 
    where c.id = messages.conversation_id 
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  ));

-- Review Policies
create policy "Reviews are viewable by everyone" on public.reviews for select using (true);
create policy "Users can insert reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);

-- Realtime subscriptions
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
