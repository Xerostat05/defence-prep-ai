import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageSquare, Eye, ClipboardList, Timer, Brain, CheckCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

// WAT word bank
const watWords = [
  "Duty", "Courage", "Leader", "Fear", "Attack", "Help", "Enemy", "War", "Peace", "Mother",
  "Sacrifice", "Team", "Danger", "Victory", "Night", "Gun", "Friend", "Failure", "March", "Blood",
  "Order", "Fire", "Country", "Discipline", "Alone", "Desert", "Flag", "Command", "Crisis", "Trust",
];

// TAT themes
const tatThemes = [
  { id: 1, theme: "A group of soldiers in a difficult terrain", description: "You see soldiers navigating through a dense forest with heavy equipment. One soldier appears to be injured." },
  { id: 2, theme: "A young officer facing a crowd", description: "A young officer stands before a group of civilians during what appears to be a tense situation in a village." },
  { id: 3, theme: "A person standing at a crossroads", description: "A person in uniform stands at a crossroads at dawn. One path leads to mountains, the other to a city." },
  { id: 4, theme: "An emergency situation", description: "There's flooding in a village. People are stranded on rooftops. A rescue team has just arrived." },
  { id: 5, theme: "A celebration scene", description: "A group of cadets have just completed their training. The passing out parade is about to begin." },
];

// SRT situations
const srtSituations = [
  "While on patrol, your team spots suspicious movement near the border fence at night. Your radio is not working. You would...",
  "During a group task, two of your team members start arguing and refuse to cooperate. As the team leader, you would...",
  "You discover that a senior officer has made an error in the operational plan that could endanger your platoon. You would...",
  "While traveling by train, you notice a co-passenger has left behind a suspicious bag and got off at the last station. You would...",
  "During a natural disaster, you are assigned to lead rescue operations but have limited resources and many victims. You would...",
  "Your best friend in the unit has been caught stealing from the mess fund. You would...",
  "You are posted to a remote area and local villagers are hostile due to a previous incident with the army. You would...",
  "During a route march, one of your soldiers collapses from heat exhaustion and the nearest medical facility is 10 km away. You would...",
  "You receive conflicting orders from two superior officers during an operation. You would...",
  "A junior soldier confides that he is being bullied by seniors and wants to leave the service. You would...",
];

type EvaluationResult = {
  overall_score: number;
  olq_indicators: string[];
  strengths: string[];
  improvements: string[];
  detailed_feedback: any[];
};

const SSBPractice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // WAT State
  const [watStarted, setWatStarted] = useState(false);
  const [watCurrentIndex, setWatCurrentIndex] = useState(0);
  const [watResponses, setWatResponses] = useState<{ word: string; response: string; timeTaken: number }[]>([]);
  const [watInput, setWatInput] = useState("");
  const [watTimer, setWatTimer] = useState(15);
  const [watTimerInterval, setWatTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [watCount] = useState(10);

  // TAT State
  const [tatStarted, setTatStarted] = useState(false);
  const [tatCurrentIndex, setTatCurrentIndex] = useState(0);
  const [tatResponses, setTatResponses] = useState<{ theme: string; story: string; timeTaken: number }[]>([]);
  const [tatInput, setTatInput] = useState("");
  const [tatTimer, setTatTimer] = useState(240);
  const [tatTimerInterval, setTatTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // SRT State
  const [srtStarted, setSrtStarted] = useState(false);
  const [srtCurrentIndex, setSrtCurrentIndex] = useState(0);
  const [srtResponses, setSrtResponses] = useState<{ situation: string; reaction: string; timeTaken: number }[]>([]);
  const [srtInput, setSrtInput] = useState("");
  const [srtTimer, setSrtTimer] = useState(30);
  const [srtTimerInterval, setSrtTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [srtCount] = useState(8);

  // Evaluation
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [activeTestType, setActiveTestType] = useState<string>("wat");

  // --- WAT Logic ---
  const startWAT = () => {
    setWatStarted(true);
    setWatCurrentIndex(0);
    setWatResponses([]);
    setWatInput("");
    setEvaluation(null);
    startWatTimer();
  };

  const startWatTimer = () => {
    setWatTimer(15);
    const interval = setInterval(() => {
      setWatTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          submitWatResponse(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setWatTimerInterval(interval);
  };

  const submitWatResponse = (timeout = false) => {
    if (watTimerInterval) clearInterval(watTimerInterval);
    const wordSet = watWords.slice(0, watCount);
    const response = {
      word: wordSet[watCurrentIndex],
      response: watInput.trim() || "(no response)",
      timeTaken: 15 - watTimer,
    };
    const newResponses = [...watResponses, response];
    setWatResponses(newResponses);
    setWatInput("");

    if (watCurrentIndex + 1 >= watCount) {
      setWatStarted(false);
      evaluateResponses("wat", newResponses);
    } else {
      setWatCurrentIndex(prev => prev + 1);
      startWatTimer();
    }
  };

  // --- TAT Logic ---
  const startTAT = () => {
    setTatStarted(true);
    setTatCurrentIndex(0);
    setTatResponses([]);
    setTatInput("");
    setEvaluation(null);
    startTatTimer();
  };

  const startTatTimer = () => {
    setTatTimer(240);
    const interval = setInterval(() => {
      setTatTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          submitTatResponse();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTatTimerInterval(interval);
  };

  const submitTatResponse = () => {
    if (tatTimerInterval) clearInterval(tatTimerInterval);
    const response = {
      theme: tatThemes[tatCurrentIndex].theme,
      story: tatInput.trim() || "(no story written)",
      timeTaken: 240 - tatTimer,
    };
    const newResponses = [...tatResponses, response];
    setTatResponses(newResponses);
    setTatInput("");

    if (tatCurrentIndex + 1 >= 3) {
      setTatStarted(false);
      evaluateResponses("tat", newResponses);
    } else {
      setTatCurrentIndex(prev => prev + 1);
      startTatTimer();
    }
  };

  // --- SRT Logic ---
  const startSRT = () => {
    setSrtStarted(true);
    setSrtCurrentIndex(0);
    setSrtResponses([]);
    setSrtInput("");
    setEvaluation(null);
    startSrtTimer();
  };

  const startSrtTimer = () => {
    setSrtTimer(30);
    const interval = setInterval(() => {
      setSrtTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          submitSrtResponse();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setSrtTimerInterval(interval);
  };

  const submitSrtResponse = () => {
    if (srtTimerInterval) clearInterval(srtTimerInterval);
    const response = {
      situation: srtSituations[srtCurrentIndex],
      reaction: srtInput.trim() || "(no response)",
      timeTaken: 30 - srtTimer,
    };
    const newResponses = [...srtResponses, response];
    setSrtResponses(newResponses);
    setSrtInput("");

    if (srtCurrentIndex + 1 >= srtCount) {
      setSrtStarted(false);
      evaluateResponses("srt", newResponses);
    } else {
      setSrtCurrentIndex(prev => prev + 1);
      startSrtTimer();
    }
  };

  // --- AI Evaluation ---
  const evaluateResponses = async (type: string, responses: any[]) => {
    setEvaluating(true);
    setActiveTestType(type);
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-ssb", {
        body: { type, responses },
      });
      if (error) throw error;
      setEvaluation(data);
    } catch (e: any) {
      console.error("Evaluation error:", e);
      toast({ title: "Evaluation Error", description: e.message || "Failed to get AI evaluation", variant: "destructive" });
    } finally {
      setEvaluating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
  };

  const resetAll = () => {
    setEvaluation(null);
    setWatStarted(false);
    setTatStarted(false);
    setSrtStarted(false);
    setWatResponses([]);
    setTatResponses([]);
    setSrtResponses([]);
    if (watTimerInterval) clearInterval(watTimerInterval);
    if (tatTimerInterval) clearInterval(tatTimerInterval);
    if (srtTimerInterval) clearInterval(srtTimerInterval);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="bg-primary py-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <Button variant="ghost" onClick={() => navigate("/exam/ssb-interview")} className="text-primary-foreground/60 hover:text-gold hover:bg-gold/10 mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to SSB
            </Button>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-sm font-semibold tracking-widest text-gold uppercase">SSB Practice</span>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mt-2 mb-2">
                Psychological Tests Practice
              </h1>
              <p className="text-primary-foreground/60 max-w-xl font-body">
                Timed WAT, TAT & SRT exercises with real-time AI evaluation of your Officer Like Qualities
              </p>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {/* Evaluation Results */}
          <AnimatePresence>
            {(evaluating || evaluation) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8"
              >
                {evaluating ? (
                  <Card className="border-gold/30">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-10 w-10 text-gold animate-spin mb-4" />
                      <p className="text-lg font-display font-semibold text-foreground">AI is evaluating your responses...</p>
                      <p className="text-sm text-muted-foreground mt-1">Analyzing Officer Like Qualities</p>
                    </CardContent>
                  </Card>
                ) : evaluation && (
                  <Card className="border-gold/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-display flex items-center gap-2">
                          <Brain className="h-5 w-5 text-gold" />
                          AI Evaluation — {activeTestType.toUpperCase()}
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={resetAll}>
                          <RotateCcw className="h-4 w-4 mr-1" /> Try Again
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Score */}
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-display font-bold text-gold">{evaluation.overall_score}/10</div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">Overall Performance</p>
                          <Progress value={evaluation.overall_score * 10} className="h-3" />
                        </div>
                      </div>

                      {/* OLQ Indicators */}
                      {evaluation.olq_indicators?.length > 0 && (
                        <div>
                          <h4 className="font-display font-semibold text-foreground mb-2">OLQ Indicators Detected</h4>
                          <div className="flex flex-wrap gap-2">
                            {evaluation.olq_indicators.map((olq, i) => (
                              <span key={i} className="px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-medium">{olq}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strengths & Improvements */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-secondary/5 rounded-lg p-4">
                          <h4 className="font-display font-semibold text-secondary mb-2">✅ Strengths</h4>
                          <ul className="space-y-1">
                            {evaluation.strengths?.map((s, i) => (
                              <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-destructive/5 rounded-lg p-4">
                          <h4 className="font-display font-semibold text-destructive mb-2">🔧 Areas to Improve</h4>
                          <ul className="space-y-1">
                            {evaluation.improvements?.map((s, i) => (
                              <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Detailed Feedback */}
                      {evaluation.detailed_feedback?.length > 0 && (
                        <div>
                          <h4 className="font-display font-semibold text-foreground mb-3">Detailed Feedback</h4>
                          <div className="space-y-3">
                            {evaluation.detailed_feedback.map((fb: any, i: number) => (
                              <div key={i} className="bg-muted/30 rounded-lg p-4 border border-border">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-sm text-foreground">
                                    {fb.word ? `"${fb.word}" → "${fb.response || ""}"` : fb.theme || fb.situation?.slice(0, 60) + "..."}
                                  </span>
                                  {fb.score && <span className="text-gold font-bold text-sm">{fb.score}/10</span>}
                                </div>
                                <p className="text-xs text-muted-foreground">{fb.comment || fb.suggestion || fb.story_quality || ""}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Test Tabs */}
          {!evaluating && !evaluation && (
            <Tabs defaultValue="wat" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="wat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> WAT
                </TabsTrigger>
                <TabsTrigger value="tat" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" /> TAT
                </TabsTrigger>
                <TabsTrigger value="srt" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" /> SRT
                </TabsTrigger>
              </TabsList>

              {/* WAT Tab */}
              <TabsContent value="wat">
                {!watStarted ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display">Word Association Test (WAT)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground font-body">
                        You'll be shown <strong>{watCount} words</strong> one at a time. Write the <strong>first sentence</strong> that comes to your mind for each word. You have <strong>15 seconds</strong> per word — just like the real SSB.
                      </p>
                      <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                        <p>📌 Write a complete, meaningful sentence</p>
                        <p>📌 Show positive, action-oriented thinking</p>
                        <p>📌 Reflect Officer Like Qualities naturally</p>
                      </div>
                      <Button onClick={startWAT} className="w-full bg-gold text-accent-foreground hover:bg-gold-light font-semibold">
                        <Timer className="mr-2 h-4 w-4" /> Start WAT ({watCount} words)
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-gold/30">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-muted-foreground font-body">Word {watCurrentIndex + 1}/{watCount}</span>
                        <span className={`text-lg font-bold font-display ${watTimer <= 5 ? "text-destructive animate-pulse" : "text-gold"}`}>
                          {watTimer}s
                        </span>
                      </div>
                      <Progress value={(watCurrentIndex / watCount) * 100} className="mb-6 h-2" />
                      <div className="text-center mb-6">
                        <motion.h2
                          key={watCurrentIndex}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="font-display text-4xl md:text-5xl font-bold text-foreground"
                        >
                          {watWords[watCurrentIndex]}
                        </motion.h2>
                      </div>
                      <input
                        type="text"
                        value={watInput}
                        onChange={e => setWatInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && watInput.trim() && submitWatResponse()}
                        placeholder="Write a sentence..."
                        className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground font-body focus:outline-none focus:ring-2 focus:ring-gold"
                        autoFocus
                      />
                      <Button
                        onClick={() => submitWatResponse()}
                        disabled={!watInput.trim()}
                        className="w-full mt-3 bg-gold text-accent-foreground hover:bg-gold-light"
                      >
                        Next <CheckCircle className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* TAT Tab */}
              <TabsContent value="tat">
                {!tatStarted ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display">Thematic Apperception Test (TAT)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground font-body">
                        You'll be shown <strong>3 picture descriptions</strong>. Write a complete story for each in <strong>4 minutes</strong>. Your story should have a hero, a conflict, and a positive resolution.
                      </p>
                      <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                        <p>📌 Create a story with beginning, middle, and end</p>
                        <p>📌 Hero should display leadership and initiative</p>
                        <p>📌 End with a positive, realistic outcome</p>
                      </div>
                      <Button onClick={startTAT} className="w-full bg-gold text-accent-foreground hover:bg-gold-light font-semibold">
                        <Timer className="mr-2 h-4 w-4" /> Start TAT (3 pictures)
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-gold/30">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-muted-foreground font-body">Picture {tatCurrentIndex + 1}/3</span>
                        <span className={`text-lg font-bold font-display ${tatTimer <= 30 ? "text-destructive animate-pulse" : "text-gold"}`}>
                          {formatTime(tatTimer)}
                        </span>
                      </div>
                      <Progress value={(tatCurrentIndex / 3) * 100} className="mb-4 h-2" />
                      <div className="bg-muted/30 rounded-lg p-4 mb-4">
                        <h3 className="font-display font-semibold text-foreground mb-1">{tatThemes[tatCurrentIndex].theme}</h3>
                        <p className="text-sm text-muted-foreground font-body">{tatThemes[tatCurrentIndex].description}</p>
                      </div>
                      <textarea
                        value={tatInput}
                        onChange={e => setTatInput(e.target.value)}
                        placeholder="Write your story here..."
                        rows={8}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground font-body focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                        autoFocus
                      />
                      <Button
                        onClick={submitTatResponse}
                        disabled={!tatInput.trim()}
                        className="w-full mt-3 bg-gold text-accent-foreground hover:bg-gold-light"
                      >
                        {tatCurrentIndex + 1 >= 3 ? "Submit & Evaluate" : "Next Picture"} <CheckCircle className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* SRT Tab */}
              <TabsContent value="srt">
                {!srtStarted ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display">Situation Reaction Test (SRT)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground font-body">
                        You'll face <strong>{srtCount} real-life situations</strong>. Write your immediate reaction in <strong>30 seconds</strong> each. Be practical, decisive, and show leadership.
                      </p>
                      <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                        <p>📌 Be practical and action-oriented</p>
                        <p>📌 Show initiative and leadership</p>
                        <p>📌 Keep responses concise (1-2 sentences)</p>
                      </div>
                      <Button onClick={startSRT} className="w-full bg-gold text-accent-foreground hover:bg-gold-light font-semibold">
                        <Timer className="mr-2 h-4 w-4" /> Start SRT ({srtCount} situations)
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-gold/30">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-muted-foreground font-body">Situation {srtCurrentIndex + 1}/{srtCount}</span>
                        <span className={`text-lg font-bold font-display ${srtTimer <= 10 ? "text-destructive animate-pulse" : "text-gold"}`}>
                          {srtTimer}s
                        </span>
                      </div>
                      <Progress value={(srtCurrentIndex / srtCount) * 100} className="mb-4 h-2" />
                      <div className="bg-muted/30 rounded-lg p-4 mb-4">
                        <p className="text-foreground font-body font-medium">{srtSituations[srtCurrentIndex]}</p>
                      </div>
                      <textarea
                        value={srtInput}
                        onChange={e => setSrtInput(e.target.value)}
                        placeholder="Write your reaction..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground font-body focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                        autoFocus
                      />
                      <Button
                        onClick={submitSrtResponse}
                        disabled={!srtInput.trim()}
                        className="w-full mt-3 bg-gold text-accent-foreground hover:bg-gold-light"
                      >
                        {srtCurrentIndex + 1 >= srtCount ? "Submit & Evaluate" : "Next Situation"} <CheckCircle className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};

export default SSBPractice;
