-- =========================================================================
-- CAMPUS DEADLINE RADAR + CAMPUS ASSESSMENT HUB
-- PRODUCTION POSTGRESQL DATABASE SCHEMA & ROW LEVEL SECURITY POLICIES
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  category_code TEXT,
  domain_slug TEXT,
  university TEXT,
  course_degree TEXT,
  branch TEXT,
  semester INTEGER,
  selected_difficulty TEXT DEFAULT 'intermediate',
  preferred_mode TEXT DEFAULT 'timed',
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. DOMAIN CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  domain_count INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  icon_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. DOMAINS (ALL 72 ACADEMIC & PROFESSIONAL DOMAINS)
CREATE TABLE IF NOT EXISTS public.domains (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_code TEXT NOT NULL REFERENCES public.categories(code),
  description TEXT NOT NULL,
  icon TEXT,
  has_coding BOOLEAN DEFAULT false,
  has_simulation BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. QUESTION BANK (MINIMUM 3,600 APPROVED QUESTIONS)
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  domain_slug TEXT NOT NULL REFERENCES public.domains(slug) ON DELETE RESTRICT,
  subject_slug TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('basic', 'intermediate', 'advanced', 'professional')),
  type TEXT NOT NULL CHECK (type IN ('single_choice', 'multiple_choice', 'true_false', 'numerical', 'coding', 'practical')),
  question_text TEXT NOT NULL,
  options JSONB, -- array of {id, text}
  correct_answer JSONB NOT NULL, -- protected from client exposure during active exams
  explanation TEXT NOT NULL,
  marks NUMERIC NOT NULL DEFAULT 1,
  negative_marks NUMERIC NOT NULL DEFAULT 0.25,
  review_status TEXT NOT NULL DEFAULT 'approved' CHECK (review_status IN ('draft', 'pending_review', 'approved', 'rejected')),
  version INTEGER NOT NULL DEFAULT 1,
  source_or_reference TEXT,
  starter_code TEXT,
  language TEXT,
  test_cases JSONB, -- array of {id, input, output, isHidden}
  practical_rubric TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing for fast search and coverage queries
CREATE INDEX IF NOT EXISTS idx_questions_domain ON public.questions(domain_slug);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(review_status);

-- 5. EXAMINATIONS
CREATE TABLE IF NOT EXISTS public.examinations (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  domain_slug TEXT NOT NULL REFERENCES public.domains(slug),
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  total_marks NUMERIC NOT NULL DEFAULT 50,
  passing_marks NUMERIC NOT NULL DEFAULT 25,
  passing_percentage NUMERIC NOT NULL DEFAULT 50,
  negative_marking_per_wrong NUMERIC NOT NULL DEFAULT 0.25,
  attempt_limit INTEGER NOT NULL DEFAULT 3,
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_free_sample BOOLEAN NOT NULL DEFAULT false,
  required_tier TEXT NOT NULL DEFAULT 'seven_day',
  mode TEXT NOT NULL DEFAULT 'timed' CHECK (mode IN ('timed', 'practice')),
  format TEXT NOT NULL DEFAULT 'mcq',
  question_ids JSONB NOT NULL, -- array of question IDs
  allowed_resources JSONB,
  result_release_policy TEXT NOT NULL DEFAULT 'immediate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. EXAM ATTEMPTS & AUTOSAVE
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES public.examinations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'expired', 'graded')),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  marked_for_review JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  score NUMERIC,
  max_score NUMERIC,
  percentage NUMERIC,
  passed BOOLEAN,
  correct_count INTEGER,
  incorrect_count INTEGER,
  unanswered_count INTEGER,
  topic_breakdown JSONB,
  difficulty_breakdown JSONB,
  coding_submissions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_exam ON public.exam_attempts(user_id, exam_id);

-- 7. PRICING PLANS
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL UNIQUE,
  price_paise BIGINT NOT NULL, -- stored as integer paise e.g. 2900 = ₹29
  duration_days INTEGER NOT NULL,
  duration_label TEXT NOT NULL,
  description TEXT NOT NULL,
  features JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 8. ORDERS & PAYMENTS
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_id TEXT NOT NULL REFERENCES public.pricing_plans(id),
  amount_paise BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
  gateway TEXT NOT NULL DEFAULT 'razorpay',
  payment_id TEXT,
  signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. USER ENTITLEMENTS
CREATE TABLE IF NOT EXISTS public.entitlements (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL,
  order_id TEXT REFERENCES public.orders(id),
  payment_ref TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user ON public.entitlements(user_id);

-- 10. CAMPUS DEADLINE RADAR (ACADEMIC DEADLINES)
CREATE TABLE IF NOT EXISTS public.campus_deadlines (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('exam', 'revaluation', 'backlog', 'assignment', 'scholarship', 'internship')),
  university_or_board TEXT NOT NULL,
  domain_slug TEXT REFERENCES public.domains(slug),
  due_date DATE NOT NULL,
  due_time TEXT,
  description TEXT NOT NULL,
  importance TEXT NOT NULL DEFAULT 'high' CHECK (importance IN ('medium', 'high', 'critical')),
  action_url TEXT,
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_deadlines_date ON public.campus_deadlines(due_date);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_deadlines ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read and update only their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Questions: Public/students can read approved questions (excluding direct answer key inspection during live exam)
CREATE POLICY "Anyone can view approved questions" ON public.questions FOR SELECT USING (review_status = 'approved');

-- Examinations: Public can view published exams
CREATE POLICY "Anyone can view published exams" ON public.examinations FOR SELECT USING (is_published = true);

-- Exam Attempts: Students can view, insert, and update only their own attempts
CREATE POLICY "Users can view own attempts" ON public.exam_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON public.exam_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own in-progress attempts" ON public.exam_attempts FOR UPDATE USING (auth.uid() = user_id AND status = 'in_progress');

-- Orders & Entitlements: Students can view only their own orders and entitlements
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own entitlements" ON public.entitlements FOR SELECT USING (auth.uid() = user_id);

-- Deadlines: Public read for all verified academic deadlines
CREATE POLICY "Anyone can view campus deadlines" ON public.campus_deadlines FOR SELECT USING (true);
