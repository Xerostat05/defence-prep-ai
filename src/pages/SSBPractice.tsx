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

const SSBPractice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Local state to hold the results passed from WATPractice
  const [watResults, setWatResults] = useState<any[]>([]);

  // Capture results from the navigation state on component mount
  useEffect(() => {
    if (location.state?.results) {
      setWatResults(location.state.results);
      // Clear the navigation state so a refresh doesn't show the results again
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 font-sans">
      <Navbar />
      
      <main className="pt-24 pb-16 container mx-auto px-4">
        {/* --- DYNAMIC HEADER --- */}
        <section className="mb-12 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Shield size={14} /> Intelligence Selection Board
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
            {watResults.length > 0 ? "Performance Analysis" : "Psychological Testing"}
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {watResults.length > 0 
              ? "AI-generated breakdown of your Officer Like Qualities (OLQs) based on recent stimuli responses."
              : "Access the testing suite for TAT, SRT, and our proprietary AI-powered Word Association Engine."}
          </p>
        </section>

        <AnimatePresence mode="wait">
          {watResults.length > 0 ? (
            /* --- RESULTS VIEW (This shows after the test) --- */
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto space-y-12"
            >
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => setWatResults([])}
                  className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2"
                >
                  <ArrowLeft size={16} /> New Session
                </Button>
                <div className="text-right">
                  <span className="text-slate-500 text-xs uppercase font-bold tracking-widest">Total Stimuli</span>
                  <p className="text-2xl font-black text-[#d4af37]">{watResults.length}</p>
                </div>
              </div>

              {/* Part 1: Visual Analytics (Chart Component) */}
              <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-8 backdrop-blur-md shadow-2xl">
                <WATReport results={watResults} />
              </div>

              {/* Part 2: Detailed Breakdown Cards */}
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <LayoutDashboard className="text-[#d4af37]" /> Response Audit
                </h3>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {watResults.map((res, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group relative overflow-hidden rounded-2xl bg-slate-900/60 border border-white/5 p-6 hover:border-[#d4af37]/30 transition-all shadow-lg"
                    >
                      <div className="absolute top-4 right-4">
                        <span className="text-[10px] font-black text-[#d4af37]/30 uppercase">ID: 00{i + 1}</span>
                      </div>

                      <div className="mb-6">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Word: {res.word}</span>
                        <p className="text-xl font-bold text-white italic leading-tight">
                          "{res.response}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between mb-6 bg-white/5 rounded-xl p-3 border border-white/5">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Detected Trait</span>
                          <span className="text-sm font-black text-green-400 uppercase tracking-wider">
                            {res.primary_olq}
                          </span>
                        </div>
                        <div className={`px-3 py-1 rounded-md text-[10px] font-black uppercase ${
                          res.sentiment === 'Positive' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {res.sentiment}
                        </div>
                      </div>

                      <div className="space-y-2">
                         <div className="flex items-center gap-2 text-[#d4af37] text-[10px] font-black uppercase tracking-tighter">
                            <Brain size={12} /> AI Critic Review
                         </div>
                         <p className="text-sm text-slate-400 leading-relaxed">
                            {res.critic_review}
                         </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            /* --- LANDING VIEW (Test Selection) --- */
            <motion.div 
              key="tabs"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto"
            >
              <Tabs defaultValue="wat" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-900/50 border border-white/5 rounded-xl p-1 h-14">
                  <TabsTrigger value="wat" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black font-bold uppercase text-xs">WAT</TabsTrigger>
                  <TabsTrigger value="tat" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black font-bold uppercase text-xs">TAT</TabsTrigger>
                  <TabsTrigger value="srt" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black font-bold uppercase text-xs">SRT</TabsTrigger>
                </TabsList>

                <TabsContent value="wat" className="mt-8">
                  <Card className="bg-slate-900/40 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
                    <CardHeader className="text-center pt-12 pb-6">
                      <div className="mx-auto w-16 h-16 bg-[#d4af37]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#d4af37]/20">
                         <Zap className="text-[#d4af37] fill-[#d4af37]" size={32} />
                      </div>
                      <CardTitle className="text-3xl font-black text-white">Word Association Test</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-8 pb-12">
                      <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                        Our <strong>Neural Analytics Engine</strong> evaluates your subconscious patterns against 15 core Officer Like Qualities.
                      </p>
                      
                      <div className="flex justify-center gap-8">
                         <div className="flex flex-col items-center">
                            <Timer className="text-[#d4af37] mb-1" size={20} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">15s Limit</span>
                         </div>
                         <div className="flex flex-col items-center">
                            <TrendingUp className="text-[#d4af37] mb-1" size={20} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">OLQ Mapping</span>
                         </div>
                      </div>

                      <Button
                        onClick={() => navigate("/wat-practice")}
                        className="w-full max-w-sm h-16 bg-[#d4af37] hover:bg-amber-500 text-black font-black text-lg rounded-2xl shadow-[0_10px_20px_-10px_rgba(212,175,55,0.5)] transition-all hover:scale-[1.02]"
                      >
                        Launch AI Testing Suite
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="tat" className="text-center py-20 text-slate-500 uppercase tracking-widest text-xs font-bold italic">Module Under Development</TabsContent>
                <TabsContent value="srt" className="text-center py-20 text-slate-500 uppercase tracking-widest text-xs font-bold italic">Module Under Development</TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default SSBPractice;
