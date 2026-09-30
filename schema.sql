-- ============================================================
-- PostgreSQL / Supabase Schema for Edufamily in Tamil
-- Multi-Device Realtime Cloud Database Setup
-- ============================================================

-- 1. EDUCATIONAL RESOURCES TABLE
CREATE TABLE IF NOT EXISTS public.resources (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Notes',
    file_name TEXT DEFAULT NULL,
    file_path TEXT DEFAULT NULL,
    file_size TEXT DEFAULT NULL,
    link TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    downloads INT DEFAULT 0,
    status TEXT DEFAULT 'Published',
    date TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ACADEMIC EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    event_date TEXT DEFAULT NULL,
    date TEXT DEFAULT NULL,
    location TEXT DEFAULT 'Zoom Online',
    registered_count INT DEFAULT 0,
    status TEXT DEFAULT 'Upcoming',
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ANNOUNCEMENTS & NEWS FLASH TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    priority TEXT DEFAULT 'General',
    audience TEXT DEFAULT 'All Students',
    date TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. STUDENT INQUIRIES & CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.inquiries (
    id BIGINT PRIMARY KEY,
    name TEXT DEFAULT NULL,
    student_name TEXT DEFAULT NULL,
    email TEXT NOT NULL,
    subject TEXT DEFAULT 'Website Contact Form',
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Unread',
    date TEXT DEFAULT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PORTAL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.portal_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. USERS & ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    avatar TEXT DEFAULT 'AD',
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR PUBLIC ANONYMOUS ACCESS
-- ============================================================

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create Permissive Policies for Web Access
DO $$ BEGIN
    CREATE POLICY "Public Read Resources" ON public.resources FOR SELECT USING (true);
    CREATE POLICY "Public Write Resources" ON public.resources FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Public Read Events" ON public.events FOR SELECT USING (true);
    CREATE POLICY "Public Write Events" ON public.events FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Public Read Announcements" ON public.announcements FOR SELECT USING (true);
    CREATE POLICY "Public Write Announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Public Read Inquiries" ON public.inquiries FOR SELECT USING (true);
    CREATE POLICY "Public Write Inquiries" ON public.inquiries FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Public Read Portal Settings" ON public.portal_settings FOR SELECT USING (true);
    CREATE POLICY "Public Write Portal Settings" ON public.portal_settings FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
    CREATE POLICY "Public Write Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- REALTIME BROADCAST ENABLING FOR SUPABASE
-- ============================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.resources, public.events, public.announcements, public.inquiries, public.portal_settings;
COMMIT;
