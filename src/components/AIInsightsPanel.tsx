import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, Target, Zap, Brain, Award, Calendar, 
  AlertCircle, CheckCircle2, BarChart3, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface PersonalityProfile {
  leadership: number;
  communication: number;
  confidence: number;
  initiative: number;
  teamwork: number;
  resilience: number;
  problem_solving: number;
  emotional_intelligence: number;
}

interface PerformancePrediction {
  current_level: number;
  predicted_level_1week: number;
  predicted_level_1month: number;
  estimated_readiness_date: string;
  confidence_level: number;
  required_practice_hours: number;
  focus_areas: string[];
  success_probability: number;
}

export const AIInsightsPanel: React.FC<{ examType?: string }> = ({ examType = "SSB" }) => {
  const { user } = useAuth();
  const [personality, setPersonality] = useState<any>(null);
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAIInsights();
    }
  }, [user]);

  const fetchAIInsights = async () => {
    setLoading(true);
    try {
      // Fetch personality profile
      const { data: personalityData } = await supabase
        .from('personality_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('exam_type', examType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (personalityData) {
        setPersonality(personalityData);
      }

      // Fetch performance prediction
      const { data: predictionData } = await supabase
        .from('performance_predictions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('exam_type', examType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (predictionData) {
        setPrediction(predictionData);
      }
    } catch (err) {
      console.error('Failed to fetch AI insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProfileColor = (value: number): string => {
    if (value >= 70) return 'text-green-600';
    if (value >= 50) return 'text-blue-600';
    return 'text-orange-600';
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

  return (
    <div className="space-y-6">
      {/* Personality Profile */}
      {personality && (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Personality Profile Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personality Traits Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(personality.profile).map(([key, value]) => (
                <div key={key} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                  <div className="text-center">
                    <p className="text-xs font-medium text-muted-foreground mb-2 capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <div className={`text-2xl font-bold ${getProfileColor(value as number)}`}>
                      {Math.round(value as number)}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-1 rounded-full"
                        style={{ width: `${(value as number)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Readiness */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Overall Readiness</h4>
                <span className={`text-3xl font-bold ${getProfileColor(personality.overall_readiness)}`}>
                  {personality.overall_readiness}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${personality.overall_readiness}%` }}
                />
              </div>
            </div>

            {/* Strengths and Development Areas */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Strengths
                </h4>
                <div className="space-y-2">
                  {personality.strengths.map((strength: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Development Areas
                </h4>
                <div className="space-y-2">
                  {personality.development_areas.map((area: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-orange-600">◆</span>
                      <span className="text-sm">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                Key Recommendations
              </h4>
              <ul className="space-y-2">
                {personality.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary">→</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Prediction */}
      {prediction && (
        <Card className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Performance Prediction & Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground mb-2">Current Level</p>
                <p className="text-3xl font-bold text-blue-600">{prediction.current_level}</p>
                <p className="text-xs text-muted-foreground mt-2">Out of 100</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground mb-2">1 Week Prediction</p>
                <p className="text-3xl font-bold text-purple-600">{prediction.predicted_level_1week}</p>
                <p className="text-xs text-green-600 mt-2">+{prediction.predicted_level_1week - prediction.current_level}</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground mb-2">1 Month Prediction</p>
                <p className="text-3xl font-bold text-green-600">{prediction.predicted_level_1month}</p>
                <p className="text-xs text-green-600 mt-2">+{prediction.predicted_level_1month - prediction.current_level}</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground mb-2">Success Probability</p>
                <p className="text-3xl font-bold text-blue-600">{prediction.success_probability}%</p>
                <p className="text-xs text-muted-foreground mt-2">Estimated</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Estimated Readiness Date</p>
                    <p className="text-xs text-muted-foreground">When you'll reach level 80+</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{prediction.estimated_readiness_date}</p>
                  <p className="text-xs text-muted-foreground">{Math.round(prediction.required_practice_hours)} hours needed</p>
                </div>
              </div>
            </div>

            {/* Confidence Level */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">Prediction Confidence</p>
                <Badge variant={
                  prediction.confidence_level >= 80 ? 'default' : 'secondary'
                }>
                  {prediction.confidence_level}% Confident
                </Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-blue-600 h-2 rounded-full"
                  style={{ width: `${prediction.confidence_level}%` }}
                />
              </div>
            </div>

            {/* Focus Areas */}
            {prediction.focus_areas.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  Priority Focus Areas
                </h4>
                <div className="space-y-2">
                  {prediction.focus_areas.map((area: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-orange-600 rounded-full" />
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <Button onClick={fetchAIInsights} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Updating Insights...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Refresh AI Insights
          </>
        )}
      </Button>
    </div>
  );
};

export default AIInsightsPanel;
