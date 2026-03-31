import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Brain, RotateCcw, ThumbsUp, ThumbsDown, Meh, Sparkles, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type Flashcard = {
  id: string;
  question: string;
  answer: string;
  subject: string;
  exam_type: string;
  difficulty: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
};

const SM2_MIN_EF = 1.3;

function sm2(quality: number, ef: number, interval: number, reps: number) {
  let newEF = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < SM2_MIN_EF) newEF = SM2_MIN_EF;

  let newInterval: number;
  let newReps: number;

  if (quality < 3) {
    newInterval = 1;
    newReps = 0;
  } else {
    newReps = reps + 1;
    if (newReps === 1) newInterval = 1;
    else if (newReps === 2) newInterval = 6;
    else newInterval = Math.round(interval * newEF);
  }

  return { ease_factor: newEF, interval_days: newInterval, repetitions: newReps };
}

const Flashcards = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [examType, setExamType] = useState("NDA");
  const [generating, setGenerating] = useState(false);
  const [loadingCards, setLoadingCards] = useState(true);
  const [mode, setMode] = useState<"review" | "browse">("review");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const fetchCards = useCallback(async () => {
    if (!user) return;
    setLoadingCards(true);
    const { data } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .order("next_review_at", { ascending: true });
    const fetched = (data || []) as unknown as Flashcard[];
    setCards(fetched);
    const now = new Date().toISOString();
    setDueCards(fetched.filter((c) => c.next_review_at <= now));
    setLoadingCards(false);
  }, [user]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const generateCards = async () => {
    setGenerating(true);
    try {
      // Try to get weak areas from test attempts
      let weakAreas: string[] = [];
      if (user) {
        const { data: attempts } = await supabase
          .from("test_attempts")
          .select("answers")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(5);

        if (attempts?.length) {
          const subjectScores: Record<string, { correct: number; total: number }> = {};
          for (const attempt of attempts) {
            const answers = attempt.answers as Record<string, any>;
            if (typeof answers === "object" && answers !== null) {
              Object.values(answers).forEach((a: any) => {
                if (a?.subject) {
                  if (!subjectScores[a.subject]) subjectScores[a.subject] = { correct: 0, total: 0 };
                  subjectScores[a.subject].total++;
                  if (a.is_correct) subjectScores[a.subject].correct++;
                }
              });
            }
          }
          weakAreas = Object.entries(subjectScores)
            .filter(([, v]) => v.total > 0 && v.correct / v.total < 0.6)
            .map(([k]) => k);
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: { exam_type: examType, weak_areas: weakAreas, count: 10 },
      });

      if (error) throw error;
      if (!data?.cards?.length) {
        toast({ title: "No cards generated", description: "Please try again.", variant: "destructive" });
        return;
      }

      const inserts = data.cards.map((c: any) => ({
        user_id: user!.id,
        question: c.question,
        answer: c.answer,
        subject: c.subject || "General",
        exam_type: examType,
        difficulty: c.difficulty || "medium",
      }));

      const { error: insertErr } = await supabase.from("flashcards").insert(inserts);
      if (insertErr) throw insertErr;

      toast({ title: "Flashcards generated!", description: `${data.cards.length} new cards added.` });
      fetchCards();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate flashcards", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleRate = async (quality: number) => {
    const card = dueCards[currentIndex];
    if (!card) return;

    const updates = sm2(quality, card.ease_factor, card.interval_days, card.repetitions);
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + updates.interval_days);

    await supabase
      .from("flashcards")
      .update({
        ...updates,
        next_review_at: nextReview.toISOString(),
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", card.id);

    setFlipped(false);
    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast({ title: "Review complete! 🎉", description: "All due cards reviewed." });
      fetchCards();
      setCurrentIndex(0);
    }
  };

  const deleteAllCards = async () => {
    if (!user) return;
    await supabase.from("flashcards").delete().eq("user_id", user.id);
    toast({ title: "All flashcards deleted" });
    fetchCards();
    setCurrentIndex(0);
  };

  const currentCard = mode === "review" ? dueCards[currentIndex] : cards[currentIndex];
  const activeList = mode === "review" ? dueCards : cards;

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Brain className="h-8 w-8 text-gold" />
          <h1 className="text-3xl font-display font-bold text-foreground">AI Flashcards</h1>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{cards.length}</p>
            <p className="text-xs text-muted-foreground">Total Cards</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gold">{dueCards.length}</p>
            <p className="text-xs text-muted-foreground">Due Today</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary">{cards.length - dueCards.length}</p>
            <p className="text-xs text-muted-foreground">Mastered</p>
          </CardContent></Card>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Select value={examType} onValueChange={setExamType}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["NDA", "CDS", "AFCAT", "INET", "CAPF"].map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generateCards} disabled={generating} className="bg-gold text-primary hover:bg-gold/90">
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {generating ? "Generating..." : "Generate AI Cards"}
          </Button>
          <Button variant={mode === "review" ? "default" : "outline"} onClick={() => { setMode("review"); setCurrentIndex(0); setFlipped(false); }}>
            Review Due ({dueCards.length})
          </Button>
          <Button variant={mode === "browse" ? "default" : "outline"} onClick={() => { setMode("browse"); setCurrentIndex(0); setFlipped(false); }}>
            Browse All
          </Button>
          {cards.length > 0 && (
            <Button variant="ghost" size="icon" onClick={deleteAllCards} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Flashcard */}
        {loadingCards ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>
        ) : activeList.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-xl font-semibold mb-2">
                {mode === "review" ? "No cards due for review!" : "No flashcards yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {mode === "review"
                  ? "Great job! Come back later or generate new cards."
                  : "Generate AI-powered flashcards based on your weak areas."}
              </p>
              <Button onClick={generateCards} disabled={generating} className="bg-gold text-primary">
                <Sparkles className="h-4 w-4 mr-2" /> Generate Cards
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Card {currentIndex + 1} of {activeList.length}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard?.id + (flipped ? "-a" : "-q")}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setFlipped(!flipped)}
                className="cursor-pointer"
              >
                <Card className="min-h-[280px] flex flex-col justify-center items-center p-8 border-2 border-gold/20 hover:border-gold/40 transition-colors">
                  <CardContent className="text-center w-full">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Badge variant="outline">{currentCard?.subject}</Badge>
                      <Badge variant="secondary">{currentCard?.difficulty}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
                      {flipped ? "Answer" : "Question"} — tap to flip
                    </p>
                    <p className="text-xl font-medium leading-relaxed">
                      {flipped ? currentCard?.answer : currentCard?.question}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Rating buttons (review mode only) */}
            {mode === "review" && flipped && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center gap-4 mt-6"
              >
                <Button variant="destructive" onClick={() => handleRate(1)} className="flex-1 max-w-[140px]">
                  <ThumbsDown className="h-4 w-4 mr-2" /> Again
                </Button>
                <Button variant="outline" onClick={() => handleRate(3)} className="flex-1 max-w-[140px]">
                  <Meh className="h-4 w-4 mr-2" /> Hard
                </Button>
                <Button onClick={() => handleRate(5)} className="flex-1 max-w-[140px] bg-green-600 hover:bg-green-700 text-white">
                  <ThumbsUp className="h-4 w-4 mr-2" /> Easy
                </Button>
              </motion.div>
            )}

            {/* Navigation (browse mode) */}
            {mode === "browse" && (
              <div className="flex justify-center gap-4 mt-6">
                <Button variant="outline" disabled={currentIndex === 0} onClick={() => { setCurrentIndex(currentIndex - 1); setFlipped(false); }}>
                  Previous
                </Button>
                <Button variant="outline" onClick={() => setFlipped(!flipped)}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Flip
                </Button>
                <Button variant="outline" disabled={currentIndex >= activeList.length - 1} onClick={() => { setCurrentIndex(currentIndex + 1); setFlipped(false); }}>
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Flashcards;
