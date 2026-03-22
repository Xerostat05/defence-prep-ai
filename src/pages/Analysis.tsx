import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, TrendingUp, Target, Clock, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import Navbar from "@/components/Navbar";

type Attempt = {
  id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken_seconds: number;
  completed_at: string;
};

const COLORS = ["hsl(135, 28%, 24%)", "hsl(0, 84%, 60%)", "hsl(42, 55%, 55%)"];

const Analysis = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
  const totalTests = attempts.length;
  const avgTime = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.time_taken_seconds, 0) / attempts.length / 60) : 0;
  const totalCorrect = attempts.reduce((s, a) => s + a.correct_answers, 0);
  const totalQs = attempts.reduce((s, a) => s + a.total_questions, 0);

  const scoreData = attempts.map((a, i) => ({
    test: `Test ${i + 1}`,
    score: a.score,
    date: new Date(a.completed_at).toLocaleDateString(),
  }));

  const pieData = totalQs > 0 ? [
    { name: "Correct", value: totalCorrect },
    { name: "Incorrect", value: totalQs - totalCorrect },
  ] : [];

  if (loading || isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Performance Analysis</h1>
            <p className="text-muted-foreground text-sm">Track your progress and identify improvement areas</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Avg Score", value: `${avgScore}%`, icon: TrendingUp, color: "text-gold" },
            { label: "Tests Taken", value: totalTests, icon: Target, color: "text-secondary" },
            { label: "Avg Time", value: `${avgTime} min`, icon: Clock, color: "text-primary" },
            { label: "Accuracy", value: totalQs > 0 ? `${Math.round((totalCorrect / totalQs) * 100)}%` : "—", icon: BarChart3, color: "text-gold" },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {attempts.length === 0 ? (
          <Card className="border-dashed"><CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No test data yet. Take a mock test to see your analytics!</p>
            <Button onClick={() => navigate("/mock-test")} className="bg-gold text-accent-foreground hover:bg-gold-light">Take a Mock Test</Button>
          </CardContent></Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Score Trend */}
            <Card>
              <CardHeader><CardTitle className="text-sm font-display">Score Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 88%)" />
                    <XAxis dataKey="test" tick={{ fontSize: 12 }} stroke="hsl(213, 15%, 45%)" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(213, 15%, 45%)" />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="hsl(42, 55%, 55%)" strokeWidth={2} dot={{ fill: "hsl(42, 55%, 55%)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Accuracy Pie */}
            <Card>
              <CardHeader><CardTitle className="text-sm font-display">Overall Accuracy</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Score Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-sm font-display">Test Scores</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 88%)" />
                    <XAxis dataKey="test" tick={{ fontSize: 12 }} stroke="hsl(213, 15%, 45%)" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(213, 15%, 45%)" />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(42, 55%, 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analysis;
