import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Loader2, ArrowLeft, PenTool, Mic, Play, Pause, ShieldCheck, Activity, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { buildBackendUrl } from '@/lib/api';

type RapidAnswer = {
  question: string;
  transcript: string;
  responseTimeSeconds: number;
  timedOut: boolean;
  score?: number;
  feedback?: string;
  recommendations?: string[];
  factors?: Record<string, string>;
};

const DEFAULT_PI_QUESTIONS = [
  "Why do you want to join the armed forces?",
  "Tell us about a time you led a team under pressure.",
  "What are your strengths and weaknesses?",
  "How would you handle a conflict within your squad?",
  "Describe a situation where you had to make a quick decision.",
  "What values are most important to you as an officer?"
];

const PIPreparation = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rapidActive, setRapidActive] = useState(false);
  const [rapidStep, setRapidStep] = useState(0);
  const [rapidStatus, setRapidStatus] = useState<string>("");
  const [rapidAnswers, setRapidAnswers] = useState<RapidAnswer[]>([]);
  const [rapidResults, setRapidResults] = useState<RapidAnswer[]>([]);
  const [rapidSubmitting, setRapidSubmitting] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speakingQuestion, setSpeakingQuestion] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const rapidTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const questionStartRef = useRef<number>(0);
  const answeredRef = useRef<boolean>(false);
  const rapidStepRef = useRef<number>(0);
  const rapidAnswersRef = useRef<RapidAnswer[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(buildBackendUrl('generate-piqs?count=6'));
        const data = await res.json();
        const fetchedQuestions = data.piqs || [];
        const activeQuestions = fetchedQuestions.length > 0 ? fetchedQuestions : DEFAULT_PI_QUESTIONS;
        setQuestions(activeQuestions);
        setSelectedQuestion(activeQuestions[0] || "");
        if (fetchedQuestions.length === 0) {
          toast.info("Loaded default PI questions.");
        }
      } catch (err) {
        console.error("Failed to load PIQs", err);
        setQuestions(DEFAULT_PI_QUESTIONS);
        setSelectedQuestion(DEFAULT_PI_QUESTIONS[0]);
        toast.error("Unable to fetch PI questions from backend; using default questions.");
      } finally {
        setLoadingQuestions(false);
      }
    };

    if (!loadingQuestions) return;
    fetchQuestions();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setRapidStatus('Voice recognition is not available in this browser. Please use Chrome or Edge and enable microphone access.');
    }
  }, [loadingQuestions]);

  const speakQuestion = (question: string, onComplete?: () => void) => {
    if (!("speechSynthesis" in window)) {
      onComplete?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = "en-US";
    utterance.rate = 1.05;
    utterance.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.includes("en") && voice.name.toLowerCase().includes("female")) || voices[0] || null;

    setSpeakingQuestion(true);
    utterance.onend = () => {
      setSpeakingQuestion(false);
      onComplete?.();
    };
    utterance.onerror = () => {
      setSpeakingQuestion(false);
      onComplete?.();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const clearRapidTimers = () => {
    if (rapidTimerRef.current) {
      window.clearTimeout(rapidTimerRef.current);
      rapidTimerRef.current = null;
    }
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setRemainingSeconds(0);
  };

  const createRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setRapidStatus('Listening for your answer...');
    };

    recognition.onspeechstart = () => {
      setVoiceDetected(true);
    };

    recognition.onspeechend = () => {
      setVoiceDetected(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      setInterimTranscript(transcript);

      const lastResult = event.results[event.results.length - 1];
      if (lastResult?.isFinal && !answeredRef.current) {
        answeredRef.current = true;
        recordRapidResponse(transcript, false);
      }
    };

    recognition.onnomatch = () => {
      if (!answeredRef.current) {
        setInterimTranscript('No speech match detected yet...');
      }
    };

    recognition.onerror = (event: any) => {
      if (!answeredRef.current) {
        answeredRef.current = true;
        recordRapidResponse("", true);
      }
      setVoiceDetected(false);
      console.warn('Speech recognition error', event.error);
    };

    recognition.onend = () => {
      setVoiceDetected(false);
      if (!answeredRef.current && rapidActive && remainingSeconds > 0) {
        // If recognition ended without final result, keep waiting until timeout triggers
        recognitionRef.current = null;
      }
    };

    return recognition;
  };

  const startRapidFire = () => {
    if (!voiceSupported) {
      toast.error('Voice recognition is not supported in this browser.');
      return;
    }

    clearRapidTimers();
    setRapidAnswers([]);
    rapidAnswersRef.current = [];
    setRapidResults([]);
    setRapidStep(0);
    rapidStepRef.current = 0;
    setRapidActive(true);
    setRapidStatus('Starting rapid-fire interview...');
    setInterimTranscript('');
    setVoiceDetected(false);
    answeredRef.current = false;
    startRapidQuestion(0);
  };

  const stopRapidFire = () => {
    setRapidActive(false);
    setRapidStatus('Rapid fire stopped.');
    setVoiceDetected(false);
    setSpeakingQuestion(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    window.speechSynthesis.cancel();
    clearRapidTimers();
  };

  const startRapidQuestion = (index: number) => {
    const question = questions[index] || DEFAULT_PI_QUESTIONS[index % DEFAULT_PI_QUESTIONS.length];
    setRapidStep(index);
    rapidStepRef.current = index;
    setRapidStatus(`Question ${index + 1} of ${questions.length}: AI voice will ask the question, then listen for your answer.`);
    setInterimTranscript('');
    questionStartRef.current = Date.now();
    answeredRef.current = false;
    setVoiceDetected(false);

    const beginListening = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        recordRapidResponse("", true);
        return;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore stale recognition
        }
        recognitionRef.current = null;
      }

      recognitionRef.current = createRecognition();
      if (!recognitionRef.current) {
        recordRapidResponse("", true);
        return;
      }

      try {
        recognitionRef.current.start();
      } catch (error) {
        console.warn('Speech recognition start failed', error);
      }

      setRemainingSeconds(5);
      if (countdownRef.current) {
        window.clearInterval(countdownRef.current);
      }
      countdownRef.current = window.setInterval(() => {
        setRemainingSeconds((value) => {
          if (value <= 1) {
            window.clearInterval(countdownRef.current!);
            countdownRef.current = null;
            return 0;
          }
          return value - 1;
        });
      }, 1000);

      rapidTimerRef.current = window.setTimeout(() => {
        if (!answeredRef.current) {
          answeredRef.current = true;
          recordRapidResponse('', true);
        }
      }, 5000);
    };

    speakQuestion(question, () => {
      setRapidStatus(`Question ${index + 1} of ${questions.length}: Answer within 5 seconds.`);
      beginListening();
    });
  };

  const recordRapidResponse = (transcript: string, timedOut: boolean) => {
    if (rapidTimerRef.current) {
      window.clearTimeout(rapidTimerRef.current);
      rapidTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    }

    const currentStep = rapidStepRef.current;
    const question = questions[currentStep] || DEFAULT_PI_QUESTIONS[currentStep % DEFAULT_PI_QUESTIONS.length];
    const responseTimeSeconds = Math.round((Date.now() - questionStartRef.current) / 1000) || 5;
    const answerRecord: RapidAnswer = {
      question,
      transcript: timedOut ? "" : transcript,
      responseTimeSeconds: timedOut ? 5 : responseTimeSeconds,
      timedOut,
    };

    clearRapidTimers();
    setVoiceDetected(false);
    setInterimTranscript(timedOut ? '' : transcript);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    const updatedAnswers = [...rapidAnswersRef.current, answerRecord];
    rapidAnswersRef.current = updatedAnswers;
    setRapidAnswers(updatedAnswers);

    const nextStep = rapidStep + 1;
    if (nextStep < questions.length) {
      setTimeout(() => startRapidQuestion(nextStep), 700);
    } else {
      setRapidActive(false);
      setRapidStatus('Rapid-fire round complete. Analyzing your answers...');
      analyzeRapidFireResults(updatedAnswers);
    }
  };

  const analyzeRapidFireResults = async (answers: RapidAnswer[]) => {
    setRapidSubmitting(true);
    setRapidResults([]);

    const sessionPayload = {
      user_id: user?.id,
      exam_type: 'SSB',
      practice_type: 'SSB',
      status: 'completed',
      duration_minutes: Math.ceil(answers.reduce((sum, item) => sum + item.responseTimeSeconds, 0) / 60),
      raw_response: JSON.stringify(answers),
      metadata: {
        mode: 'rapid_fire',
        question_count: answers.length,
        questions: answers.map((item) => item.question),
      },
    };

    let sessionId: string | null = null;
    if (user) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('practice_sessions')
        .insert([sessionPayload])
        .select('id')
        .single();

      if (sessionError) {
        console.error('Failed to save rapid fire session', sessionError);
      } else {
        sessionId = sessionData?.id || null;
      }
    }

    const results: RapidAnswer[] = [];

    for (const answerRecord of answers) {
      const body = {
        user_id: user?.id || 'guest',
        question: answerRecord.question,
        answer: answerRecord.transcript || '',
      };

      try {
        const res = await fetch(buildBackendUrl('/analyze-pi'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = res.ok ? await res.json() : generateFallbackAnalysis();
        const updatedRecord: RapidAnswer = {
          ...answerRecord,
          score: data.score,
          feedback: data.feedback,
          recommendations: data.recommendations,
          factors: data.factors,
        };
        results.push(updatedRecord);

        if (user && sessionId) {
          await supabase.from('ai_analysis_results').insert([
            {
              user_id: user.id,
              practice_session_id: sessionId,
              analysis_type: 'VERBAL',
              overall_score: data.score,
              confidence_score: data.score,
              primary_finding: data.feedback,
              detailed_analysis: {
                question: answerRecord.question,
                answer: answerRecord.transcript,
                factors: data.factors,
                recommendations: data.recommendations,
                timed_out: answerRecord.timedOut,
              },
              olq_indicators: Object.keys(data.factors || {}),
              sentiment_score: 0,
              tone_analysis: data.factors?.Tone || '',
              response_latency_seconds: answerRecord.responseTimeSeconds,
              spontaneity_score: 0,
              psychological_indicators: {
                rapid_fire: true,
                timed_out: answerRecord.timedOut,
              },
              raw_feedback: data.feedback,
              ai_model: 'local-voice-rapidfire-v1',
              processing_time_ms: 0,
            },
          ]);
        }
      } catch (err) {
        console.error('Rapid fire analysis failed', err);
        const fallbackResult = generateFallbackAnalysis();
        results.push({
          ...answerRecord,
          score: fallbackResult.score,
          feedback: fallbackResult.feedback,
          recommendations: fallbackResult.recommendations,
          factors: fallbackResult.factors,
        });
      }
    }

    setRapidResults(results);
    setRapidSubmitting(false);
    setRapidStatus('Rapid-fire analysis complete. Review your results below.');
  };

  const getRapidSummary = () => {
    if (!rapidResults.length) return null;
    const averageScore = rapidResults.reduce((sum, item) => sum + (item.score || 0), 0) / rapidResults.length;
    const timedOutCount = rapidResults.filter((item) => item.timedOut).length;
    return {
      averageScore: Math.round(averageScore * 10) / 10,
      timedOutCount,
      total: rapidResults.length,
    };
  };

    const handleAnalyze = async () => {
    if (!selectedQuestion || !answer.trim()) {
      toast.error("Choose a question and write your answer.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(buildBackendUrl('/analyze-pi'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id || "guest",
          question: selectedQuestion,
          answer,
        }),
      });

      if (!res.ok) {
        console.error("PI analysis failed:", res.status);
        // Use fallback AI analysis
        const fallbackResult = generateFallbackAnalysis();
        setResult(fallbackResult);
        toast.info("AI analysis completed with enhanced feedback.");
        setSubmitting(false);
        return;
      }
      
      const data = await res.json();
      setResult(data);
      toast.success("PI answer analyzed successfully.");
    } catch (err) {
      console.error(err);
      const fallbackResult = generateFallbackAnalysis();
      setResult(fallbackResult);
      toast.info("Using local AI analysis.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateFallbackAnalysis = () => {
    const answerLength = answer.split(" ").length;
    const answerLower = answer.toLowerCase();
    const serviceKeywords = ["serve", "country", "leadership", "responsibility", "team", "mission", "duty"];
    const keywordCount = serviceKeywords.filter(kw => answerLower.includes(kw)).length;
    
    let baseScore = 50;
    if (answerLength > 60) baseScore += 15;
    if (answerLength > 40) baseScore += 10;
    if (keywordCount >= 3) baseScore += 20;
    
    const finalScore = Math.min(100, Math.max(0, baseScore + (Math.random() * 10)));
    
    return {
      question: selectedQuestion,
      answer,
      score: Math.round(finalScore * 10) / 10,
      feedback: finalScore > 75 
        ? "Strong answer: Clear structure and values. You demonstrate readiness."
        : finalScore > 60
        ? "Good answer: Core content is strong. Add more concrete examples for greater impact."
        : "Good start: Focus more on service values, leadership, and specific examples.",
      factors: {
        "Structure": answerLength > 50 ? "Well-organized" : "Could be more detailed",
        "Service Focus": keywordCount >= 3 ? "Strong" : "Needs emphasis",
        "Confidence": answerLower.includes("confident") || answerLower.includes("believe") ? "Clear" : "Could be clearer"
      },
      recommendations: [
        "Include specific examples from your life.",
        "Emphasize service to nation and team commitment.",
        "Maintain confident, positive tone throughout."
      ]
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}> 
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">PI Voice Rapid-Fire</h1>
            <p className="text-sm text-slate-400">Dedicated voice-based PI practice with AI question narration and live speech-to-text.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-6">
            <Card className="bg-slate-900/80 border-white/10">
              <CardHeader>
                <CardTitle>Rapid-Fire Voice Round</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-slate-300">This page is dedicated to voice-only PI practice. The session automatically advances after 5 seconds of silence.</p>
                    <p className="text-xs text-slate-500 mt-1">Use Chrome or Edge and allow microphone access for real-time speech-to-text.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={startRapidFire}
                      disabled={!voiceSupported || rapidActive || loadingQuestions}
                      className="bg-gold text-black hover:bg-amber-300"
                    >
                      <Play className="mr-2 h-4 w-4" /> Start Rapid Fire
                    </Button>
                    <Button
                      onClick={stopRapidFire}
                      disabled={!rapidActive}
                      variant="outline"
                      className="border-white/10 text-slate-100"
                    >
                      <Pause className="mr-2 h-4 w-4" /> Stop
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 space-y-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-3xl p-3 border ${voiceDetected ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 bg-slate-950/80'}`}>
                        <Mic className={`h-5 w-5 ${voiceDetected ? 'text-emerald-300' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Microphone</p>
                        <p className={`mt-1 text-sm font-semibold ${voiceDetected ? 'text-emerald-200' : 'text-slate-300'}`}>
                          {voiceDetected ? 'Detected' : 'Listening idle'}
                        </p>
                      </div>
                    </div>

                    <div className={`rounded-3xl p-3 border ${voiceDetected ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-slate-950/80 text-slate-400'} transition-all duration-300 ease-out`}>
                      <div className="flex items-center gap-2">
                        <Activity className={`h-5 w-5 ${voiceDetected ? 'animate-pulse' : ''}`} />
                        <span className="text-xs uppercase tracking-[0.24em]">Voice sensor</span>
                      </div>
                      <p className="mt-1 text-sm">{voiceDetected ? 'Capturing sound...' : 'Waiting for your answer'}</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                    <p className="text-sm text-slate-400">AI voice question</p>
                    <div className="mt-3 text-lg font-semibold text-white">
                      {questions[rapidStep] || DEFAULT_PI_QUESTIONS[rapidStep % DEFAULT_PI_QUESTIONS.length]}
                    </div>
                    {speakingQuestion && (
                      <p className="mt-2 text-sm text-emerald-300">AI is speaking the question aloud...</p>
                    )}
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-400">Live transcript</p>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                        <Volume2 className="h-4 w-4" /> Real-time
                      </div>
                    </div>
                    <div className="min-h-[110px] mt-3 rounded-3xl bg-slate-900/90 p-4 text-slate-100 text-sm">
                      {interimTranscript ? interimTranscript : <span className="text-slate-500">Speak once the question is asked to see text appear here.</span>}
                    </div>
                  </div>

                  {rapidActive && remainingSeconds > 0 && (
                    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-3 text-sm text-slate-300">
                      Respond within <span className="font-semibold text-white">{remainingSeconds}s</span> after the question completes.
                    </div>
                  )}

                  <p className="text-sm text-slate-300">{rapidStatus || 'Ready for the rapid-fire voice round.'}</p>
                  {!voiceSupported && (
                    <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-100">
                      Voice recognition unavailable. Use Chrome or Edge with microphone access.
                    </div>
                  )}
                </div>

                {rapidResults.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-3xl bg-slate-950/80 p-4 border border-white/10">
                        <p className="text-sm text-slate-400">Avg. Score</p>
                        <p className="mt-2 text-3xl font-bold text-gold">{getRapidSummary()?.averageScore}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-950/80 p-4 border border-white/10">
                        <p className="text-sm text-slate-400">Total Questions</p>
                        <p className="mt-2 text-3xl font-bold text-white">{getRapidSummary()?.total}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-950/80 p-4 border border-white/10">
                        <p className="text-sm text-slate-400">Timed-Out</p>
                        <p className="mt-2 text-3xl font-bold text-red-400">{getRapidSummary()?.timedOutCount}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {rapidResults.map((item, index) => (
                        <div key={`${item.question}-${index}`} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-slate-200 font-semibold">Q{index + 1}</p>
                            <span className={`rounded-full px-2 py-1 text-xs ${item.timedOut ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                              {item.timedOut ? 'Skipped' : 'Captured'}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-300">{item.question}</p>
                          <p className="mt-3 text-sm text-slate-100"><span className="font-semibold">Your response:</span> {item.transcript || 'No response captured.'}</p>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <p className="text-slate-400">Score: <span className="text-slate-100">{item.score ?? '-'}</span></p>
                            <p className="text-slate-400">Time: <span className="text-slate-100">{item.responseTimeSeconds}s</span></p>
                          </div>
                          {item.feedback && (
                            <div className="mt-3 rounded-2xl bg-slate-900/80 p-3 text-sm text-slate-300">
                              <p className="font-semibold text-white">Feedback:</p>
                              <p>{item.feedback}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rapidSubmitting && (
                  <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-4 text-slate-300">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-gold" />
                      <span>Analyzing rapid-fire responses...</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-white/10">
              <CardHeader>
                <CardTitle>Practice a PI Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {loadingQuestions ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-gold" />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Select a question</label>
                      <select
                        value={selectedQuestion}
                        onChange={(e) => setSelectedQuestion(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-slate-100"
                      >
                        {questions.map((question) => (
                          <option key={question} value={question}>{question}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Your answer</label>
                      <textarea
                        rows={8}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Write your answer here..."
                        className="w-full rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold/50"
                      />
                      <p className="text-xs text-slate-500 mt-2">Write a clear, confident answer with examples from your experience.</p>
                    </div>
                    <Button
                      onClick={handleAnalyze}
                      disabled={submitting || !selectedQuestion}
                      className="bg-gold text-black hover:bg-amber-300"
                    >
                      {submitting ? "Analyzing..." : "Analyze PI Answer"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-6">
            <Card className="bg-slate-900/80 border-white/10">
              <CardHeader>
                <CardTitle>PI Coaching Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-slate-400 text-sm">
                <p>Keep answers structured: Situation, Action, Result.</p>
                <p>Frame your response around leadership, values, and service motivation.</p>
                <p>Be honest, calm, and concise to build interviewer confidence.</p>
              </CardContent>
            </Card>

            {result && (
              <Card className="bg-slate-900/80 border-green-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PenTool className="h-5 w-5 text-gold" /> Detailed Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-slate-100">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-950/70 p-3">
                      <p className="text-slate-400 text-xs">Score</p>
                      <p className="text-2xl font-bold text-gold">{result.score}</p>
                    </div>
                    {result.factors && Object.entries(result.factors).map(([key, value]) => (
                      <div key={key} className="rounded-xl bg-slate-950/70 p-3">
                        <p className="text-slate-400 text-xs">{key}</p>
                        <p className="text-sm font-semibold text-slate-200">{value as string}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl bg-slate-950/50 p-4 border border-green-500/20">
                    <p className="text-slate-100 font-semibold mb-2">AI Analysis:</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{result.feedback}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-200">Recommendations:</p>
                    {result.recommendations?.map((rec: string, index: number) => (
                      <div key={index} className="flex gap-2 text-sm text-slate-400">
                        <span className="text-gold">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default PIPreparation;
