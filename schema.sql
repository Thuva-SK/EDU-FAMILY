-- ============================================================
-- PostgreSQL / Supabase / Neon Compatible Schema
-- Edufamily in Tamil Database Setup
-- ============================================================

-- ENUM Types Creation (Safe Execution)
DO $$ BEGIN
    CREATE TYPE resource_category AS ENUM ('Notes', 'Past Paper', 'GK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE resource_status AS ENUM ('Published', 'Draft');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('Upcoming', 'Completed', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE announcement_priority AS ENUM ('Urgent', 'Important', 'General');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE inquiry_status AS ENUM ('Unread', 'Read', 'Replied');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'editor', 'student');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. USERS & ADMINS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'admin',
    avatar_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. EDUCATIONAL RESOURCES TABLE (Notes, Past Paper, GK)
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category resource_category NOT NULL DEFAULT 'Notes',
    file_name VARCHAR(255) DEFAULT NULL,
    file_path VARCHAR(500) DEFAULT NULL,
    file_size VARCHAR(50) DEFAULT NULL,
    downloads INT DEFAULT 0,
    status resource_status DEFAULT 'Published',
    author_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ACADEMIC EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255) NOT NULL DEFAULT 'Zoom Online',
    registered_count INT DEFAULT 0,
    status event_status DEFAULT 'Upcoming',
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ANNOUNCEMENTS & NEWS FLASH TABLE
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    priority announcement_priority DEFAULT 'General',
    audience VARCHAR(100) DEFAULT 'All Students',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. STUDENT INQUIRIES & CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    subject VARCHAR(200) DEFAULT 'Website Contact Form',
    message TEXT NOT NULL,
    status inquiry_status DEFAULT 'Unread',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PORTAL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS portal_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PRODUCTION READY SCHEMA - REAL-TIME DATA ONLY
-- ============================================================
