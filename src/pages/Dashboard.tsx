import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { BookOpen, Target, BarChart3, Brain, FileText, Settings, Sparkles, Lightbulb, Flame, Zap, ChevronRight, Loader2, TrendingUp, Award, MessageSquare, Eye, Users, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const dashboardItems = [
  { 
    title: "Performance Analysis", 
    desc: "AI-powered psychological OLQ evaluation & score trends", 
    icon: BarChart3, 
    path: "/analysis", 
    color: "bg-primary/10 text-primary" 
  },
  { 
    title: "Holistic Analysis", 
    desc: "Comprehensive evaluation combining all test results", 
    icon: TrendingUp, 
    path: "/holistic-analysis", 
    color: "bg-gold/10 text-gold" 
  },
  { 
    title: "Mock Tests", 
    desc: "AI-generated practice tests for NDA, CDS, AFCAT", 
    icon: Target, 
    path: "/mock-test", 
    color: "bg-gold/10 text-gold" 
  },
  { 
    title: "SSB Practice", 
    desc: "Timed WAT, TAT, SRT with real-time AI feedback", 
    icon: Brain, 
    path: "/ssb-practice", 
    color: "bg-gold/10 text-gold" 
  },
  {
    title: "OIR Practice",
    desc: "MCQ Officer Intelligence Rating practice with AI scoring",
    icon: Eye,
    path: "/oir-practice",
    color: "bg-primary/10 text-primary"
  },
  {
    title: "GD Simulator",
    desc: "AI group discussion practice and feedback",
    icon: Users,
    path: "/gd-simulator",
    color: "bg-gold/10 text-gold"
  },
  {
    title: "PI Preparation",
    desc: "Practice personal interview questions with AI review",
    icon: PenTool,
    path: "/pi-preparation",
    color: "bg-secondary/10 text-secondary"
  },
  { 
    title: "Interview Coaching", 
    desc: "AI-powered interview practice with personalized feedback", 
    icon: MessageSquare, 
    path: "/interview-coaching", 
    color: "bg-primary/10 text-primary" 
  },
  { 
    title: "Study Planner", 
    desc: "Get a personalized AI study plan for your exam", 
    icon: BookOpen, 
    path: "/study-planner", 
    color: "bg-secondary/10 text-secondary" 
  },
  { 
    title: "Study Materials", 
    desc: "Curated notes & resources for all defence exams", 
    icon: FileText, 
    path: "/study-materials", 
    color: "bg-olive/10 text-olive" 
  },
  { 
    title: "AI Flashcards", 
    desc: "Spaced repetition cards adapted to your weak areas", 
    icon: Zap, 
    path: "/flashcards", 
    color: "bg-gold/10 text-gold" 
  },
  { 
    title: "Profile Settings", 
    desc: "Update your name, avatar, and target exam", 
    icon: Settings, 
    path: "/profile", 
    color: "bg-secondary/10 text-secondary" 
  },
];

type DashboardInsights = {
  daily_tip: string;
  motivation_quote: string;
  focus_subjects: string[];
  challenge: { question: string; options: string[]; answer: number } | null;
};

type ProgressSummary = {
  total_practice_hours: number;
  total_sessions: number;
  current_score: number;
  score_improvement_percentage: number;
  consecutive_practice_days: number;
  active_recommendations_count: number;
  estimated_readiness_date: string;
  predicted_success_probability: number;
};

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [challengeAnswer, setChallengeAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const fetchProgressSummary = useCallback(async () => {
    setProgressLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("user_progress_summary")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      
      if (!error && data) {
        setProgressSummary(data as unknown as ProgressSummary);
      }
    } catch (e) {
      console.error("Failed to fetch progress summary:", e);
    } finally {
      setProgressLoading(false);
    }
  }, [user?.id]);

  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const targetExam = user?.user_metadata?.target_exam || "NDA";
      const { data, error } = await supabase.functions.invoke("ai-agent", {
        body: { 
          mode: "dashboard", 
          exam_type: targetExam,
          user_name: user?.user_metadata?.full_name || "Aspirant",
        },
      });
      if (!error && data) setInsights(data);
    } catch (e) {
      console.error("Failed to fetch AI insights:", e);
    } finally {
      setInsightsLoading(false);
    }
  }, [user?.user_metadata?.target_exam, user?.user_metadata?.full_name]);
  useEffect(() => {
    if (user) {
      fetchInsights();
      fetchProgressSummary();
    }
  }, [user, fetchInsights, fetchProgressSummary]);
  const handleChallengeAnswer = (index: number) => {
    setChallengeAnswer(index);
    setShowAnswer(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Welcome, {user?.user_metadata?.full_name || "Aspirant"}!
            </h1>
            <p className="text-muted-foreground text-sm">Your AI-powered defence exam preparation hub</p>
          </div>
        </div>

        {/* PROGRESS SUMMARY SECTION */}
        {progressLoading ? (
          <Card className="mb-8 animate-pulse">
            <CardContent className="pt-6 space-y-4">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="grid md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted rounded" />)}
              </div>
            </CardContent>
          </Card>
        ) : progressSummary && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Your Preparation Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Total Hours */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Total Practice Hours</p>
                    <p className="text-2xl font-bold text-primary">{progressSummary.total_practice_hours?.toFixed(1) || 0}h</p>
                    <p className="text-xs text-muted-foreground mt-2">across {progressSummary.total_sessions || 0} sessions</p>
                  </div>

                  {/* Current Score */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Current Score</p>
                    <p className="text-2xl font-bold text-blue-600">{progressSummary.current_score?.toFixed(1) || 0}/10</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {progressSummary.score_improvement_percentage && progressSummary.score_improvement_percentage > 0 ? '↗' : '↘'} {progressSummary.score_improvement_percentage?.toFixed(1) || 0}%
                    </p>
                  </div>

                  {/* Consistency */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Streak</p>
                    <p className="text-2xl font-bold text-orange-600">{progressSummary.consecutive_practice_days || 0}d</p>
                    <p className="text-xs text-muted-foreground mt-2">Keep it going! 🔥</p>
                  </div>

                  {/* Active Focus Areas */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Focus Areas</p>
                    <p className="text-2xl font-bold text-green-600">{progressSummary.active_recommendations_count || 0}</p>
                    <p className="text-xs text-muted-foreground mt-2">recommendations active</p>
                  </div>

                  {/* Readiness */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Readiness</p>
                    <p className="text-2xl font-bold text-purple-600">{Math.round((progressSummary.predicted_success_probability || 0) * 100)}%</p>
                    <p className="text-xs text-muted-foreground mt-2">success probability</p>
                  </div>
                </div>

                {/* Readiness Timeline */}
                {progressSummary.estimated_readiness_date && (
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-semibold mb-2">Estimated Readiness</p>
                    <p className="text-2xl font-bold text-primary">
                      {new Date(progressSummary.estimated_readiness_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on your current pace and preparation level
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI Insights Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-gold" />
            <h2 className="font-display text-lg font-semibold text-foreground">Command Center</h2>
            {!insightsLoading && (
              <Button variant="ghost" size="sm" onClick={fetchInsights} className="text-xs text-muted-foreground hover:text-gold ml-auto">
                Refresh Mission
              </Button>
            )}
          </div>

          {insightsLoading ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-full mb-1" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : insights ? (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Daily Tip */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-gold/20 bg-gold/5 h-full">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-gold" />
                      <span className="text-xs font-semibold text-gold uppercase tracking-wider">Daily Tip</span>
                    </div>
                    <p className="text-sm text-foreground font-body">{insights.daily_tip}</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Focus Subjects */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-secondary/20 bg-secondary/5 h-full">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-secondary" />
                      <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Focus Today</span>
                    </div>
                    <div className="space-y-1.5">
                      {insights.focus_subjects?.map((subject, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          <span className="text-sm text-foreground font-body">{subject}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Motivation */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-primary/20 bg-primary/5 h-full">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">Motivation</span>
                    </div>
                    <p className="text-sm text-foreground font-body italic">"{insights.motivation_quote}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ) : null}

          {/* Daily Challenge */}
          {insights?.challenge && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-4">
              <Card className="border-gold/30">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-gold" />
                    <span className="text-xs font-semibold text-gold uppercase tracking-wider">Mission Briefing</span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-3">{insights.challenge.question}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {insights.challenge.options?.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleChallengeAnswer(i)}
                        disabled={showAnswer}
                        className={`text-sm text-left px-3 py-2 rounded-lg border transition-all ${
                          showAnswer
                            ? i === insights.challenge!.answer
                              ? "bg-secondary/20 border-secondary text-secondary font-medium"
                              : i === challengeAnswer
                                ? "bg-destructive/10 border-destructive/30 text-destructive"
                                : "bg-muted/30 border-border text-muted-foreground"
                            : "bg-card border-border text-foreground hover:border-gold hover:bg-gold/5 cursor-pointer"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}) {opt}
                      </button>
                    ))}
                  </div>
                  {showAnswer && (
                    <p className="text-xs mt-2 text-muted-foreground">
                      {challengeAnswer === insights.challenge!.answer ? "✅ Correct! Great job!" : `❌ The correct answer is ${String.fromCharCode(65 + insights.challenge!.answer)}).`}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Advanced AI Insights Panel */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-purple-600" />
            <h2 className="font-display text-lg font-semibold text-foreground">Deep AI Analysis</h2>
          </div>
          <AIInsightsPanel examType={user?.user_metadata?.target_exam || "SSB"} />
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dashboardItems.map((item, i) => (
            <motion.button
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              onClick={() => navigate(item.path)}
              className="bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all text-left group"
            >
              <div className={`p-3 rounded-xl w-fit mb-4 ${item.color}`}>
                <item.icon className="h-6 w-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
