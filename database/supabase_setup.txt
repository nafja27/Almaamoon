-- =====================================================================
--  مغامرة المأمون — قاعدة البيانات (Supabase)
--  انسخي هذا الملف كاملًا في: Supabase ← SQL Editor ← New query ← Run
--  يمكن تشغيله أكثر من مرة بأمان.
--
--  الأمان:
--  • الجداول في مخطط خاص (maamoon) لا يمكن الوصول إليه من الإنترنت مباشرة.
--  • كل العمليات تمر عبر دوال على الخادم تتحقق من رمز الطالب/الرقم السري أو جلسة الإدارة.
--  • الأرقام السرية تُحفظ مشفّرة (bcrypt) ولا تُرسل إلى المتصفح أبدًا.
--  • بعد 8 محاولات دخول خاطئة يُقفل الحساب 10 دقائق.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;
create schema if not exists maamoon;
revoke all on schema maamoon from public;

create table if not exists maamoon.students(
  id           text primary key,
  code         text unique not null,
  name         text not null,
  grade        int  not null default 1,
  section      text not null default 'أ',
  pin_hash     text not null,
  pin_default  boolean not null default true,
  data         jsonb not null default '{}'::jsonb,
  failed       int not null default 0,
  locked_until timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create table if not exists maamoon.admins(
  username     text primary key,
  pin_hash     text not null,
  pin_default  boolean not null default true,
  failed       int not null default 0,
  locked_until timestamptz
);
create table if not exists maamoon.sessions(
  token      uuid primary key default gen_random_uuid(),
  role       text not null check (role in ('student','admin')),
  student_id text references maamoon.students(id) on delete cascade,
  username   text,
  expires_at timestamptz not null
);
create table if not exists maamoon.settings(key text primary key, value jsonb not null);
create table if not exists maamoon.audio(key text primary key, data text not null, updated_at timestamptz not null default now());
create sequence if not exists maamoon.student_code_seq start 1;
-- وقت آخر تعديل من المعلمة (لحماية إعداداتها من الكتابة فوقها بنسخة قديمة من جهاز الطالب)
alter table maamoon.students add column if not exists admin_edit_at timestamptz;

alter table maamoon.students enable row level security;
alter table maamoon.admins   enable row level security;
alter table maamoon.sessions enable row level security;
alter table maamoon.settings enable row level security;
alter table maamoon.audio    enable row level security;

-- مدير افتراضي: admin / 1234 (يجب تغييره من لوحة الإدارة بعد أول دخول)
insert into maamoon.admins(username,pin_hash) values ('admin', extensions.crypt('1234', extensions.gen_salt('bf')))
on conflict (username) do nothing;
insert into maamoon.settings(key,value) values ('pacing','{"perDay":2}') on conflict (key) do nothing;

-- ---------- أدوات داخلية ----------
create or replace function maamoon._session(p_token uuid, p_role text) returns maamoon.sessions
language plpgsql security definer set search_path = maamoon, extensions, public as $$
declare s maamoon.sessions;
begin
  select * into s from maamoon.sessions where token = p_token and role = p_role and expires_at > now();
  if not found then raise exception 'SESSION_EXPIRED'; end if;
  return s;
end $$;

create or replace function maamoon._student_json(st maamoon.students) returns jsonb
language sql stable as $$
  select coalesce(st.data,'{}'::jsonb) - 'pin' || jsonb_build_object(
    'id',st.id,'code',st.code,'name',st.name,'grade',st.grade,'section',st.section,
    'pinDefault',st.pin_default,'serverUpdatedAt',st.updated_at)
$$;

create or replace function maamoon._next_code() returns text
language plpgsql security definer set search_path = maamoon, extensions, public as $$
declare c text;
begin
  loop
    c := 'MAM-' || lpad(nextval('maamoon.student_code_seq')::text, 3, '0');
    exit when not exists(select 1 from maamoon.students where code = c);
  end loop;
  return c;
end $$;

-- ---------- الطالب ----------
create or replace function public.student_login(p_code text, p_pin text) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
declare st maamoon.students; tok uuid;
begin
  -- ملاحظة: نعيد الخطأ كنتيجة (لا نرفع استثناء) حتى يُحفظ عدّاد المحاولات الخاطئة
  select * into st from maamoon.students where upper(code) = upper(trim(p_code));
  if not found then return jsonb_build_object('error','WRONG_LOGIN'); end if;
  if st.locked_until is not null and st.locked_until > now() then return jsonb_build_object('error','LOCKED'); end if;
  if st.pin_hash <> extensions.crypt(trim(p_pin), st.pin_hash) then
    update maamoon.students set failed = failed + 1,
      locked_until = case when failed + 1 >= 8 then now() + interval '10 minutes' else null end
      where id = st.id;
    return jsonb_build_object('error','WRONG_LOGIN');
  end if;
  update maamoon.students set failed = 0, locked_until = null where id = st.id;
  delete from maamoon.sessions where expires_at < now();
  insert into maamoon.sessions(role, student_id, expires_at) values ('student', st.id, now() + interval '60 days') returning token into tok;
  return jsonb_build_object('token', tok, 'student', maamoon._student_json(st));
end $$;

create or replace function public.student_get(p_token uuid) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
declare s maamoon.sessions; st maamoon.students;
begin
  s := maamoon._session(p_token, 'student');
  select * into st from maamoon.students where id = s.student_id;
  return maamoon._student_json(st);
end $$;

-- يحفظ تقدم الطالب (لا يستطيع تغيير اسمه أو رمزه أو رقمه السري من هنا)
-- p_base = آخر نسخة رآها الجهاز. إذا عدّلت المعلمة الطالب بعدها، تبقى إعدادات المعلمة:
-- فحص الحروف، تأكيدات الحروف، إعادة التشخيص، وطلب تغيير الرقم السري.
drop function if exists public.student_sync(uuid, jsonb);
create or replace function public.student_sync(p_token uuid, p_data jsonb, p_base timestamptz default null) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
declare s maamoon.sessions; st maamoon.students; d jsonb; lm jsonb := '{}'::jsonb; k text; merged boolean := false;
begin
  s := maamoon._session(p_token, 'student');
  select * into st from maamoon.students where id = s.student_id for update;
  d := p_data - 'pin' - 'id' - 'code' - 'name' - 'grade' - 'section' - 'pinDefault' - 'serverUpdatedAt';
  if st.admin_edit_at is not null and (p_base is null or st.admin_edit_at > p_base) then
    merged := true;
    d := d || jsonb_strip_nulls(jsonb_build_object('letterCheck', st.data->'letterCheck', 'pinPrompt', st.data->'pinPrompt'));
    if (st.data->>'diagnosticDone') = 'false' then d := d || '{"diagnosticDone":false}'::jsonb; end if;
    lm := coalesce(d->'letterMap','{}'::jsonb);
    for k in select jsonb_object_keys(coalesce(st.data->'letterMap','{}'::jsonb)) loop
      lm := jsonb_set(lm, array[k], coalesce(lm->k,'{"d":[],"n":0}'::jsonb) || jsonb_build_object('t', coalesce(st.data->'letterMap'->k->'t','false'::jsonb)));
    end loop;
    if lm <> '{}'::jsonb then d := d || jsonb_build_object('letterMap', lm); end if;
  end if;
  update maamoon.students set data = d, updated_at = now() where id = st.id returning * into st;
  if merged then return jsonb_build_object('updatedAt', st.updated_at, 'student', maamoon._student_json(st)); end if;
  return jsonb_build_object('updatedAt', st.updated_at);
end $$;

create or replace function public.student_set_pin(p_token uuid, p_new text) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
declare s maamoon.sessions;
begin
  s := maamoon._session(p_token, 'student');
  if p_new !~ '^[0-9]{4}$' then raise exception 'PIN_FORMAT'; end if;
  if p_new = '1234' then raise exception 'PIN_DEFAULT'; end if;
  update maamoon.students set pin_hash = extensions.crypt(p_new, extensions.gen_salt('bf')), pin_default = false where id = s.student_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.session_logout(p_token uuid) returns jsonb
language sql security definer set search_path = maamoon, extensions, public as $$
  delete from maamoon.sessions where token = p_token;
  select jsonb_build_object('ok', true);
$$;

-- ---------- عام (بدون بيانات شخصية) ----------
create or replace function public.get_settings() returns jsonb
language sql security definer stable set search_path = maamoon, extensions, public as $$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from maamoon.settings;
$$;
create or replace function public.get_audio_all() returns jsonb
language sql security definer stable set search_path = maamoon, extensions, public as $$
  select coalesce(jsonb_object_agg(key, data), '{}'::jsonb) from maamoon.audio;
$$;

-- ---------- الإدارة ----------
create or replace function public.admin_login(p_user text, p_pin text) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
declare a maamoon.admins; tok uuid;
begin
  select * into a from maamoon.admins where username = trim(p_user);
  if not found then return jsonb_build_object('error','WRONG_LOGIN'); end if;
  if a.locked_until is not null and a.locked_until > now() then return jsonb_build_object('error','LOCKED'); end if;
  if a.pin_hash <> extensions.crypt(trim(p_pin), a.pin_hash) then
    update maamoon.admins set failed = failed + 1,
      locked_until = case when failed + 1 >= 8 then now() + interval '10 minutes' else null end
      where username = a.username;
    return jsonb_build_object('error','WRONG_LOGIN');
  end if;
  update maamoon.admins set failed = 0, locked_until = null where username = a.username;
  insert into maamoon.sessions(role, username, expires_at) values ('admin', a.username, now() + interval '12 hours') returning token into tok;
  return jsonb_build_object('token', tok, 'pinDefault', a.pin_default);
end $$;

create or replace function public.admin_list(p_token uuid) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
begin
  perform maamoon._session(p_token, 'admin');
  return coalesce((select jsonb_agg(maamoon._student_json(st) order by st.code) from maamoon.students st), '[]'::jsonb);
end $$;

-- إنشاء طلبة (من الاستيراد أو الإضافة أو رفع نسخة احتياطية قديمة)
-- كل عنصر: {name, grade, section, pin?, code?, id?, data?}
create or replace function public.admin_create_students(p_token uuid, p_list jsonb) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
declare item jsonb; out jsonb := '[]'::jsonb; v_code text; v_id text; v_pin text; st maamoon.students;
begin
  perform maamoon._session(p_token, 'admin');
  for item in select * from jsonb_array_elements(p_list) loop
    if coalesce(trim(item->>'name'),'') = '' then continue; end if;
    v_code := upper(nullif(trim(item->>'code'),''));
    if v_code is null or exists(select 1 from maamoon.students where code = v_code) then v_code := maamoon._next_code(); end if;
    v_id := nullif(item->>'id','');
    if v_id is null or exists(select 1 from maamoon.students where id = v_id) then v_id := 's' || replace(gen_random_uuid()::text,'-',''); end if;
    v_pin := coalesce(nullif(item->>'pin',''), '1234');
    if v_pin !~ '^[0-9]{4}$' then v_pin := '1234'; end if;
    insert into maamoon.students(id, code, name, grade, section, pin_hash, pin_default, data)
    values (v_id, v_code, trim(item->>'name'), coalesce((item->>'grade')::int, 1), coalesce(nullif(item->>'section',''),'أ'),
            extensions.crypt(v_pin, extensions.gen_salt('bf')), v_pin = '1234',
            coalesce(item->'data','{}'::jsonb) - 'pin' - 'id' - 'code' - 'name' - 'grade' - 'section' - 'pinDefault' - 'serverUpdatedAt')
    returning * into st;
    out := out || jsonb_build_array(maamoon._student_json(st));
  end loop;
  return out;
end $$;

-- دمج عميق: يغيّر فقط الحقول المرسلة ويحافظ على باقي تقدم الطالب
create or replace function maamoon._deep_merge(a jsonb, b jsonb) returns jsonb
language plpgsql immutable as $$
declare k text; r jsonb;
begin
  if a is null or jsonb_typeof(a) <> 'object' or jsonb_typeof(b) <> 'object' then return b; end if;
  r := a;
  for k in select jsonb_object_keys(b) loop
    r := jsonb_set(r, array[k], maamoon._deep_merge(a->k, b->k), true);
  end loop;
  return r;
end $$;

-- تعديل المعلمة: تُرسل فقط الحقول التي غيّرتها (p_patch)
drop function if exists public.admin_update_student(uuid, jsonb);
create or replace function public.admin_update_student(p_token uuid, p_id text, p_patch jsonb) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
declare t timestamptz; pt jsonb;
begin
  perform maamoon._session(p_token, 'admin');
  pt := p_patch - 'pin' - 'id' - 'code' - 'pinDefault' - 'serverUpdatedAt';
  update maamoon.students set
     name = coalesce(nullif(trim(pt->>'name'),''), name),
     grade = coalesce((pt->>'grade')::int, grade),
     section = coalesce(nullif(pt->>'section',''), section),
     data = maamoon._deep_merge(data, pt - 'name' - 'grade' - 'section'),
     updated_at = now(), admin_edit_at = now()
   where id = p_id returning updated_at into t;
  if t is null then raise exception 'NOT_FOUND'; end if;
  return jsonb_build_object('updatedAt', t);
end $$;

create or replace function public.admin_reset_pin(p_token uuid, p_id text) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
begin
  perform maamoon._session(p_token, 'admin');
  update maamoon.students set pin_hash = extensions.crypt('1234', extensions.gen_salt('bf')), pin_default = true,
         failed = 0, locked_until = null, data = data || '{"pinPrompt":true}'::jsonb, admin_edit_at = now(), updated_at = now() where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_delete_student(p_token uuid, p_id text) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
begin
  perform maamoon._session(p_token, 'admin');
  delete from maamoon.students where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_change_pin(p_token uuid, p_new text) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
declare s maamoon.sessions;
begin
  s := maamoon._session(p_token, 'admin');
  if length(coalesce(p_new,'')) < 4 then raise exception 'PIN_FORMAT'; end if;
  update maamoon.admins set pin_hash = extensions.crypt(p_new, extensions.gen_salt('bf')), pin_default = false where username = s.username;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_set_setting(p_token uuid, p_key text, p_value jsonb) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
begin
  perform maamoon._session(p_token, 'admin');
  insert into maamoon.settings(key, value) values (p_key, p_value) on conflict (key) do update set value = excluded.value;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_save_audio(p_token uuid, p_key text, p_data text) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
begin
  perform maamoon._session(p_token, 'admin');
  if length(p_data) > 600000 then raise exception 'AUDIO_TOO_LARGE'; end if;
  insert into maamoon.audio(key, data) values (p_key, p_data) on conflict (key) do update set data = excluded.data, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_delete_audio(p_token uuid, p_key text) returns jsonb
language plpgsql security definer set search_path = maamoon, extensions, public as $$
begin
  perform maamoon._session(p_token, 'admin');
  delete from maamoon.audio where key = p_key;
  return jsonb_build_object('ok', true);
end $$;

-- الصلاحيات: المتصفح (anon) يستطيع تشغيل هذه الدوال فقط، ولا يرى الجداول
revoke all on all functions in schema maamoon from public;
grant usage on schema maamoon to postgres;
do $$ declare f text; begin
  foreach f in array array['student_login(text,text)','student_get(uuid)','student_sync(uuid,jsonb,timestamptz)','student_set_pin(uuid,text)',
    'session_logout(uuid)','get_settings()','get_audio_all()','admin_login(text,text)','admin_list(uuid)',
    'admin_create_students(uuid,jsonb)','admin_update_student(uuid,text,jsonb)','admin_reset_pin(uuid,text)',
    'admin_delete_student(uuid,text)','admin_change_pin(uuid,text)','admin_set_setting(uuid,text,jsonb)',
    'admin_save_audio(uuid,text,text)','admin_delete_audio(uuid,text)'] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;
