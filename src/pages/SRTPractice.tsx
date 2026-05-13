import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Shield, Timer } from "lucide-react";
import { buildBackendUrl } from '@/lib/api';
import { useAuth } from "@/contexts/AuthContext";

interface SRTResult {
  situation: string;
  response: string;
  sentiment?: number;
  primary_olq?: string;
  feedback: string;
  session_type: string;
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

const SRTPractice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [situations, setSituations] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [results, setResults] = useState<SRTResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(1800);
  const [isSavingToBackend, setIsSavingToBackend] = useState(false);

  // Fetch SRT situations on component mount
  useEffect(() => {
    const fetchSRTSituations = async () => {
      try {
        const res = await fetch(buildBackendUrl('get-srt-situations?count=60'));
        const data = await res.json();
        setSituations(data.situations || []);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch SRT situations:", err);
        toast.error("Failed to load SRT situations. Using defaults.");
        // Fallback situations
        setSituations([
          "He was leading a patrol and enemy fire broke out suddenly. He...",
          "His subordinate made a critical mistake during an operation. He...",
          "He realized his unit was running low on ammunition and supplies. He...",
          "A fellow officer criticized his leadership in front of the troops. He...",
          "He received an order that he thought was strategically unsound. He...",
          "During a difficult mission, one of his soldiers got severely injured. He...",
          "He discovered that a team member had stolen military supplies. He...",
          "His commanding officer rejected his operational plan without explanation. He...",
          "He faced a situation where he had to choose between two conflicting duties. He...",
          "He noticed that some soldiers were not following proper protocol. He...",
          "A civilian asked for military assistance during a disaster. He...",
          "He found a lost child near a training camp. He...",
          "He was asked to stay late to finish planning a mission. He...",
          "One of his teammates was hurt by a sharp object. He...",
          "He heard a rumor that morale in his unit was falling. He...",
          "He saw that a senior officer was behaving unfairly. He...",
          "He was assigned to a difficult post with limited support. He...",
          "He found a training schedule that clashed with a unit requirement. He...",
          "He noticed waste in the supply line that could weaken the mission. He...",
          "A soldier approached him with a personal problem before an exercise. He...",
          "He found evidence of a safety hazard on the base. He...",
          "He learned that a mission target had suddenly changed. He...",
          "He was asked to share resources with another platoon. He...",
          "A team member was disconnected from the group during an operation. He...",
          "He discovered a communication breakdown between units. He...",
          "He found a piece of equipment malfunctioning before a drill. He...",
          "A fellow soldier asked for career advice under stress. He...",
          "He was told to take responsibility for a missed deadline. He...",
          "He saw an inexperienced recruit struggling with a task. He...",
          "He had to choose between two equally important orders. He...",
          "He learned that a meeting had been rescheduled at short notice. He...",
          "He saw an injured civilian near the base gate. He...",
          "He noticed a mistake in the logistics manifest. He...",
          "He realized a subordinate was unhappy with their duties. He...",
          "He was offered a promotion that could affect his team. He...",
          "He noticed that a key briefing was missing important details. He...",
          "He saw a conflict between two team members escalate. He...",
          "He found a security procedure being ignored. He...",
          "A key training resource was unavailable at the last minute. He...",
          "He was asked to lead a ceremony with little preparation. He...",
          "He observed a junior officer acting nervously under pressure. He...",
          "He learned that a teammate had taken unsanctioned leave. He...",
          "He discovered a planning error that could delay a mission. He...",
          "He was requested to assist another unit overnight. He...",
          "He learned that weather might affect a planned exercise. He...",
          "He saw a supply convoy delayed on a critical route. He...",
          "A team member missed a training session without notice. He...",
          "He found that an important communication channel was down. He...",
          "He was told to make a quick decision with incomplete information. He...",
          "He realized he had to comfort a stressed colleague. He...",
          "He noticed low energy levels among his team. He...",
          "He found that a vehicle had not been serviced before deployment. He...",
          "He discovered the need to motivate his unit before a task. He...",
          "He saw a fellow officer take credit for someone else’s idea. He...",
          "He was asked for a fast reaction to a safety incident. He...",
          "He noticed the importance of treating all team members fairly. He...",
          "He needed to decide between following a rule or helping someone. He...",
          "He noticed that a new recruit was reluctant to speak up. He...",
          "He was asked to handle an unexpected equipment shortfall. He...",
          "He discovered that a support team was overwhelmed. He...",
          "He learned that a task required a calm, decisive response. He..."
        ]);
        setIsLoading(false);
      }
    };

    fetchSRTSituations();
  }, []);

  const saveSessionToBackend = useCallback(async (finalResults: SRTResult[]) => {
    if (!user?.id || isSavingToBackend) return;
    
    setIsSavingToBackend(true);
    try {
      const totalScore = finalResults.reduce((acc, r) => acc + ((r.sentiment || 0) + 1) * 50, 0) / finalResults.length;
      
      const res = await fetch(buildBackendUrl('/log-performance'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          session_type: "SRT",
          score: Math.round(totalScore || 0),
          details: {
            total_responses: finalResults.length,
            responses: finalResults,
            primary_olqs: [...new Set(finalResults.map(r => r.primary_olq).filter(Boolean))]
          },
          timestamp: new Date().toISOString()
        }),
      });
      
      if (res.ok) {
        toast.success("SRT session saved to your performance history!");
      }
    } catch (err) {
      console.error("Failed to save session to backend:", err);
      toast.error("Could not save to server, but session is stored locally");
    } finally {
      setIsSavingToBackend(false);
    }
  }, [user?.id, isSavingToBackend]);

  const handleNext = useCallback(async (forceSubmit = false) => {
    if (!response.trim() && !forceSubmit) {
      toast.error("Please provide a response");
      return;
    }

    setIsAnalyzing(true);
    const answer = response.trim() || "No response";
    try {
      const res = await fetch(buildBackendUrl('/analyze-ssb'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: answer,
          time_taken: 30 - timeLeft,
          user_id: user?.id || "guest",
          session_type: "SRT"
        }),
      });
      const data = await res.json();
      const updated = [...results, { situation: situations[index], response: answer, ...data, session_type: "SRT" }];
      
      if (index < situations.length - 1 && sessionTimeLeft > 0) {
        setResults(updated);
        setIndex(index + 1);
        setResponse("");
        setTimeLeft(30);
      } else {
        setResults(updated);
        saveSessionToBackend(updated);
        setIsFinished(true);
        setTimeout(() => {
          navigate("/ssb-practice", { state: { results: updated } });
        }, 2000);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      const updated = [...results, { situation: situations[index], response: answer, feedback: "Response recorded", session_type: "SRT" }];
      
      if (index < situations.length - 1 && sessionTimeLeft > 0) {
        setResults(updated);
        setIndex(index + 1);
        setResponse("");
        setTimeLeft(30);
      } else {
        setResults(updated);
        saveSessionToBackend(updated);
        setIsFinished(true);
        setTimeout(() => {
          navigate("/ssb-practice", { state: { results: updated } });
        }, 2000);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [response, results, index, situations, sessionTimeLeft, timeLeft, navigate, user?.id, saveSessionToBackend]);

  useEffect(() => {
    if (isFinished || situations.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setSessionTimeLeft(prev => Math.max(prev - 1, 0));
      setTimeLeft(prev => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, situations.length]);

  useEffect(() => {
    if (timeLeft === 0 && !isFinished && situations.length > 0) {
      handleNext(true);
    }
  }, [timeLeft, isFinished, situations.length, handleNext]);

  useEffect(() => {
    if (sessionTimeLeft === 0 && !isFinished) {
      setIsFinished(true);
      setTimeout(() => {
        navigate("/ssb-practice", { state: { results } });
      }, 2000);
    }
  }, [sessionTimeLeft, isFinished, navigate, results]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#d4af37]" />
            <p className="text-slate-300">Loading SRT Session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Card className="bg-slate-900/40 border-[#d4af37]/20 max-w-md">
            <CardContent className="pt-8 text-center space-y-4">
              <div className="text-6xl">✅</div>
              <h3 className="text-xl font-bold text-white">SRT Completed!</h3>
              <p className="text-slate-300">{results.length} responses analyzed</p>
              <p className="text-sm text-slate-400">Redirecting to review...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col text-slate-100">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/ssb-practice")}
          className="mb-8 text-slate-400 hover:text-white self-start gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to SSB
        </Button>

        {situations.length > 0 && (
          <div className="w-full max-w-4xl bg-slate-900/40 border border-white/5 rounded-[2rem] p-8 md:p-12 backdrop-blur-md shadow-2xl space-y-8">
            
            {/* Header */}
            <div className="flex justify-between items-start px-4 border-b border-white/5 pb-6">
              <div>
                <span className="text-xs font-bold text-[#d4af37]/60 uppercase tracking-widest">Situation Reaction Test</span>
                <p className="text-3xl font-bold text-white mt-2">{index + 1} <span className="text-lg text-slate-500">/ {situations.length}</span></p>
              </div>
              <div className="text-right space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Timer className="h-4 w-4" />
                  <span className="text-sm">30 sec per situation</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-sm">Session time left:</span>
                  <span className="font-semibold text-white">{Math.floor(sessionTimeLeft / 60)}:{(sessionTimeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
            </div>

            {/* Situation Card */}
            <div className="bg-gradient-to-b from-slate-800/30 to-slate-900/30 rounded-2xl border border-white/10 p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
              <Shield className="h-8 w-8 text-[#d4af37]/30 mb-4" />
              <p className="text-slate-300 text-lg leading-relaxed font-serif italic">
                "{situations[index]}"
              </p>
            </div>

            {/* Response Input */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-300">Your Action/Reaction</label>
              <textarea
                autoFocus
                className="w-full bg-slate-950/50 border-2 border-slate-700 focus:border-[#d4af37] rounded-xl p-6 min-h-[180px] transition-all outline-none text-white placeholder:text-slate-600 resize-none"
                placeholder="Describe your action or reaction to this situation..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleNext();
                  }
                }}
                disabled={isAnalyzing}
              />
              <div className="flex flex-wrap justify-between gap-3 text-xs text-slate-400">
                <span>{response.length} characters | Ctrl+Enter to submit</span>
                <span className="font-semibold text-white">Time left: {timeLeft}s</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-between">
              <Button
                variant="outline"
                onClick={() => navigate("/ssb-practice")}
                className="border-white/10 text-white hover:bg-white/5"
              >
                Exit Session
              </Button>

              <div className="flex gap-4">
                <Button
                  onClick={() => handleNext()}
                  disabled={isAnalyzing || !response.trim()}
                  className="bg-[#d4af37] text-black font-bold hover:bg-[#e5c158] min-w-[150px]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : index === situations.length - 1 ? (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Finish & Review
                    </>
                  ) : (
                    <>
                      <Timer className="h-4 w-4 mr-2" />
                      Next Situation
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#d4af37] to-blue-500 transition-all duration-300"
                style={{ width: `${((index + 1) / situations.length) * 100}%` }}
              />
            </div>

            {/* Info */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-white/5">
              <p className="text-xs text-slate-400">
                <strong>Tip:</strong> Be honest and thoughtful. There are no right or wrong answers. Focus on how you would realistically respond to military scenarios.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SRTPractice;