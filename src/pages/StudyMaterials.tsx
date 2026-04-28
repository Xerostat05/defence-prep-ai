import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { BookOpen, FileText, Video, ExternalLink, ChevronDown, ChevronUp, Shield, Swords, Brain, Users, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ... (Material and Category types remain the same)

const StudyMaterials = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<string | null>("nda");
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // NEW: Function to connect to your Python Backend
  const handleGenerateFlashcards = async (categoryTitle: string) => {
  setIsGenerating(categoryTitle);
  try {
    // DO NOT use supabase.functions.invoke() here.
    // That is what causes the "Edge Function" error.
    
    // INSTEAD, use a direct fetch to your Python terminal:
    const response = await fetch("http://127.0.0.1:8000/analyze-ssb", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text: `Flashcards for ${categoryTitle}`,
        time_taken: 0 
      }),
    });

    if (!response.ok) throw new Error("Local Engine Not Found");

    const data = await response.json();
    
    // Save to localStorage immediately to solve the "No Session Data" issue
    localStorage.setItem("ssb_session", JSON.stringify({ 
      type: 'FLASHCARDS', 
      results: [{ word: categoryTitle, response: "Generated Plan", ...data }] 
    }));

    toast.success("Analysis complete via Local Engine");
    navigate("/ssb-practice"); 
  } catch (error) {
    console.error(error);
    toast.error("Is 'python main.py' running in your terminal?");
  } finally {
    setIsGenerating(null);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">Study Materials & Notes</h1>
            <p className="text-muted-foreground text-sm mt-1">Official syllabus and AI-powered preparation tools.</p>
          </div>
          <div className="bg-gold/10 border border-gold/20 px-4 py-2 rounded-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-xs font-bold text-gold uppercase tracking-wider">AI Engine Connected</span>
          </div>
        </div>

        <div className="space-y-4">
          {categories.map((cat) => {
            const isExpanded = expandedCategory === cat.id;
            return (
              <div key={cat.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all">
                <div className="flex flex-col md:flex-row">
                    <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                    className="flex-1 flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
                    >
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${cat.color}`}>
                        <cat.icon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                        <h2 className="font-display text-lg font-semibold text-foreground">{cat.title}</h2>
                        <p className="text-xs text-muted-foreground">{cat.materials.length} resources</p>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    
                    {/* NEW AI GENERATE BUTTON */}
                    <div className="px-5 pb-4 md:pb-0 md:pt-5 md:pr-5">
                        <button 
                            onClick={() => handleGenerateFlashcards(cat.title)}
                            disabled={isGenerating !== null}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-xs font-bold hover:bg-gold hover:text-black transition-all disabled:opacity-50"
                        >
                            {isGenerating === cat.title ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                            AI FLASHCARDS
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-muted/20"
                    >
                      <div className="px-5 pb-5 pt-2 grid gap-3 sm:grid-cols-2">
                        {cat.materials.map((mat, i) => (
                          <div
                            key={i}
                            onClick={() => handleOpenLink(mat.url)}
                            className="group cursor-pointer bg-card rounded-lg border border-border p-4 hover:border-gold transition-all"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-display text-sm font-bold group-hover:text-gold transition-colors">{mat.title}</h3>
                              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-gold" />
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{mat.description}</p>
                            <span className="text-[10px] uppercase font-black text-slate-500">Source: {mat.source}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default StudyMaterials;