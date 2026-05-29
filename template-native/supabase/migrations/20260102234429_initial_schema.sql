-- DailyDash Initial Schema
-- Tables: profiles, todos, schedules, schedule_tasks, daily_progress

-- ============================================================================
-- PROFILES (linked to Supabase auth.users)
-- ============================================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- TODOS
-- ============================================================================
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  notes text,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  due_at timestamptz,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists todos_user_id_idx on todos(user_id);
create index if not exists todos_scheduled_at_idx on todos(scheduled_at);

-- ============================================================================
-- SCHEDULES (recurring daily routines)
-- ============================================================================
create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  emoji text,
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists schedules_user_id_idx on schedules(user_id);

-- ============================================================================
-- SCHEDULE TASKS (tasks within a schedule)
-- ============================================================================
create table if not exists schedule_tasks (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references schedules(id) on delete cascade not null,
  title text not null,
  time time not null,
  duration integer, -- minutes
  category text check (category in ('health', 'fitness', 'work', 'finance', 'personal', 'other')),
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists schedule_tasks_schedule_id_idx on schedule_tasks(schedule_id);

-- ============================================================================
-- DAILY PROGRESS (track task completion per day)
-- ============================================================================
create table if not exists daily_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  schedule_id uuid references schedules(id) on delete cascade not null,
  task_id uuid references schedule_tasks(id) on delete cascade not null,
  date date not null,
  status text check (status in ('pending', 'completed', 'skipped')) default 'pending',
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(task_id, date)
);

create index if not exists daily_progress_user_date_idx on daily_progress(user_id, date);
create index if not exists daily_progress_schedule_date_idx on daily_progress(schedule_id, date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table profiles enable row level security;
alter table todos enable row level security;
alter table schedules enable row level security;
alter table schedule_tasks enable row level security;
alter table daily_progress enable row level security;

-- Profiles: users can only see/edit their own profile
create policy "Users can view own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Todos: users can only access their own todos
create policy "Users can view own todos"
  on todos for select
  using (user_id = auth.uid());

create policy "Users can insert own todos"
  on todos for insert
  with check (user_id = auth.uid());

create policy "Users can update own todos"
  on todos for update
  using (user_id = auth.uid());

create policy "Users can delete own todos"
  on todos for delete
  using (user_id = auth.uid());

-- Schedules: users can only access their own schedules
create policy "Users can view own schedules"
  on schedules for select
  using (user_id = auth.uid());

create policy "Users can insert own schedules"
  on schedules for insert
  with check (user_id = auth.uid());

create policy "Users can update own schedules"
  on schedules for update
  using (user_id = auth.uid());

create policy "Users can delete own schedules"
  on schedules for delete
  using (user_id = auth.uid());

-- Schedule Tasks: access through schedule ownership
create policy "Users can view own schedule tasks"
  on schedule_tasks for select
  using (schedule_id in (select id from schedules where user_id = auth.uid()));

create policy "Users can insert own schedule tasks"
  on schedule_tasks for insert
  with check (schedule_id in (select id from schedules where user_id = auth.uid()));

create policy "Users can update own schedule tasks"
  on schedule_tasks for update
  using (schedule_id in (select id from schedules where user_id = auth.uid()));

create policy "Users can delete own schedule tasks"
  on schedule_tasks for delete
  using (schedule_id in (select id from schedules where user_id = auth.uid()));

-- Daily Progress: users can only access their own progress
create policy "Users can view own progress"
  on daily_progress for select
  using (user_id = auth.uid());

create policy "Users can insert own progress"
  on daily_progress for insert
  with check (user_id = auth.uid());

create policy "Users can update own progress"
  on daily_progress for update
  using (user_id = auth.uid());

create policy "Users can delete own progress"
  on daily_progress for delete
  using (user_id = auth.uid());

-- ============================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger todos_updated_at
  before update on todos
  for each row execute function update_updated_at();

create trigger schedules_updated_at
  before update on schedules
  for each row execute function update_updated_at();

create trigger schedule_tasks_updated_at
  before update on schedule_tasks
  for each row execute function update_updated_at();

create trigger daily_progress_updated_at
  before update on daily_progress
  for each row execute function update_updated_at();
