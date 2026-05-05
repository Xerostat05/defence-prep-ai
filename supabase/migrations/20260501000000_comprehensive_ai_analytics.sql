-- ============================================================================
-- COMPREHENSIVE AI ANALYTICS & PERFORMANCE TRACKING SYSTEM
-- Tracks all student responses, AI analysis, performance metrics, and recommendations
-- ============================================================================

-- ============================================================================
-- 1. PRACTICE SESSION HISTORY TABLE (Track all practice attempts)
-- ============================================================================
CREATE TABLE public.practice_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL,
  practice_type TEXT NOT NULL CHECK (practice_type IN ('SSB', 'TAT', 'WAT', 'SRT', 'MOCK_TEST')),
  duration_minutes INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  raw_response TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.practice_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.practice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.practice_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_practice_sessions_updated_at BEFORE UPDATE ON public.practice_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. AI ANALYSIS RESULTS TABLE (Store comprehensive AI evaluation)
-- ============================================================================
CREATE TABLE public.ai_analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('OLQ', 'PSYCHOLOGICAL', 'TECHNICAL', 'VERBAL', 'WRITING')),
  
  -- Core Analysis Data
  overall_score NUMERIC(5,2),
  confidence_score NUMERIC(5,2),
  primary_finding TEXT,
  detailed_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- OLQ Analysis (Officer Like Qualities)
  olq_indicators TEXT[] DEFAULT '{}'::TEXT[],
  olq_strengths JSONB DEFAULT '{}'::jsonb,
  olq_weaknesses JSONB DEFAULT '{}'::jsonb,
  
  -- Sentiment & Tone Analysis
  sentiment_score NUMERIC(5,2),
  tone_analysis TEXT,
  
  -- Behavioral Metrics
  response_latency_seconds INTEGER,
  spontaneity_score NUMERIC(5,2),
  psychological_indicators JSONB DEFAULT '{}'::jsonb,
  
  -- Raw Response
  raw_feedback TEXT,
  ai_model TEXT,
  processing_time_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_analysis_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own analysis" ON public.ai_analysis_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analysis" ON public.ai_analysis_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_ai_analysis_updated_at BEFORE UPDATE ON public.ai_analysis_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 3. PERFORMANCE METRICS TABLE (Aggregated performance tracking)
-- ============================================================================
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL,
  practice_type TEXT,
  
  -- Score Tracking
  total_attempts INTEGER DEFAULT 0,
  average_score NUMERIC(5,2),
  best_score NUMERIC(5,2),
  worst_score NUMERIC(5,2),
  score_trend NUMERIC(5,2),
  
  -- OLQ Tracking
  olq_distribution JSONB DEFAULT '{}'::jsonb,
  strongest_olq TEXT,
  weakest_olq TEXT,
  olq_improvement_trend JSONB DEFAULT '{}'::jsonb,
  
  -- Behavioral Metrics
  average_spontaneity NUMERIC(5,2),
  average_sentiment NUMERIC(5,2),
  consistency_score NUMERIC(5,2),
  
  -- Time Metrics
  average_response_time_seconds NUMERIC(8,2),
  total_practice_hours NUMERIC(8,2),
  
  -- Last Updated
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  streak_days INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own metrics" ON public.performance_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metrics" ON public.performance_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metrics" ON public.performance_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON public.performance_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 4. IMPROVEMENT RECOMMENDATIONS TABLE (Personalized AI recommendations)
-- ============================================================================
CREATE TABLE public.improvement_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_analysis_id UUID REFERENCES public.ai_analysis_results(id) ON DELETE SET NULL,
  
  -- Recommendation Details
  area_of_improvement TEXT NOT NULL,
  recommendation_category TEXT NOT NULL CHECK (recommendation_category IN ('OLQ', 'BEHAVIORAL', 'TECHNICAL', 'VERBAL', 'WRITING', 'TIME_MANAGEMENT')),
  priority_level TEXT NOT NULL DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Content
  description TEXT NOT NULL,
  actionable_steps TEXT[] NOT NULL,
  resources_needed TEXT[] DEFAULT '{}'::TEXT[],
  estimated_improvement_days INTEGER,
  
  -- Success Metrics
  target_metric TEXT,
  target_value NUMERIC(5,2),
  current_value NUMERIC(5,2),
  
  -- AI Generated Content
  study_material TEXT,
  practice_questions JSONB,
  reference_content TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'archived')),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.improvement_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recommendations" ON public.improvement_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recommendations" ON public.improvement_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recommendations" ON public.improvement_recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_improvement_recommendations_updated_at BEFORE UPDATE ON public.improvement_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. QUESTION QUALITY SCORING TABLE (AI-rated question quality)
-- ============================================================================
CREATE TABLE public.question_quality_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  
  -- Quality Metrics
  clarity_score NUMERIC(5,2),
  relevance_score NUMERIC(5,2),
  difficulty_alignment_score NUMERIC(5,2),
  answer_quality_score NUMERIC(5,2),
  overall_quality_score NUMERIC(5,2),
  
  -- AI Evaluation
  quality_feedback TEXT,
  suggested_improvements TEXT,
  is_high_quality BOOLEAN DEFAULT true,
  
  -- Usage Metrics
  total_attempts INTEGER DEFAULT 0,
  average_success_rate NUMERIC(5,2),
  average_time_taken_seconds NUMERIC(8,2),
  
  -- Metadata
  ai_model TEXT,
  evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.question_quality_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view question quality" ON public.question_quality_scores FOR SELECT TO authenticated USING (true);
CREATE TRIGGER update_question_quality_scores_updated_at BEFORE UPDATE ON public.question_quality_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. USER PROGRESS SUMMARY TABLE (Dashboard overview)
-- ============================================================================
CREATE TABLE public.user_progress_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Overall Stats
  total_practice_hours NUMERIC(8,2) DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  current_level TEXT,
  
  -- Current Performance
  current_score NUMERIC(5,2),
  target_score NUMERIC(5,2),
  score_improvement_percentage NUMERIC(5,2),
  
  -- OLQ Progress
  primary_focus_olq TEXT,
  secondary_focus_olqs TEXT[] DEFAULT '{}'::TEXT[],
  
  -- Recommendations
  active_recommendations_count INTEGER DEFAULT 0,
  completed_recommendations_count INTEGER DEFAULT 0,
  
  -- Engagement
  consecutive_practice_days INTEGER DEFAULT 0,
  last_practice_date DATE,
  
  -- Predictions
  estimated_readiness_date DATE,
  predicted_success_probability NUMERIC(5,2),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own summary" ON public.user_progress_summary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own summary" ON public.user_progress_summary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own summary" ON public.user_progress_summary FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_user_progress_summary_updated_at BEFORE UPDATE ON public.user_progress_summary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 7. STUDY MATERIAL QUALITY TABLE (AI-evaluated study content)
-- ============================================================================
CREATE TABLE public.study_material_quality (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  topic TEXT NOT NULL,
  
  -- Quality Metrics
  content_accuracy_score NUMERIC(5,2),
  completeness_score NUMERIC(5,2),
  clarity_score NUMERIC(5,2),
  relevance_to_exam_score NUMERIC(5,2),
  overall_quality_score NUMERIC(5,2),
  
  -- AI Review
  quality_feedback TEXT,
  suggested_enhancements TEXT,
  missing_topics TEXT[] DEFAULT '{}'::TEXT[],
  
  -- Engagement Metrics
  times_used_count INTEGER DEFAULT 0,
  average_user_rating NUMERIC(5,2),
  
  ai_model TEXT,
  evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_material_quality ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view material quality" ON public.study_material_quality FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- 8. TRAINING DATA COLLECTION TABLE (For ML model improvement)
-- ============================================================================
CREATE TABLE public.training_data_samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_session_id UUID REFERENCES public.practice_sessions(id) ON DELETE SET NULL,
  
  -- Sample Data
  input_response TEXT NOT NULL,
  expected_output JSONB NOT NULL,
  actual_ai_output JSONB NOT NULL,
  
  -- Quality Assessment
  is_quality_sample BOOLEAN DEFAULT true,
  confidence_level NUMERIC(5,2),
  
  -- Purpose
  use_case TEXT,
  model_type TEXT,
  
  -- Feedback
  human_feedback TEXT,
  feedback_rating INTEGER,
  
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_data_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own samples" ON public.training_data_samples FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own samples" ON public.training_data_samples FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_exam_type ON public.practice_sessions(exam_type);
CREATE INDEX idx_practice_sessions_created_at ON public.practice_sessions(created_at);

CREATE INDEX idx_ai_analysis_user_id ON public.ai_analysis_results(user_id);
CREATE INDEX idx_ai_analysis_session_id ON public.ai_analysis_results(practice_session_id);
CREATE INDEX idx_ai_analysis_type ON public.ai_analysis_results(analysis_type);

CREATE INDEX idx_performance_metrics_user_exam ON public.performance_metrics(user_id, exam_type);

CREATE INDEX idx_improvement_recommendations_user_id ON public.improvement_recommendations(user_id);
CREATE INDEX idx_improvement_recommendations_status ON public.improvement_recommendations(status);
CREATE INDEX idx_improvement_recommendations_priority ON public.improvement_recommendations(priority_level);

CREATE INDEX idx_question_quality_exam_type ON public.question_quality_scores(exam_type);
CREATE INDEX idx_question_quality_high_quality ON public.question_quality_scores(is_high_quality);

CREATE INDEX idx_user_progress_user_id ON public.user_progress_summary(user_id);

-- ============================================================================
-- 10. INITIALIZATION FUNCTION (Auto-create summary on first practice)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.initialize_user_progress_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_progress_summary (user_id, total_sessions, current_level)
  VALUES (NEW.user_id, 0, 'Beginner')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_first_practice_session
  AFTER INSERT ON public.practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_progress_summary();

-- ============================================================================
-- 11. ENHANCE EXISTING PROFILE TABLE
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_exam_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preparation_hours_per_week INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_learning_style TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_insights_enabled BOOLEAN DEFAULT true;
