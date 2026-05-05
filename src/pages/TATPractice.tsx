import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Brain, TrendingUp, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { buildBackendUrl } from '@/lib/api';

const tatImagePool = [
    '/tat/img1.jpg',
    '/tat/img5.jpg',
    '/tat/img10.jpg',
    '/tat/img15.jpg',
    '/tat/img20.jpg',
    '/tat/img25.jpg',
    '/tat/img30.jpg',
    '/tat/img35.jpg',
    '/tat/img40.jpg',
    '/tat/img45.jpg',
    '/tat/img50.jpg',
];

const shuffleArray = (items: string[]) => {
  return [...items].sort(() => Math.random() - 0.5);
};

interface AnalysisResult {
  overall_score: number;
  confidence_score: number;
  olq_indicators: string[];
  sentiment_score: number;
  primary_finding: string;
  detailed_analysis: string;
}

interface Recommendation {
  id: string;
  area_of_improvement: string;
  priority_level: string;
  description: string;
  actionable_steps?: string[];
}

interface SlideResult {
  slide: number;
  image: string | null;
  analysis: AnalysisResult;
  recommendations: Recommendation[];
}

interface AnalysisResult {
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
  actionable_steps?: string[];
}

const totalTatRounds = 12;
const tatObserveSeconds = 30;
const tatWritingSeconds = 240;

const TATPractice = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [currentRound, setCurrentRound] = useState(0);
    const [phase, setPhase] = useState<'observe' | 'write'>('observe');
    const [roundTimeLeft, setRoundTimeLeft] = useState(tatObserveSeconds);
    const [tatSlides, setTatSlides] = useState<string[]>([]);
    const [image, setImage] = useState<string | null>(null);
    const [story, setStory] = useState('');
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [slideResults, setSlideResults] = useState<SlideResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [hasSubmittedCurrentSlide, setHasSubmittedCurrentSlide] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) navigate('/auth');
    }, [user, authLoading, navigate]);

    const isPublicTatPath = (path: string) => path.startsWith('/tat/');

    const goToNextRound = useCallback(() => {
        if (currentRound < totalTatRounds - 1) {
            setCurrentRound((prev) => prev + 1);
            setPhase('observe');
            setRoundTimeLeft(tatObserveSeconds);
            setStory('');
            setAnalysis(null);
            setRecommendations([]);
            setHasSubmittedCurrentSlide(false);
        } else {
            setSessionComplete(true);
        }
    }, [currentRound]);

    const submitCurrentSlide = useCallback(async (auto = false) => {
        if (!user || phase !== 'write' || hasSubmittedCurrentSlide) return;

        const answer = story.trim() || 'No response';
        if (!answer && !auto) {
            toast.error('Please write a story before submitting');
            return;
        }

        setLoading(true);
        setHasSubmittedCurrentSlide(true);

        try {
            const imageName = image ? image.split('/').pop() : 'blank-slide';
            const response = await fetch(buildBackendUrl('/analyze-tat'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: user?.id || 'guest',
                    story: answer,
                    image_name: imageName,
                    time_taken_seconds: tatWritingSeconds - roundTimeLeft,
                    slide_index: currentRound + 1,
                }),
            });

            let resultData;
            if (response.ok) {
                resultData = await response.json();
            } else {
                throw new Error('Analysis failed');
            }

            const result: AnalysisResult = {
                overall_score: Math.min(10, Math.max(0, resultData.sentiment_score * 10)),
                confidence_score: 75,
                olq_indicators: resultData.olqs || [],
                sentiment_score: resultData.sentiment_score || 0,
                primary_finding: resultData.feedback || 'Keep building a clear hero-driven arc.',
                detailed_analysis: `Story snapshot: ${resultData.story_preview || answer.slice(0, 150)}. ${resultData.feedback || 'Good structure overall.'}`,
            };

            const recs: Recommendation[] = [
                {
                    id: `rec-${currentRound + 1}-1`,
                    area_of_improvement: 'Narrative structure',
                    priority_level: 'medium',
                    description: 'Connect the hero, situation, actions, and outcome clearly in each story.'
                },
                {
                    id: `rec-${currentRound + 1}-2`,
                    area_of_improvement: 'Officer-like traits',
                    priority_level: 'high',
                    description: 'Emphasize positive leadership, responsibility, and a solution mindset in your actions.'
                }
            ];

            setAnalysis(result);
            setRecommendations(recs);
            setSlideResults((prev) => [...prev, { slide: currentRound + 1, image, analysis: result, recommendations: recs }]);

            if (!auto) {
                toast.success('Slide analysis completed. Moving to next slide.');
            }
        } catch (err) {
            const fallback: AnalysisResult = {
                overall_score: 5,
                confidence_score: 60,
                olq_indicators: ['Decision Making', 'Resilience'],
                sentiment_score: 0,
                primary_finding: 'Partial insight detected.',
                detailed_analysis: 'The story has a strong core idea, but needs more clarity and positive outcome details.',
            };

            const fallbackRecs: Recommendation[] = [
                {
                    id: `rec-${currentRound + 1}-fallback-1`,
                    area_of_improvement: 'Clarity',
                    priority_level: 'high',
                    description: 'Practice writing a short arc with a strong hero, conflict, action, and resolution.'
                }
            ];

            setAnalysis(fallback);
            setRecommendations(fallbackRecs);
            setSlideResults((prev) => [...prev, { slide: currentRound + 1, image, analysis: fallback, recommendations: fallbackRecs }]);

            if (!auto) {
                toast.error('Analysis failed, a fallback summary has been saved.');
            }
        } finally {
            setLoading(false);
            goToNextRound();
        }
    }, [currentRound, phase, user, story, image, roundTimeLeft, hasSubmittedCurrentSlide, goToNextRound]);

    useEffect(() => {
        if (sessionComplete) return;

        const timer = setTimeout(() => {
            if (roundTimeLeft > 0) {
                setRoundTimeLeft((prev) => prev - 1);
                return;
            }

            if (phase === 'observe') {
                setPhase('write');
                setRoundTimeLeft(tatWritingSeconds);
                return;
            }

            if (phase === 'write') {
                void submitCurrentSlide(true);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [roundTimeLeft, phase, sessionComplete, submitCurrentSlide]);

    useEffect(() => {
        const selected = shuffleArray(tatImagePool).slice(0, 11);
        setTatSlides([...selected, '']);
    }, []);

    useEffect(() => {
        if (tatSlides.length === totalTatRounds) {
            setImage(tatSlides[currentRound] || null);
        }
    }, [tatSlides, currentRound]);

    const handleSubmit = async () => {
        await submitCurrentSlide(false);
    };

    const handleFinishTest = () => {
        if (analysis) {
            navigate('/analysis', { state: { analysis, recommendations } });
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    if (authLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;

    if (sessionComplete) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 px-4">
                    <Card className="max-w-xl border-green-500/20 bg-slate-900/90">
                        <CardHeader>
                            <CardTitle>12-Slide TAT Session Complete</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-slate-300">You have completed all 12 slides. Review your last story analysis or head back to the dashboard to continue training.</p>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Button className="w-full" onClick={handleFinishTest} disabled={!analysis}>
                                    Review Latest Analysis
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
                                    Return to Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="p-8 max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-primary">TAT Thematic Apperception Test</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Main Practice Area */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-muted-foreground">Slide {currentRound + 1} / {totalTatRounds}</div>
                                        <div className="text-lg font-bold text-primary">
                                            {phase === 'observe' ? 'Observation Phase' : 'Writing Phase'}
                                        </div>
                                    </div>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        Time left: {formatTime(roundTimeLeft)}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-6">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {phase === 'observe'
                                            ? 'Observe the image for 30 seconds. Note characters, mood, and possible story flow.'
                                            : currentRound === totalTatRounds - 1
                                                ? 'This is the blank slide. Write any story that reflects your personality and officer-like qualities.'
                                                : 'Write your story for this image. Include hero, situation, action, and a positive outcome.'
                                        }
                                    </p>
                                    {currentRound === totalTatRounds - 1 ? (
                                        <div className="h-64 rounded-xl border border-dashed border-white/20 bg-slate-950/70 flex items-center justify-center text-slate-500">
                                            <span className="text-center px-6">Blank Slide — create a story freely</span>
                                        </div>
                                    ) : (
                                        image && (
                                            <img
                                                src={image.startsWith('http') ? image : isPublicTatPath(image) ? image : buildBackendUrl(image)}
                                                alt="TAT Stimulus"
                                                className="rounded-lg shadow-lg max-h-64 mx-auto object-cover"
                                            />
                                        )
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <p className="text-sm font-medium">Write your story (min 100 words):</p>
                                    <textarea 
                                        className="w-full p-4 border rounded-lg h-40 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Write your story here. Consider: What do you see? What led to this situation? What are they thinking/feeling? What will happen next?"
                                        value={story}
                                        onChange={(e) => setStory(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Word count: {story.split(/\s+/).filter(w => w.length > 0).length}</p>

                                    <Button 
                                        onClick={handleSubmit}
                                        disabled={loading || story.split(/\s+/).filter(w => w.length > 0).length < 100}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                AI Agent Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Brain className="h-4 w-4 mr-2" />
                                                Submit for AI Analysis
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Info Sidebar */}
                    <div>
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="text-base">Instructions</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-3">
                                <div>
                                    <p className="font-semibold text-primary mb-1">📝 Your Task:</p>
                                    <p className="text-muted-foreground">Create a realistic story based on the image. Think about characters, emotions, and outcomes.</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-primary mb-1">⏱️ Time:</p>
                                    <p className="text-muted-foreground">12 slides total. Observe each picture for 30 seconds and write for 4 minutes.</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-primary mb-1">🎯 What We Analyze:</p>
                                    <p className="text-muted-foreground">OLQs (Officer Like Qualities), psychological traits, and communication style.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Analysis Results */}
                {analysis && (
                    <div className="space-y-6">
                        <Card className="border-2 border-green-500/20 bg-green-50 dark:bg-green-950/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <TrendingUp className="h-5 w-5" />
                                    AI Performance Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-white dark:bg-background rounded-lg">
                                        <div className="text-2xl font-bold text-primary">{analysis.overall_score}/10</div>
                                        <div className="text-xs text-muted-foreground">Overall Score</div>
                                    </div>
                                    <div className="text-center p-3 bg-white dark:bg-background rounded-lg">
                                        <div className="text-2xl font-bold text-primary">{Math.round(analysis.sentiment_score * 100)}</div>
                                        <div className="text-xs text-muted-foreground">Sentiment Score</div>
                                    </div>
                                    <div className="text-center p-3 bg-white dark:bg-background rounded-lg">
                                        <div className="text-2xl font-bold text-primary">{analysis.spontaneity_score}/10</div>
                                        <div className="text-xs text-muted-foreground">Spontaneity</div>
                                    </div>
                                    <div className="text-center p-3 bg-white dark:bg-background rounded-lg">
                                        <div className="text-2xl font-bold text-primary">{analysis.confidence_score}%</div>
                                        <div className="text-xs text-muted-foreground">Confidence</div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-2">Key Findings</h4>
                                    <p className="text-muted-foreground">{analysis.primary_finding}</p>
                                </div>

                                {analysis.olq_indicators && analysis.olq_indicators.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Officer Like Qualities Detected</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.olq_indicators.map((olq: string, idx: number) => (
                                                <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                                    {olq}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {analysis.detailed_analysis && (
                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-2">Detailed Feedback</h4>
                                        <p className="text-muted-foreground whitespace-pre-wrap text-sm">{analysis.detailed_analysis}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {recommendations && recommendations.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personalized Improvement Recommendations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {recommendations.map((rec: Recommendation, idx: number) => (
                                            <div key={idx} className="p-4 border rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold">{rec.area_of_improvement}</h4>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                        rec.priority_level === 'high' ? 'bg-red-100 text-red-700' :
                                                        rec.priority_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                        {rec.priority_level.toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                                                <div>
                                                    <p className="text-xs font-semibold mb-2">Steps to improve:</p>
                                                    <ul className="text-sm space-y-1">
                                                        {rec.actionable_steps?.map((step: string, stepIdx: number) => (
                                                            <li key={stepIdx} className="text-muted-foreground">• {step}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Button onClick={handleFinishTest} className="w-full" size="lg">
                            View Full Analysis & History
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
};

export default TATPractice;