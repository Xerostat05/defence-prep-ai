import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, AlertCircle, TrendingUp, Target, Flame, Award, 
  Brain, Clock, Zap, ArrowRight, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Recommendation {
  id: string;
  area_of_improvement: string;
  recommendation_category: string;
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  actionable_steps: string[];
  status: string;
  estimated_improvement_days: number;
}

interface PerformanceData {
  date: string;
  score: number;
  spontaneity: number;
  sentiment: number;
}

interface AnalysisResult {
  overall_score: number | null;
  sentiment_score: number | null;
  spontaneity_score: number | null;
  created_at: string;
}

export const ImprovementRecommendationsPanel: React.FC<{ examType?: string }> = ({ examType = 'SSB' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRec, setSelectedRec] = useState<string | null>(null);
  const [expandedRec, setExpandedRec] = useState<Recommendation | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const fetchRecommendationsAndData = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      // Fetch recommendations
      const { data: recs, error: recError } = await supabase
        .from('improvement_recommendations')
        .select('*')
        .eq('user_id', user?.id)
        .order('priority_level', { ascending: true });

      if (recError) throw recError;
      setRecommendations(recs || []);

      // Fetch performance metrics for chart
      const { data: analyses } = await supabase
        .from('ai_analysis_results')
        .select('overall_score, sentiment_score, spontaneity_score, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true })
        .limit(20);

      if (analyses) {
        const chartData = analyses.map((a: AnalysisResult) => ({
          date: new Date(a.created_at).toLocaleDateString(),
          score: a.overall_score || 0,
          spontaneity: a.spontaneity_score || 0,
          sentiment: (a.sentiment_score || 0) * 10, // Scale for visibility
        }));
        setPerformanceData(chartData);
      }
    } catch (err) {
      const error = err as Error;
      setFetchError(true);
      toast.error('Failed to load recommendations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchRecommendationsAndData();
    }
  }, [user, fetchRecommendationsAndData]);

  const updateRecommendationStatus = async (recId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('improvement_recommendations')
        .update({ status: newStatus })
        .eq('id', recId);

      if (error) throw error;
      toast.success(`Recommendation marked as ${newStatus}`);
      fetchRecommendationsAndData();
    } catch (err) {
      const error = err as Error;
      toast.error('Failed to update recommendation');
    }
  };

  const getIconForCategory = (category: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      OLQ: <Award className="h-4 w-4" />,
      BEHAVIORAL: <Brain className="h-4 w-4" />,
      TECHNICAL: <Zap className="h-4 w-4" />,
      VERBAL: <Target className="h-4 w-4" />,
      WRITING: <CheckCircle2 className="h-4 w-4" />,
      TIME_MANAGEMENT: <Clock className="h-4 w-4" />,
    };
    return iconMap[category] || <AlertCircle className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    const colorMap: { [key: string]: string } = {
      critical: 'destructive',
      high: 'secondary',
      medium: 'outline',
      low: 'secondary',
    };
    return colorMap[priority] || 'outline';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const activeRecs = recommendations.filter(r => r.status === 'active' || r.status === 'in_progress');
  const completedRecs = recommendations.filter(r => r.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Performance Trends Chart */}
      {performanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8b5cf6" 
                  name="Overall Score"
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="spontaneity" 
                  stroke="#06b6d4" 
                  name="Spontaneity"
                  dot={{ fill: '#06b6d4', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Flame className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <div className="text-3xl font-bold">{activeRecs.length}</div>
              <p className="text-sm text-muted-foreground">Active Improvements</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <div className="text-3xl font-bold">{completedRecs.length}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <div className="text-3xl font-bold">
                {recommendations.length > 0 ? Math.round((completedRecs.length / recommendations.length) * 100) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Recommendations */}
      {activeRecs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Areas to Focus On
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeRecs.map((rec) => (
              <div
                key={rec.id}
                className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                onClick={() => setExpandedRec(expandedRec?.id === rec.id ? null : rec)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {getIconForCategory(rec.recommendation_category)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{rec.area_of_improvement}</h4>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                  <Badge variant={getPriorityColor(rec.priority_level)}>
                    {rec.priority_level.toUpperCase()}
                  </Badge>
                </div>

                {expandedRec?.id === rec.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div>
                      <h5 className="text-sm font-semibold mb-2">Action Steps:</h5>
                      <ul className="space-y-1">
                        {rec.actionable_steps?.map((step, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary">→</span> {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Estimated improvement in: <span className="font-semibold">{rec.estimated_improvement_days} days</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRecommendationStatus(rec.id, 'in_progress');
                        }}
                      >
                        Start Working
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRecommendationStatus(rec.id, 'completed');
                        }}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Recommendations */}
      {completedRecs.length > 0 && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Completed Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedRecs.map((rec) => (
                <div key={rec.id} className="flex items-center gap-3 p-2 bg-green-100 dark:bg-green-900/30 rounded">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-900 dark:text-green-300">{rec.area_of_improvement}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations.length === 0 && (
        <Card className="border-dashed border-slate-600/30 bg-slate-950/80">
          <CardContent className="py-12 text-center space-y-3">
            <Award className="h-12 w-12 mx-auto text-gold mb-4" />
            <p className="text-muted-foreground">No recommendations available yet.</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Launch a defence mission, complete a practice session, and AI will generate targeted OLQ and readiness improvements.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => navigate('/ssb-practice')} className="bg-gold text-black hover:bg-amber-300">
                Start SSB Practice
              </Button>
              {fetchError && (
                <span className="text-xs text-destructive">Check connection or try again later.</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImprovementRecommendationsPanel;
