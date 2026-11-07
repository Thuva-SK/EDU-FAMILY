-- ========================================================
-- EDU FAMILY - Complete Supabase Database & Storage Setup SQL
-- Run this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Click Run
-- ========================================================

-- 1. Create 'resources' Table (for Study Notes, Past Papers, GK)
CREATE TABLE IF NOT EXISTS public.resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date TEXT,
    link TEXT,
    "fileName" TEXT,
    "fileId" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create 'news' Table (for Education News Articles)
CREATE TABLE IF NOT EXISTS public.news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    body TEXT,
    date TEXT,
    featured BOOLEAN DEFAULT FALSE,
    "imageData" TEXT,
    "imageName" TEXT,
    "imageFileId" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS) on Tables
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for 'resources' Table
DROP POLICY IF EXISTS "Allow public read resources" ON public.resources;
CREATE POLICY "Allow public read resources"
    ON public.resources FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow all access resources" ON public.resources;
CREATE POLICY "Allow all access resources"
    ON public.resources FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. RLS Policies for 'news' Table
DROP POLICY IF EXISTS "Allow public read news" ON public.news;
CREATE POLICY "Allow public read news"
    ON public.news FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow all access news" ON public.news;
CREATE POLICY "Allow all access news"
    ON public.news FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Create Supabase Storage Bucket ('resources') for PDFs and News Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 7. RLS Policies for Storage Bucket ('resources')
DROP POLICY IF EXISTS "Allow public read storage" ON storage.objects;
CREATE POLICY "Allow public read storage"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'resources');

DROP POLICY IF EXISTS "Allow all insert storage" ON storage.objects;
CREATE POLICY "Allow all insert storage"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'resources');

DROP POLICY IF EXISTS "Allow all update storage" ON storage.objects;
CREATE POLICY "Allow all update storage"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'resources');

DROP POLICY IF EXISTS "Allow all delete storage" ON storage.objects;
CREATE POLICY "Allow all delete storage"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'resources');

-- 8. Enable Realtime Listener for Live Updates
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.resources, public.news;
COMMIT;
