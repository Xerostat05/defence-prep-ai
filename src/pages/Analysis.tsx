import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, Loader2, TrendingUp, Target, Clock, 
  BarChart3, Brain, Send, ShieldCheck, Sparkles 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell 
} from "recharts";
import Navbar from "@/components/Navbar";

type Attempt = {
  id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken_seconds: number;
  completed_at: string;
};

type AIResult = {
  primary_olq: string;
  confidence_score: number;
  status: string;
};

const COLORS = ["#D4AF37", "#1A1C1E", "#4A4A4A"];

const Analysis = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // AI State
  const [userStory, setUserStory] = useState("");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchAttempts();
  }, [user]);

  const fetchAttempts = async () => {
    const { data } = await supabase
      .from("test_attempts")
      .select("*")
      .order("completed_at", { ascending: true });
    if (data) setAttempts(data as unknown as Attempt[]);
    setIsLoading(false);
  };

  const handleAIAnalysis = async () => {
    if (!userStory.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userStory }),
      });
      const data = await response.json();
      setAiResult(data.analysis);
    } catch (error) {
      console.error("AI Engine Offline:", error);
      alert("Please ensure the Python AI server is running on localhost:8000");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Stats Calculations
  const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
  const totalCorrect = attempts.reduce((s, a) => s + a.correct_answers, 0);
  const totalQs = attempts.reduce((s, a) => s + a.total_questions, 0);

  const scoreData = attempts.map((a, i) => ({
    test: `Test ${i + 1}`,
    score: a.score,
  }));

  if (loading || isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gold" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold">Performance Analytics</h1>
            <p className="text-muted-foreground text-sm">Review your quantitative and qualitative progress</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: AI EVALUATOR */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-gold/20 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="text-gold h-5 w-5" />
                  AI Psychological Insight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Paste a TAT story or SRT response to evaluate your Officer Like Qualities (OLQs).
                </p>
                <textarea
                  className="w-full h-40 p-3 text-sm rounded-md bg-background border border-border focus:ring-1 focus:ring-gold outline-none resize-none transition-all"
                  placeholder="e.g., During the village fair, he noticed a short circuit. He immediately grabbed a dry wooden stick..."
                  value={userStory}
                  onChange={(e) => setUserStory(e.target.value)}
                />
                <Button 
                  onClick={handleAIAnalysis} 
                  disabled={isAnalyzing || !userStory}
                  className="w-full bg-gold text-black hover:bg-gold/90 font-bold"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Analyze Psychology
                </Button>

                {aiResult && (
                  <div className="mt-4 p-4 rounded-lg bg-gold/5 border border-gold/20 animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="text-gold h-4 w-4" />
                      <span className="text-sm font-bold uppercase tracking-wider">OLQ Detected</span>
                    </div>
                    <p className="text-2xl font-display font-bold text-gold">{aiResult.primary_olq}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">ML Confidence Score:</span>
                      <span className="font-mono">{aiResult.confidence_score}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: GRAPHS & STATS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4">
                <TrendingUp className="h-5 w-5 text-gold mb-1" />
                <div className="text-xl font-bold">{avgScore}%</div>
                <div className="text-[10px] text-muted-foreground uppercase">Avg Score</div>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <Target className="h-5 w-5 text-gold mb-1" />
                <div className="text-xl font-bold">{attempts.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Total Tests</div>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <BarChart3 className="h-5 w-5 text-gold mb-1" />
                <div className="text-xl font-bold">{totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0}%</div>
                <div className="text-[10px] text-muted-foreground uppercase">Accuracy</div>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <Clock className="h-5 w-5 text-gold mb-1" />
                <div className="text-xl font-bold">{attempts.length ? Math.round(attempts.reduce((s, a) => s + a.time_taken_seconds, 0) / attempts.length / 60) : 0}m</div>
                <div className="text-[10px] text-muted-foreground uppercase">Avg Time</div>
              </CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Performance Trajectory</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                      <XAxis dataKey="test" stroke="#666" fontSize={12} />
                      <YAxis domain={[0, 100]} stroke="#666" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1A1C1E", border: "1px solid #D4AF37" }}
                        itemStyle={{ color: "#D4AF37" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#D4AF37" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: "#D4AF37" }} 
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analysis;