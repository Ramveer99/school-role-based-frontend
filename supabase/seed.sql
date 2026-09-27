-- Demo org + auth users (password for all: password123)

create schema if not exists private;
create extension if not exists "pgcrypto" with schema extensions;

insert into public.organizations (id, name, code, address, phone, email, active)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Greenwood Academy', 'GWA', '12 Park Avenue, Delhi', '+91 98765 43210', 'info@greenwood.edu', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sunrise Public School', 'SPS', '88 Lake Road, Mumbai', '+91 99887 76655', 'hello@sunrise.edu', true)
on conflict (id) do nothing;

create or replace function private.seed_user(
  p_id uuid,
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_org uuid,
  p_phone text default null
) returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name', p_full_name,
      'role', p_role,
      'organization_id', coalesce(p_org::text, ''),
      'phone', p_phone
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
    'email',
    p_id::text,
    now(),
    now(),
    now()
  );

  update public.profiles
  set
    full_name = p_full_name,
    role = p_role,
    organization_id = p_org,
    phone = p_phone
  where id = p_id;
end;
$$;

select private.seed_user('11111111-1111-1111-1111-111111111111', 'superadmin@educore.edu', 'password123', 'Super Admin', 'super_admin', null, null);
select private.seed_user('22222222-2222-2222-2222-222222222222', 'admin@greenwood.edu', 'password123', 'Greenwood Admin', 'admin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '+91 90000 11111');
select private.seed_user('33333333-3333-3333-3333-333333333333', 'sarah.j@greenwood.edu', 'password123', 'Sarah Johnson', 'teacher', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '+91 90000 22222');
select private.seed_user('44444444-4444-4444-4444-444444444444', 'rahul.k@greenwood.edu', 'password123', 'Rahul Kumar', 'student', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '+91 90000 33333');
select private.seed_user('55555555-5555-5555-5555-555555555555', 'rajesh.k@greenwood.edu', 'password123', 'Rajesh Kumar', 'parent', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '+91 90000 44444');

insert into public.teachers (id, organization_id, profile_id, full_name, email, phone, employee_id, department, subjects, classes, status, joining_date)
values
  (1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Sarah Johnson', 'sarah.j@greenwood.edu', '+91 90000 22222', 'T-1001', 'Science', 'Physics, Math', '10-A, 9-B', 'Active', '2022-06-01'),
  (2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'Amit Verma', 'amit.v@greenwood.edu', '+91 90000 55555', 'T-1002', 'Arts', 'English, History', '8-A', 'Active', '2023-01-15');

select setval('public.teachers_id_seq', (select max(id) from public.teachers));

insert into public.parents (id, organization_id, profile_id, full_name, email, phone, occupation, address)
values
  (1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'Rajesh Kumar', 'rajesh.k@greenwood.edu', '+91 90000 44444', 'Engineer', '45 Nehru Nagar, Delhi');

select setval('public.parents_id_seq', (select max(id) from public.parents));

insert into public.students (id, organization_id, profile_id, admission_no, full_name, roll_no, class_grade, section, gender, dob, phone, address, teacher_id, status)
values
  (1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'ADM-2024-001', 'Rahul Kumar', '12', '10', 'A', 'Male', '2010-04-12', '+91 90000 33333', '45 Nehru Nagar, Delhi', 1, 'Active'),
  (2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'ADM-2024-002', 'Priya Sharma', '05', '9', 'B', 'Female', '2011-08-21', null, '22 MG Road, Delhi', 1, 'Active'),
  (3, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'ADM-2024-003', 'Arjun Mehta', '18', '8', 'A', 'Male', '2012-01-05', null, '9 Civil Lines, Delhi', 2, 'Active');

select setval('public.students_id_seq', (select max(id) from public.students));

insert into public.classes (organization_id, grade, section, teacher_id)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '10', 'A', 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '9', 'B', 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '8', 'A', 2);

insert into public.student_parents (student_id, parent_id)
values (1, 1);

insert into public.notices (organization_id, title, description, audience, color, created_by)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Welcome to the new term', 'Classes begin Monday. Please check the timetable.', 'Everyone', 'blue', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PTM scheduled', 'Parent-teacher meeting on Friday at 4 PM.', 'Parents', 'green', '33333333-3333-3333-3333-333333333333');

drop function if exists private.seed_user(uuid, text, text, text, text, uuid, text);
