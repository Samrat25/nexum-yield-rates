-- Nexum Protocol Database Schema for Supabase

-- 1. Positions table
create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  user_address text not null,
  pt_token_id text not null,
  tenor_days integer not null,
  pt_amount numeric not null,
  locked_apr numeric not null,
  tx_hash text not null,
  status text not null check (status in ('active', 'redeemed', 'matured')),
  maturity_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- 2. Transactions table
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  tx_hash text not null unique,
  user_address text not null,
  type text not null check (type in ('MINT_INTENT', 'REDEEM', 'SWAP_XLM_MINT')),
  amount_usdc numeric not null,
  amount_xlm numeric,
  pt_amount numeric not null,
  locked_apr numeric not null,
  tenor_days integer not null,
  status text not null check (status in ('success', 'reverted', 'failed')),
  created_at timestamp with time zone default now()
);

-- 3. Quotes telemetry table
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_address text not null,
  input_asset text not null check (input_asset in ('USDC', 'XLM')),
  input_amount numeric not null,
  target_apr numeric not null,
  tenor_days integer not null,
  implied_apr numeric not null,
  pt_amount numeric not null,
  achievable boolean not null,
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_positions_user on public.positions(user_address);
create index if not exists idx_transactions_user on public.transactions(user_address);
create index if not exists idx_quotes_user on public.quotes(user_address);

-- Row Level Security (RLS) policies
alter table public.positions enable row level security;
alter table public.transactions enable row level security;
alter table public.quotes enable row level security;

create policy "Allow anonymous read & insert on positions" on public.positions for all using (true) with check (true);
create policy "Allow anonymous read & insert on transactions" on public.transactions for all using (true) with check (true);
create policy "Allow anonymous insert on quotes" on public.quotes for all using (true) with check (true);
