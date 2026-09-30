-- ============================================================
-- EduFamily Supabase Migration Script
-- Run this query in your Supabase Dashboard -> SQL Editor
-- ============================================================

-- Add description / text notes column to resources table
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;

-- Ensure link and file_path columns exist for database file persistence
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS link TEXT DEFAULT NULL;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_path TEXT DEFAULT NULL;
