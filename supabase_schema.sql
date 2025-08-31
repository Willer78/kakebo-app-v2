-- Movements table
create table if not exists public.movements (
  id uuid primary key,
  user_id uuid not null,
  date date not null,
  amount numeric not null,
  kind text not null check (kind in ('spesa','entrata','mutuo')),
  macro text,
  category text,
  note text,
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.movements enable row level security;

-- Policies: owner-only
create policy "Individuals can read own"
  on public.movements for select
  using ( auth.uid() = user_id );

create policy "Individuals can insert own"
  on public.movements for insert
  with check ( auth.uid() = user_id );

create policy "Individuals can update own"
  on public.movements for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "Individuals can delete own"
  on public.movements for delete
  using ( auth.uid() = user_id );
