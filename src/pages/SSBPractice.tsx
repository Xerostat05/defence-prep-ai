import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  Brain,
  Zap,
  TrendingUp,
  MessageSquareQuote,
  Shield,
  ArrowLeft,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import WATReport from "@/components/WATReport";
import { Image as ImageIcon, MessageSquare } from "lucide-react";

interface PracticeResult {
  session_type?: string;
  [key: string]: unknown;
}

/* ... existing imports ... */

const SSBPractice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [watResults, setWatResults] = useState<PracticeResult[]>([]);

  // --- NEW: PERSISTENCE LOGIC ---
  const saveSession = (results: PracticeResult[]) => {
    try {
      const existingHistory = JSON.parse(localStorage.getItem("ssb_history") || "[]");
      const sessionType = results?.[0]?.session_type || "WAT";
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: sessionType,
        data: results,
      };
      
      const updatedHistory = [newEntry, ...existingHistory].slice(0, 10); // Keep last 10 sessions
      localStorage.setItem("ssb_history", JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Failed to save session history", error);
    }
  };

  useEffect(() => {
    if (location.state?.results) {
      const results = location.state.results;
      setWatResults(results);
      
      // Persist to local storage immediately
      saveSession(results);

      // Clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 font-sans">
      <Navbar />
      
      <main className="pt-24 pb-16 container mx-auto px-4">
        {/* ... existing dynamic header ... */}

        <AnimatePresence mode="wait">
          {watResults.length > 0 ? (
            <motion.div key="results" /* ... existing props ... */ className="max-w-5xl mx-auto space-y-12">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setWatResults([])}
                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2"
                  >
                    <ArrowLeft size={16} /> New Session
                  </Button>
                  
                  {/* --- NEW: HISTORY LINK --- */}
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/dashboard")} 
                    className="text-[#d4af37] hover:bg-[#d4af37]/10 gap-2 border border-[#d4af37]/20"
                  >
                    <TrendingUp size={16} /> View All History
                  </Button>
                </div>
                
                <div className="text-right">
                  <span className="text-slate-500 text-xs uppercase font-bold tracking-widest">Total Stimuli</span>
                  <p className="text-2xl font-black text-[#d4af37]">{watResults.length}</p>
                </div>
              </div>

              {/* ... existing WATReport and Audit Cards ... */}
            </motion.div>
          ) : (
            /* --- LANDING VIEW --- */
            <motion.div key="tabs" /* ... existing props ... */>
              <Tabs defaultValue="wat" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-900/50 border border-white/5 rounded-xl p-1 h-14">
                  <TabsTrigger value="wat" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">WAT</TabsTrigger>
                  <TabsTrigger value="tat" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">TAT</TabsTrigger>
                  <TabsTrigger value="srt" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">SRT</TabsTrigger>
                </TabsList>

                {/* --- WAT TAB --- */}
                <TabsContent value="wat" className="mt-8">
                  <Card className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm hover:border-white/10 transition-all">
                    <CardHeader className="border-b border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MessageSquareQuote className="h-6 w-6 text-[#d4af37]" />
                          <div>
                            <CardTitle className="text-xl text-white">Word Association Test</CardTitle>
                            <p className="text-sm text-slate-400 mt-1">Respond quickly with the first word that comes to mind</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase tracking-widest">10 Words</p>
                          <p className="text-sm font-bold text-[#d4af37]">15 sec each</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <p className="text-slate-300">Test your spontaneity and word association skills. This measures quick thinking and psychological traits through rapid word response.</p>
                        <div className="flex gap-4">
                          <Button
                            onClick={() => navigate("/wat-practice")}
                            className="flex-1 bg-[#d4af37] text-black font-bold hover:bg-[#e5c158] h-12 rounded-xl"
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Start WAT
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-white/10 text-white hover:bg-white/5"
                            onClick={() => navigate("/dashboard")}
                          >
                            View History
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* --- TAT TAB --- */}
                <TabsContent value="tat" className="mt-8">
                  <Card className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm hover:border-white/10 transition-all">
                    <CardHeader className="border-b border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="h-6 w-6 text-[#d4af37]" />
                          <div>
                            <CardTitle className="text-xl text-white">Thematic Apperception Test</CardTitle>
                            <p className="text-sm text-slate-400 mt-1">Write a story based on ambiguous images</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase tracking-widest">5 Images</p>
                          <p className="text-sm font-bold text-[#d4af37]">5 min each</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <p className="text-slate-300">Create stories around thought-provoking images. This reveals your creativity, imagination, and psychological traits through narrative.</p>
                        <div className="flex gap-4">
                          <Button
                            onClick={() => navigate("/tat-practice")}
                            className="flex-1 bg-[#d4af37] text-black font-bold hover:bg-[#e5c158] h-12 rounded-xl"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Start TAT
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-white/10 text-white hover:bg-white/5"
                            onClick={() => navigate("/dashboard")}
                          >
                            View History
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* --- SRT TAB --- */}
                <TabsContent value="srt" className="mt-8">
                  <Card className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm hover:border-white/10 transition-all">
                    <CardHeader className="border-b border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="h-6 w-6 text-[#d4af37]" />
                          <div>
                            <CardTitle className="text-xl text-white">Situation Reaction Test</CardTitle>
                            <p className="text-sm text-slate-400 mt-1">React to real-world military situations</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase tracking-widest">10 Scenarios</p>
                          <p className="text-sm font-bold text-[#d4af37]">2 min each</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <p className="text-slate-300">Respond to challenging military scenarios. This evaluates your decision-making, leadership potential, and situational awareness.</p>
                        <div className="flex gap-4">
                          <Button
                            onClick={() => navigate("/srt-practice")}
                            className="flex-1 bg-[#d4af37] text-black font-bold hover:bg-[#e5c158] h-12 rounded-xl"
                          >
                            <Timer className="h-4 w-4 mr-2" />
                            Start SRT
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-white/10 text-white hover:bg-white/5"
                            onClick={() => navigate("/dashboard")}
                          >
                            View History
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                <Card className="bg-slate-900/60 border-white/10 p-6">
                  <CardHeader>
                    <CardTitle>OIR MCQ Practice</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-slate-400">
                    <p>Practice Officer Intelligence Rating questions in a dedicated MCQ flow.</p>
                    <Button onClick={() => navigate('/oir-practice')} className="bg-[#d4af37] text-black hover:bg-[#e5c158] w-full">
                      Go to OIR
                    </Button>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/60 border-white/10 p-6">
                  <CardHeader>
                    <CardTitle>GD Simulation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-slate-400">
                    <p>Join an AI-driven group discussion simulator with feedback.</p>
                    <Button onClick={() => navigate('/gd-simulator')} className="bg-[#d4af37] text-black hover:bg-[#e5c158] w-full">
                      Start GD
                    </Button>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/60 border-white/10 p-6">
                  <CardHeader>
                    <CardTitle>PI Preparation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-slate-400">
                    <p>Generate PIQ questions and get AI feedback on your answers.</p>
                    <Button onClick={() => navigate('/pi-preparation')} className="bg-[#d4af37] text-black hover:bg-[#e5c158] w-full">
                      Practice PI
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default SSBPractice;