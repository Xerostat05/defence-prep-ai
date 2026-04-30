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

/* ... existing imports ... */

const SSBPractice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [watResults, setWatResults] = useState<any[]>([]);

  // --- NEW: PERSISTENCE LOGIC ---
  const saveSession = (results: any[]) => {
    try {
      const existingHistory = JSON.parse(localStorage.getItem("ssb_history") || "[]");
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: "WAT", // This can be dynamic for TAT/SRT
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
                  <TabsTrigger value="wat" className="...">WAT</TabsTrigger>
                  <TabsTrigger value="tat" className="...">TAT</TabsTrigger>
                  <TabsTrigger value="srt" className="...">SRT</TabsTrigger>
                </TabsList>

                {/* --- WAT TAB --- */}
                <TabsContent value="wat" className="mt-8">
                   {/* ... existing WAT card ... */}
                </TabsContent>

                {/* --- TAT TAB (Cleaned up the duplicate entries) --- */}
                <TabsContent value="tat" className="mt-8">
                  <Card className="bg-slate-900/40 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
                    {/* ... (TAT Card content as provided previously) ... */}
                  </Card>
                </TabsContent>

                {/* --- SRT TAB (Cleaned up the duplicate entries) --- */}
                <TabsContent value="srt" className="mt-8">
                  <Card className="bg-slate-900/40 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
                     {/* ... (SRT Card content as provided previously) ... */}
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default SSBPractice;