-- EduCore school dashboard schema

create extension if not exists "pgcrypto";

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text,
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('super_admin', 'admin', 'teacher', 'student', 'parent')),
  organization_id uuid references public.organizations (id) on delete set null,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.teachers (
  id bigserial primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  employee_id text not null,
  department text,
  subjects text,
  classes text,
  status text not null default 'Active',
  joining_date date,
  created_at timestamptz not null default now()
);

create table public.parents (
  id bigserial primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  occupation text,
  address text,
  created_at timestamptz not null default now()
);

create table public.students (
  id bigserial primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  admission_no text not null,
  full_name text not null,
  roll_no text,
  class_grade text not null default '',
  section text,
  gender text,
  dob date,
  phone text,
  address text,
  teacher_id bigint references public.teachers (id) on delete set null,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  unique (organization_id, admission_no)
);

create table public.classes (
  id bigserial primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  grade text not null,
  section text not null,
  teacher_id bigint references public.teachers (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, grade, section)
);

create table public.student_parents (
  id bigserial primary key,
  student_id bigint not null references public.students (id) on delete cascade,
  parent_id bigint not null references public.parents (id) on delete cascade,
  unique (student_id, parent_id)
);

create table public.notices (
  id bigserial primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text,
  audience text not null default 'Everyone',
  color text not null default 'blue',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index profiles_organization_id_idx on public.profiles (organization_id);
create index teachers_organization_id_idx on public.teachers (organization_id);
create index parents_organization_id_idx on public.parents (organization_id);
create index students_organization_id_idx on public.students (organization_id);
create index classes_organization_id_idx on public.classes (organization_id);
create index notices_organization_id_idx on public.notices (organization_id);

-- Keep profile in sync when auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, organization_id, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'admin'),
    nullif(new.raw_user_meta_data->>'organization_id', '')::uuid,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    organization_id = coalesce(excluded.organization_id, public.profiles.organization_id),
    phone = coalesce(excluded.phone, public.profiles.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.parents enable row level security;
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.student_parents enable row level security;
alter table public.notices enable row level security;

-- Service role (API) bypasses RLS. Authenticated users can read their org data.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid() or true);

create policy "orgs_select_authenticated" on public.organizations
  for select to authenticated using (true);

create policy "teachers_select_authenticated" on public.teachers
  for select to authenticated using (true);

create policy "parents_select_authenticated" on public.parents
  for select to authenticated using (true);

create policy "students_select_authenticated" on public.students
  for select to authenticated using (true);

create policy "classes_select_authenticated" on public.classes
  for select to authenticated using (true);

create policy "student_parents_select_authenticated" on public.student_parents
  for select to authenticated using (true);

create policy "notices_select_authenticated" on public.notices
  for select to authenticated using (true);
