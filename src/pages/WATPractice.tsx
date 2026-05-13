import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Timer, Brain, ArrowLeft, Loader2 } from "lucide-react";
import { buildBackendUrl } from '@/lib/api';
import { useAuth } from "@/contexts/AuthContext";

interface WATResult {
  word: string;
  response: string;
  sentiment: number;
  primary_olq: string;
  feedback: string;
  session_type: string;
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

const WATPractice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [watWords, setWatWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [response, setResponse] = useState("");
  const [results, setResults] = useState<WATResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingToBackend, setIsSavingToBackend] = useState(false);

  // Fetch WAT words on component mount
  useEffect(() => {
    const fetchWATWords = async () => {
      try {
        const res = await fetch(buildBackendUrl('get-wat-words?count=60'));
        const data = await res.json();
        setWatWords(data.words || []);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch WAT words:", err);
        toast.error("Failed to load WAT words. Using defaults.");
        // Fallback words
        setWatWords([
          "Risk", "Team", "Failure", "Enemy", "Mission", "Duty", "Honor", "Trust", "Courage", "Leadership",
          "Support", "Challenge", "Victory", "Responsibility", "Discipline", "Strategy", "Unity", "Conflict", "Hope", "Action",
          "Strength", "Crisis", "Respect", "Problem", "Resolve", "Decision", "Safety", "Service", "Adapt", "Confidence",
          "Mentor", "Respect", "Protect", "Assist", "Sacrifice", "Stability", "Alert", "Calm", "Honesty", "Loyalty",
          "Plan", "Focus", "Duty", "Teamwork", "Respect", "Courageous", "Trustworthy", "Bravery", "Support", "Order",
          "Mission", "Resolve", "Ready", "Honour", "Alertness", "Reliability", "Commitment", "Balance", "Care", "Optimism"
        ]);
        setIsLoading(false);
      }
    };

    fetchWATWords();
  }, []);

  const saveSessionToBackend = useCallback(async (finalResults: WATResult[]) => {
    if (!user?.id || isSavingToBackend) return;
    
    setIsSavingToBackend(true);
    try {
      // Calculate session statistics
      const totalScore = finalResults.reduce((acc, r) => acc + ((r.sentiment + 1) * 50), 0) / finalResults.length;
      
      const res = await fetch(buildBackendUrl('/log-performance'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          session_type: "WAT",
          score: Math.round(totalScore),
          details: {
            total_responses: finalResults.length,
            average_sentiment: (finalResults.reduce((acc, r) => acc + r.sentiment, 0) / finalResults.length).toFixed(2),
            responses: finalResults,
            primary_olqs: [...new Set(finalResults.map(r => r.primary_olq))]
          },
          timestamp: new Date().toISOString()
        }),
      });
      
      if (res.ok) {
        toast.success("Session saved to your performance history!");
      }
    } catch (err) {
      console.error("Failed to save session to backend:", err);
      toast.error("Could not save to server, but session is stored locally");
    } finally {
      setIsSavingToBackend(false);
    }
  }, [user?.id, isSavingToBackend]);

  const handleFinish = useCallback((finalResults: WATResult[]) => {
    setIsFinished(true);
    saveSessionToBackend(finalResults);
    setTimeout(() => {
      navigate("/ssb-practice", { state: { results: finalResults } });
    }, 2000);
  }, [navigate, saveSessionToBackend]);

  const handleNext = useCallback(async () => {
    setIsAnalyzing(true);
    let updatedResults = [...results];

    const timeTaken = 15 - timeLeft;
    console.log(`TC-02 Evidence - Stimulus: ${watWords[currentIndex]}, Latency: ${timeTaken.toFixed(2)}s`);

    try {
      const res = await fetch(buildBackendUrl('/analyze-wat'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: response || "No response",
          time_taken: timeTaken,
          user_id: user?.id || "guest",
          session_type: "WAT"
        }),
      });
      const data = await res.json();

      const newResult = {
        word: watWords[currentIndex],
        response: response || "No response",
        sentiment: data.sentiment,
        primary_olq: data.primary_olq,
        feedback: data.feedback,
        session_type: "WAT"
      };

      updatedResults = [...results, newResult];
      setResults(updatedResults);
    } catch (e) {
      console.error("Analysis failed:", e);
      const fallbackResult = {
        word: watWords[currentIndex],
        response: response || "No response",
        sentiment: 0,
        primary_olq: "Analysis Pending",
        feedback: "Response recorded",
        session_type: "WAT"
      };
      updatedResults = [...results, fallbackResult];
      setResults(updatedResults);
    } finally {
      setIsAnalyzing(false);

      if (currentIndex < watWords.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setResponse("");
        setTimeLeft(15);
      } else {
        handleFinish(updatedResults);
      }
    }
  }, [currentIndex, response, results, watWords, timeLeft, handleFinish, user?.id]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished && watWords.length > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isFinished && watWords.length > 0) {
      handleNext();
    }
  }, [timeLeft, isFinished, watWords, handleNext]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#d4af37]" />
            <p className="text-slate-300">Loading WAT Session...</p>
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
              <h3 className="text-xl font-bold text-white">WAT Completed!</h3>
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

        {watWords.length > 0 && (
          <div className="w-full max-w-4xl bg-slate-900/40 border border-white/5 rounded-[2rem] p-8 md:p-12 backdrop-blur-md shadow-2xl space-y-10">

            {/* Header: Progress & Timer */}
            <div className="flex justify-between items-center px-4 border-b border-white/5 pb-6">
              <div className="text-left">
                <span className="text-xs font-bold text-[#d4af37]/60 uppercase tracking-widest">Word Association Test • 60 words • 15 seconds each</span>
                <p className="text-3xl font-bold text-white mt-2">{currentIndex + 1} <span className="text-lg text-slate-500">/ {watWords.length}</span></p>
              </div>

              {/* Timer Circle */}
              <div className="relative flex items-center justify-center w-24 h-24">
                <svg className="transform -rotate-90 w-full h-full">
                  <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                  <circle
                    cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="4" fill="transparent"
                    strokeDasharray={263.8}
                    strokeDashoffset={263.8 - (timeLeft / 15) * 263.8}
                    className={`transition-all duration-1000 ${timeLeft < 5 ? "text-red-500 stroke-current" : "text-[#d4af37] stroke-current"}`}
                  />
                </svg>
                <span className={`absolute text-2xl font-mono font-bold ${timeLeft < 5 ? "text-red-500 animate-pulse" : "text-white"}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Stimulus Card */}
            <div className="py-20 bg-gradient-to-b from-slate-800/30 to-slate-900/30 rounded-2xl border border-white/10 relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
              <p className="text-[#d4af37]/40 font-bold uppercase tracking-[0.5em] text-[10px] mb-4">Respond with the first word</p>
              <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl">
                {watWords[currentIndex]}
              </h2>
            </div>

            {/* Response Input */}
            <div className="max-w-2xl mx-auto w-full space-y-4">
              <div className="relative">
                <input
                  autoFocus
                  className="w-full bg-slate-950/50 border-2 border-slate-700 focus:border-[#d4af37] rounded-xl p-6 text-2xl text-center transition-all outline-none text-white shadow-xl placeholder:text-slate-600"
                  placeholder="Your response..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isAnalyzing && handleNext()}
                  disabled={isAnalyzing}
                />
                {isAnalyzing && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <Brain className="text-[#d4af37] animate-pulse" size={28} />
                  </div>
                )}
              </div>

              <div className="text-center text-sm text-slate-400">
                Press Enter or wait for timer to proceed
              </div>
            </div>

            {/* Action Button */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleNext}
                disabled={isAnalyzing}
                className="bg-[#d4af37] text-black font-bold hover:bg-[#e5c158] min-w-[150px]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Timer className="h-4 w-4 mr-2" />
                    Next
                  </>
                )}
              </Button>

              {currentIndex === watWords.length - 1 && (
                <Button
                  variant="outline"
                  onClick={() => handleFinish([...results])}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  Finish & Review
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#d4af37] to-blue-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / watWords.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WATPractice;