-- New AI-Powered Features Tables

-- Personality Profiles Table
CREATE TABLE IF NOT EXISTS public.personality_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  exam_type varchar(50) NOT NULL,
  profile jsonb NOT NULL,
  strengths text[] NOT NULL DEFAULT '{}',
  development_areas text[] NOT NULL DEFAULT '{}',
  personality_traits text[] NOT NULL DEFAULT '{}',
  overall_readiness integer NOT NULL DEFAULT 50,
  recommendations text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT NOW(),
  updated_at timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_personality_profiles_user_exam ON public.personality_profiles(user_id, exam_type);
ALTER TABLE public.personality_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personality profiles"
  ON public.personality_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personality profiles"
  ON public.personality_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Performance Predictions Table
CREATE TABLE IF NOT EXISTS public.performance_predictions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  exam_type varchar(50) NOT NULL,
  current_level integer NOT NULL,
  predicted_level_1week integer NOT NULL,
  predicted_level_1month integer NOT NULL,
  estimated_readiness_date date NOT NULL,
  confidence_level integer NOT NULL DEFAULT 50,
  required_practice_hours integer NOT NULL DEFAULT 0,
  focus_areas text[] NOT NULL DEFAULT '{}',
  success_probability integer NOT NULL DEFAULT 50,
  created_at timestamp with time zone NOT NULL DEFAULT NOW(),
  updated_at timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_performance_predictions_user_exam ON public.performance_predictions(user_id, exam_type);
ALTER TABLE public.performance_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own predictions"
  ON public.performance_predictions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions"
  ON public.performance_predictions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Interview Coaching Sessions Table
CREATE TABLE IF NOT EXISTS public.interview_coaching_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  exam_type varchar(50) NOT NULL,
  topic varchar(255) NOT NULL,
  difficulty_level varchar(20) NOT NULL DEFAULT 'medium',
  question text NOT NULL,
  model_answer text NOT NULL,
  evaluation_points text[] NOT NULL DEFAULT '{}',
  common_mistakes text[] NOT NULL DEFAULT '{}',
  tips_for_improvement text[] NOT NULL DEFAULT '{}',
  practice_suggestions text[] NOT NULL DEFAULT '{}',
  user_response text DEFAULT NULL,
  user_score integer DEFAULT NULL,
  feedback text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT NOW(),
  updated_at timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interview_coaching_user_exam ON public.interview_coaching_sessions(user_id, exam_type);
ALTER TABLE public.interview_coaching_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coaching sessions"
  ON public.interview_coaching_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coaching sessions"
  ON public.interview_coaching_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coaching sessions"
  ON public.interview_coaching_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);
