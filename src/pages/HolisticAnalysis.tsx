import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Brain, Shield, Target, ArrowLeft, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface HolisticData {
  wat_scores: Array<{ date: string; score: number; confidence: number }>;
  tat_scores: Array<{ date: string; score: number; olq_score: number }>;
  srt_scores: Array<{ date: string; score: number; leadership_score: number }>;
  mock_test_scores: Array<{ date: string; score: number; subject: string }>;
  personality_traits: {
    extraversion: number;
    agreeableness: number;
    conscientiousness: number;
    neuroticism: number;
    openness: number;
  };
  overall_readiness: number;
  recommendations: Array<{
    area: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }>;
}

const HolisticAnalysis = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<HolisticData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    else if (user) loadHolisticData();
  }, [user, authLoading, navigate]);

  const loadHolisticData = async () => {
    try {
      setLoading(true);

      // Fetch data from various tables
      const [practiceSessions, mockTests, personalityData, performanceData] = await Promise.all([
        supabase.from('practice_sessions').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('test_attempts').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('personality_profiles').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('performance_predictions').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(1)
      ]);

      // Process WAT scores
      const watScores = practiceSessions.data?.filter(s => s.test_type === 'wat').map(s => ({
        date: new Date(s.created_at).toLocaleDateString(),
        score: s.score || 0,
        confidence: s.confidence_score || 0
      })) || [];

      // Process TAT scores
      const tatScores = practiceSessions.data?.filter(s => s.test_type === 'tat').map(s => ({
        date: new Date(s.created_at).toLocaleDateString(),
        score: s.score || 0,
        olq_score: s.olq_score || 0
      })) || [];

      // Process SRT scores
      const srtScores = practiceSessions.data?.filter(s => s.test_type === 'srt').map(s => ({
        date: new Date(s.created_at).toLocaleDateString(),
        score: s.score || 0,
        leadership_score: s.leadership_score || 0
      })) || [];

      // Process mock test scores
      const mockTestScores = mockTests.data?.map(t => ({
        date: new Date(t.created_at).toLocaleDateString(),
        score: t.score || 0,
        subject: t.subject || 'General'
      })) || [];

      // Personality traits
      const personalityTraits = personalityData.data?.[0] ? {
        extraversion: personalityData.data[0].extraversion || 0,
        agreeableness: personalityData.data[0].agreeableness || 0,
        conscientiousness: personalityData.data[0].conscientiousness || 0,
        neuroticism: personalityData.data[0].neuroticism || 0,
        openness: personalityData.data[0].openness || 0
      } : {
        extraversion: 0,
        agreeableness: 0,
        conscientiousness: 0,
        neuroticism: 0,
        openness: 0
      };

      // Calculate overall readiness
      const overallReadiness = performanceData.data?.[0]?.predicted_score || 0;

      // Generate recommendations based on data
      const recommendations = generateRecommendations(watScores, tatScores, srtScores, mockTestScores, personalityTraits);

      setData({
        wat_scores: watScores,
        tat_scores: tatScores,
        srt_scores: srtScores,
        mock_test_scores: mockTestScores,
        personality_traits: personalityTraits,
        overall_readiness: overallReadiness,
        recommendations
      });

    } catch (error) {
      console.error('Failed to load holistic data:', error);
      toast.error('Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = (wat: any[], tat: any[], srt: any[], mock: any[], personality: any) => {
    const recommendations = [];

    // WAT recommendations
    if (wat.length > 0) {
      const avgWatScore = wat.reduce((sum, s) => sum + s.score, 0) / wat.length;
      if (avgWatScore < 70) {
        recommendations.push({
          area: 'Word Association Test',
          priority: 'high' as const,
          description: 'Improve spontaneity and quick thinking. Practice more WAT sessions to build confidence.'
        });
      }
    }

    // TAT recommendations
    if (tat.length > 0) {
      const avgTatScore = tat.reduce((sum, s) => sum + s.score, 0) / tat.length;
      if (avgTatScore < 70) {
        recommendations.push({
          area: 'Thematic Apperception Test',
          priority: 'high' as const,
          description: 'Work on storytelling and creativity. Focus on developing coherent narratives in TAT practice.'
        });
      }
    }

    // SRT recommendations
    if (srt.length > 0) {
      const avgSrtScore = srt.reduce((sum, s) => sum + s.score, 0) / srt.length;
      if (avgSrtScore < 70) {
        recommendations.push({
          area: 'Situation Reaction Test',
          priority: 'high' as const,
          description: 'Enhance decision-making and leadership skills. Study military scenarios and practice responses.'
        });
      }
    }

    // Mock test recommendations
    if (mock.length > 0) {
      const avgMockScore = mock.reduce((sum, s) => sum + s.score, 0) / mock.length;
      if (avgMockScore < 60) {
        recommendations.push({
          area: 'Academic Performance',
          priority: 'medium' as const,
          description: 'Focus on subject knowledge and exam preparation. Review weak areas identified in mock tests.'
        });
      }
    }

    // Personality-based recommendations
    if (personality.conscientiousness < 60) {
      recommendations.push({
        area: 'Personal Development',
        priority: 'medium' as const,
        description: 'Work on discipline and organization. Develop better study habits and time management.'
      });
    }

    return recommendations;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4af37] mx-auto mb-4" />
          <p className="text-slate-400">Analyzing your performance data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No performance data available</p>
          <Button onClick={() => navigate('/dashboard')} className="bg-[#d4af37] text-black hover:bg-[#e5c158]">
            Start Practicing
          </Button>
        </div>
      </div>
    );
  }

  const personalityData = [
    { trait: 'Extraversion', value: data.personality_traits.extraversion },
    { trait: 'Agreeableness', value: data.personality_traits.agreeableness },
    { trait: 'Conscientiousness', value: data.personality_traits.conscientiousness },
    { trait: 'Neuroticism', value: data.personality_traits.neuroticism },
    { trait: 'Openness', value: data.personality_traits.openness }
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 font-sans">
      <Navbar />

      <main className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Holistic Performance Analysis</h1>
              <p className="text-slate-400 mt-1">Comprehensive evaluation combining all your test results</p>
            </div>
          </div>

          {/* Overall Readiness Score */}
          <Card className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm mb-8">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 mb-4">
                  <Target className="h-6 w-6 text-[#d4af37]" />
                  <span className="text-slate-400 uppercase text-sm font-bold tracking-widest">Overall Readiness</span>
                </div>
                <div className="text-6xl font-black text-[#d4af37] mb-2">{Math.round(data.overall_readiness)}%</div>
                <Progress value={data.overall_readiness} className="w-full max-w-md mx-auto h-3" />
                <p className="text-slate-400 mt-4">
                  {data.overall_readiness >= 80 ? 'Excellent preparation level' :
                   data.overall_readiness >= 60 ? 'Good progress, keep practicing' :
                   'Needs significant improvement'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* SSB Test Performance Trends */}
            <Card className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#d4af37]" />
                  SSB Test Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    ...data.wat_scores.map(s => ({ date: s.date, WAT: s.score })),
                    ...data.tat_scores.map(s => ({ date: s.date, TAT: s.score })),
                    ...data.srt_scores.map(s => ({ date: s.date, SRT: s.score }))
                  ].reduce((acc, curr) => {
                    const existing = acc.find(item => item.date === curr.date);
                    if (existing) Object.assign(existing, curr);
                    else acc.push(curr);
                    return acc;
                  }, [])}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem'
                      }}
                    />
                    <Line type="monotone" dataKey="WAT" stroke="#d4af37" strokeWidth={2} />
                    <Line type="monotone" dataKey="TAT" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="SRT" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Personality Profile */}
            <Card className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-[#d4af37]" />
                  Personality Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={personalityData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="trait" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#d4af37"
                      fill="#d4af37"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#d4af37]" />
                Improvement Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {data.recommendations.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No specific recommendations at this time. Keep practicing!</p>
              ) : (
                <div className="space-y-4">
                  {data.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-lg border border-white/5">
                      <Badge className={`shrink-0 ${getPriorityColor(rec.priority)}`}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                      <div>
                        <h4 className="text-white font-semibold mb-1">{rec.area}</h4>
                        <p className="text-slate-300 text-sm">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HolisticAnalysis;