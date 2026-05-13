import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { buildBackendUrl } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Loader2, TrendingUp, Target, Clock, 
  BarChart3, Brain, Sparkles, ShieldCheck, Award, Zap
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Legend
} from "recharts";
import ImprovementRecommendationsPanel from "@/components/ImprovementRecommendationsPanel";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

interface AnalysisData {
  overall_score: number;
  confidence_score: number;
  olq_indicators: string[];
  sentiment_score: number;
  spontaneity_score: number;
  primary_finding: string;
  detailed_analysis: string;
}

interface Recommendation {
  id: string;
  area_of_improvement: string;
  priority_level: string;
  description: string;
}

interface PerformanceDataPoint {
  name: string;
  score: number;
  sentiment: number;
  spontaneity: number;
  confidence: number;
}

interface MetricsData {
  total_practice_sessions: number;
  average_score: number;
  improvement_rate: number;
  weak_areas: string[];
  total_attempts?: number;
  best_score?: number;
  total_practice_hours?: number;
  consistency_score?: number;
  streak_days?: number;
}

interface AnalysisRecord {
  created_at: string;
  overall_score: number;
  sentiment_score: number | null;
  spontaneity_score: number;
  confidence_score: number;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b", "#10b981"];

const Analysis = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(location.state?.analysis || null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(location.state?.recommendations || []);
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([]);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const generateFallbackRecommendations = (olqIndicators: string[]): Recommendation[] => {
    return olqIndicators.slice(0, 3).map((indicator, index) => ({
      id: `${indicator}-${index}`,
      area_of_improvement: `Improve ${indicator}`,
      priority_level: 'high',
      recommendation_category: 'OLQ',
      description: `Build stronger ${indicator} through practice, reflection, and officer-style responses.`,
      actionable_steps: [
        `Review your responses for ${indicator} examples`,
        `Practice with a focused officer scenario`,
        `Use a clear, structured approach in your next attempt`
      ],
    }));
  };

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const fetchComprehensiveAnalysis = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        buildBackendUrl(`/get-comprehensive-analysis?user_id=${user?.id}&exam_type=SSB`),
        {
          headers: {
            'Authorization': `Bearer ${user?.id}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch analysis');

      const data = await response.json();
      setMetrics(data.metrics?.[0]);

      const { data: attemptData, error: attemptError } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: true });

      type RawAttempt = {
        completed_at: string;
        score: number;
        sentiment_score?: number | null;
        spontaneity_score?: number | null;
        confidence_score?: number | null;
      };

      if (!attemptError && attemptData) {
        const attemptSeries = (attemptData as RawAttempt[]).map((attempt) => ({
          name: new Date(attempt.completed_at).toLocaleDateString(),
          score: attempt.score,
          sentiment: attempt.sentiment_score ? ((attempt.sentiment_score + 1) * 50) : 50,
          spontaneity: attempt.spontaneity_score ?? attempt.confidence_score ?? 50,
          confidence: attempt.confidence_score ?? 50,
        }));

        setPerformanceData(attemptSeries);
        setMetrics((prev) => ({
          ...prev,
          total_attempts: attemptSeries.length,
          average_score: attemptSeries.length
            ? attemptSeries.reduce((sum, item) => sum + item.score, 0) / attemptSeries.length
            : prev?.average_score,
          best_score: attemptSeries.length
            ? Math.max(prev?.best_score || 0, ...attemptSeries.map((item) => item.score))
            : prev?.best_score,
          streak_days: attemptSeries.length > 1
            ? Math.max(0, attemptSeries.length - 1)
            : prev?.streak_days,
        }));

        if (!data.analyses?.length && attemptSeries.length > 0) {
          const latestAttempt = attemptSeries[attemptSeries.length - 1];
          setAnalysisData((current) => ({
            overall_score: latestAttempt.score / 10,
            confidence_score: latestAttempt.confidence,
            olq_indicators: current?.olq_indicators || [],
            sentiment_score: (latestAttempt.sentiment / 50) - 1,
            spontaneity_score: latestAttempt.spontaneity,
            primary_finding: 'Your latest attempt was used to refresh this summary with current progress.',
            detailed_analysis: `Latest score: ${latestAttempt.score}%. Track the next test to see whether your progress is improving or if a topic requires more focus.`,
          }));
        }
      }

      if (data.analyses?.length > 0 && (!attemptData || attemptData.length === 0)) {
        const chartData = data.analyses.map((a: AnalysisRecord) => ({
          name: new Date(a.created_at).toLocaleDateString(),
          score: a.overall_score,
          sentiment: ((a.sentiment_score || 0) + 1) * 50,
          spontaneity: a.spontaneity_score,
          confidence: a.confidence_score,
        }));
        setPerformanceData(chartData);

        const latest = data.analyses[0];
        setAnalysisData({
          overall_score: latest.overall_score,
          confidence_score: latest.confidence_score,
          olq_indicators: latest.olq_indicators || [],
          sentiment_score: latest.sentiment_score ?? 0,
          spontaneity_score: latest.spontaneity_score,
          primary_finding: latest.primary_finding || 'AI analysis is available from your latest session.',
          detailed_analysis: latest.detailed_analysis || 'Submit a practice response to see more detailed officer quality feedback.',
        });

        if (data.recommendations?.length > 0) {
          setRecommendations(data.recommendations);
        } else if (latest.olq_indicators?.length > 0) {
          setRecommendations(generateFallbackRecommendations(latest.olq_indicators));
        }
      } else {
        if (data.recommendations) {
          setRecommendations(data.recommendations);
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching analysis:', error);

      const rawHistory = localStorage.getItem('ssb_history');
      if (rawHistory) {
        try {
          const history = JSON.parse(rawHistory) as Array<{ timestamp: string; data: Array<Record<string, unknown>> }>;
          if (history.length > 0) {
            const chartData = history.map((entry) => {
              const firstResult = entry.data?.[0] as Record<string, unknown> | undefined;
              const sentimentValue = typeof firstResult?.sentiment === 'number' ? firstResult.sentiment : 0;
              const confidenceValue = typeof firstResult?.confidence === 'number' ? firstResult.confidence : 60;
              return {
                name: new Date(entry.timestamp).toLocaleDateString(),
                score: Math.min(100, Math.max(0, (sentimentValue + 1) * 50)),
                sentiment: Math.min(100, Math.max(0, (sentimentValue + 1) * 50)),
                spontaneity: confidenceValue,
                confidence: confidenceValue,
              };
            });
            setPerformanceData(chartData);
            setMetrics({
              total_practice_sessions: history.length,
              average_score: chartData.reduce((sum, item) => sum + item.score, 0) / Math.max(chartData.length, 1),
              improvement_rate: 0,
              weak_areas: []
            });
            setAnalysisData({
              overall_score: Math.min(10, Math.max(0, chartData[chartData.length - 1].score / 10)),
              confidence_score: chartData[chartData.length - 1].confidence,
              olq_indicators: [],
              sentiment_score: chartData[chartData.length - 1].sentiment / 50 - 1,
              spontaneity_score: chartData[chartData.length - 1].spontaneity,
              primary_finding: 'Local session history loaded. Complete a new practice for full OLQ analysis.',
              detailed_analysis: 'Your practice history was restored from local storage. Submit another response to refresh AI insights.',
            });
            toast.info('Loaded analysis from local session history.');
          }
        } catch (storageError) {
          console.error('Failed to parse local history', storageError);
        }
      } else {
        toast.error('Failed to load analysis data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchComprehensiveAnalysis();
    }
  }, [user, fetchComprehensiveAnalysis]);

  if (authLoading || isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  // OLQ Distribution for Radar
  const olqData = analysisData?.olq_indicators ? [
    { category: 'Leadership', value: analysisData.overall_score * 8 },
    { category: 'Communication', value: analysisData.spontaneity_score * 8 },
    { category: 'Decisiveness', value: analysisData.confidence_score },
    { category: 'Social Adaptability', value: (analysisData.sentiment_score + 1) * 50 },
    { category: 'Initiative', value: analysisData.overall_score * 10 },
  ] : [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.95),_rgba(8,14,27,1))] text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-8 pb-12">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Performance Analytics & Insights</h1>
            <p className="text-muted-foreground text-sm">Your comprehensive evaluation & personalized improvement plan</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="olq">OLQ Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">Improvements</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {analysisData && (
              <>
                {/* Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Award className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                        <div className="text-3xl font-bold">{analysisData.overall_score.toFixed(1)}/10</div>
                        <p className="text-xs text-muted-foreground mt-1">Overall Score</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Zap className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                        <div className="text-3xl font-bold">{analysisData.confidence_score}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Confidence Score</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Target className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                        <div className="text-3xl font-bold">{analysisData.spontaneity_score.toFixed(1)}/10</div>
                        <p className="text-xs text-muted-foreground mt-1">Spontaneity</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Brain className="h-8 w-8 mx-auto text-pink-500 mb-2" />
                        <div className="text-3xl font-bold">{Math.round((analysisData.sentiment_score + 1) * 50)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Sentiment</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Findings */}
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI Key Findings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Primary Finding</h4>
                      <p className="text-muted-foreground">{analysisData.primary_finding}</p>
                    </div>
                    {analysisData.olq_indicators && analysisData.olq_indicators.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Officer Like Qualities Detected</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisData.olq_indicators.map((olq, idx) => (
                            <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                              {olq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold mb-2">Detailed Analysis</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm">{analysisData.detailed_analysis}</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Current Metrics */}
            {metrics && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Performance Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Attempts</p>
                      <p className="text-2xl font-bold">{metrics.total_attempts || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Average Score</p>
                      <p className="text-2xl font-bold">{metrics.average_score?.toFixed(1) || 0}/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Best Score</p>
                      <p className="text-2xl font-bold">{metrics.best_score?.toFixed(1) || 0}/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Practice Hours</p>
                      <p className="text-2xl font-bold">{metrics.total_practice_hours?.toFixed(1) || 0}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Consistency</p>
                      <p className="text-2xl font-bold">{metrics.consistency_score?.toFixed(0) || 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Streak</p>
                      <p className="text-2xl font-bold">{metrics.streak_days || 0}d</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TRENDS TAB */}
          <TabsContent value="trends" className="space-y-6">
            {performanceData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Score & Behavioral Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="score" stroke="#8b5cf6" name="Score" dot={{ fill: '#8b5cf6' }} />
                      <Line type="monotone" dataKey="sentiment" stroke="#06b6d4" name="Sentiment" dot={{ fill: '#06b6d4' }} />
                      <Line type="monotone" dataKey="spontaneity" stroke="#f59e0b" name="Spontaneity" dot={{ fill: '#f59e0b' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {performanceData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribution Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" fill="#8b5cf6" name="Score" />
                      <Bar dataKey="confidence" fill="#06b6d4" name="Confidence" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* OLQ ANALYSIS TAB */}
          <TabsContent value="olq" className="space-y-6">
            {olqData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Officer Like Qualities Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={olqData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="OLQ Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-slate-600/40 bg-slate-950/80">
                <CardHeader>
                  <CardTitle>No OLQ Insights Available</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Your officer profile will appear here after you complete a new practice session. Launch a mission from the dashboard and come back for your OLQ radar report.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* RECOMMENDATIONS TAB */}
          <TabsContent value="recommendations">
            <div className="space-y-4">
              <Card className="bg-slate-950/90 border-2 border-amber-500/20">
                <CardHeader>
                  <CardTitle>Mission Control</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This section gives you AI-generated recommendations tailored to officer-style performance and SSB readiness. Complete more practice missions to unlock higher priority suggestions.
                  </p>
                </CardContent>
              </Card>
              <ImprovementRecommendationsPanel examType="SSB" />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Analysis;