import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Timer, Brain } from "lucide-react";
import Navbar from "@/components/Navbar";

// 1. EXTENDED MASTER WORD LIST (Add as many as you like)
const MASTER_WAT_POOL = [
  "Risk", "Team", "Failure", "Enemy", "Mission", "Friend", "Lead", "Duty", 
  "Conflict", "Victory", "Fear", "Discipline", "Home", "Order", "Success", 
  "Brother", "Country", "Challenge", "Goal", "Attack", "Peace", "Company", 
  "Loyalty", "Mistake", "Problem", "Command", "Action", "Responsibility"
];

const WATPractice = () => {
  const navigate = useNavigate();
  
  // 2. RANDOM SELECTION LOGIC
  // We use useMemo so the words don't change every time the component re-renders
  const watWords = useMemo(() => {
    return [...MASTER_WAT_POOL]
      .sort(() => 0.5 - Math.random()) // Shuffle the array
      .slice(0, 10); // Pick the first 10 random words
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [response, setResponse] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFinish = (finalResults: any[]) => {
    setIsFinished(true);
    setTimeout(() => {
      navigate("/ssb-practice", { state: { results: finalResults } });
    }, 2000);
  };

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isFinished) {
      handleNext();
    }
  }, [timeLeft, isFinished]);

  const handleNext = async () => {
    setIsAnalyzing(true);
    let updatedResults = [...results];

    try {
      const res = await fetch("http://127.0.0.1:8000/analyze-wat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: response || "No response" }),
      });
      const data = await res.json();
      
      const newResult = { 
        word: watWords[currentIndex], 
        response: response || "No response", 
        sentiment: data.sentiment,
        primary_olq: data.primary_olq,
        critic_review: data.critic_review 
      };
      
      updatedResults = [...results, newResult];
      setResults(updatedResults);
    } catch (e) {
      console.error("AI Server Offline");
      const fallbackResult = { 
        word: watWords[currentIndex], 
        response: response || "No response", 
        primary_olq: "N/A", 
        critic_review: "Server Offline" 
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
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] flex flex-col text-slate-100">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        {!isFinished ? (
          <div className="w-full max-w-4xl bg-slate-900/40 border border-white/5 rounded-[2rem] p-8 md:p-12 backdrop-blur-md shadow-2xl space-y-10">
            
            {/* Header: Progress & Timer */}
            <div className="flex justify-between items-center px-4 border-b border-white/5 pb-6">
              <div className="text-left">
                <span className="text-xs font-bold text-[#d4af37]/60 uppercase tracking-widest font-sans">Psychological Assessment</span>
                <p className="text-3xl font-black text-white">{currentIndex + 1} <span className="text-lg text-slate-500">/ {watWords.length}</span></p>
              </div>

              <div className="relative flex items-center justify-center w-24 h-24">
                <svg className="transform -rotate-90 w-full h-full">
                  <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                  <circle
                    cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="4" fill="transparent"
                    strokeDasharray={263.8}
                    strokeDashoffset={263.8 - (timeLeft / 15) * 263.8}
                    className={`transition-all duration-1000 stroke-current ${timeLeft < 5 ? "text-red-500" : "text-[#d4af37]"}`}
                  />
                </svg>
                <span className={`absolute text-2xl font-mono font-bold ${timeLeft < 5 ? "text-red-500 animate-pulse" : "text-white"}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Stimulus Card */}
            <div className="py-20 bg-slate-800/20 rounded-2xl border border-white/10 relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
              <span className="text-[#d4af37]/40 font-bold uppercase tracking-[0.5em] text-[10px] mb-4 block">Psychological Stimulus</span>
              <h2 className="text-7xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl">
                {watWords[currentIndex]}
              </h2>
            </div>

            {/* Response Input */}
            <div className="max-w-2xl mx-auto w-full space-y-4">
              <div className="relative">
                <input
                  autoFocus
                  className="w-full bg-slate-950/50 border-2 border-slate-700 focus:border-[#d4af37] rounded-xl p-6 text-2xl text-center transition-all outline-none text-white shadow-xl"
                  placeholder="Formulate your response..."
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
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold text-center">
                Press <span className="text-[#d4af37] underline font-black">ENTER</span> to save and proceed
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin" />
            <div className="text-center">
              <h3 className="text-xl font-bold text-white tracking-widest uppercase">Processing Psychological Profile</h3>
              <p className="text-[#d4af37]/60 text-xs mt-2 uppercase font-semibold animate-pulse tracking-widest">Generating OLQ Feedback...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WATPractice;