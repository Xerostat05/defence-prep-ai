import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Json = unknown;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, Loader2, CheckCircle2, XCircle, Target } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

type Question = { id: number; question: string; options: string[]; correct_answer: number; explanation: string; subject?: string };

type TestState = "setup" | "taking" | "review";

export default function MockTest() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [testState, setTestState] = useState<TestState>("setup");
  const [examType, setExamType] = useState("");
  const [subject, setSubject] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [currentMockTestId, setCurrentMockTestId] = useState<string | null>(null);
  const [mockTestPersisted, setMockTestPersisted] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  // Timer
  const parseQuestions = (rawQuestions: Json): Question[] => {
    if (!Array.isArray(rawQuestions)) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (rawQuestions as any[]).map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const record = item as any;
      return {
        id: Number(record?.id ?? 0),
        question: String(record?.question ?? ""),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: Array.isArray(record?.options) ? record.options.map((opt: any) => String(opt)) : [],
        correct_answer: Number(record?.correct_answer ?? 0),
        explanation: String(record?.explanation ?? ""),
        subject: typeof record?.subject === "string" ? record.subject : undefined,
      };
    });
  };

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = supabase.from("test_attempts") as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = await table
        .select("*, mock_tests(*)")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });
      if (query.error) throw query.error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = query.data as any[];
      setHistory(data || []);
    } catch (e) {
      console.error("Failed to load test history", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadHistory();
  }, [user, loadHistory]);

  const generateTest = async () => {
    if (!examType) { toast.error("Select an exam type"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-mock-test", {
        body: JSON.stringify({ exam_type: examType, subject, num_questions: 10 }),
        headers: { "Content-Type": "application/json" },
      });
      if (error) {
        throw error;
      }

      if (!data || typeof data !== "object" || !Array.isArray((data as any).questions)) {
        throw new Error("Invalid test data returned from generator");
      }

      const questionsPayload = (data as any).questions.map((item: any, index: number) => ({
        id: Number(item?.id ?? index + 1),
        question: String(item?.question ?? ""),
        options: Array.isArray(item?.options) ? item.options.map((opt: any) => String(opt)) : [],
        correct_answer: Number(item?.correct_answer ?? 0),
        explanation: String(item?.explanation ?? ""),
        subject: typeof item?.subject === 'string' ? item.subject : undefined,
      }));

      setQuestions(questionsPayload);
      setTestState("taking");
      setTimeLeft(15 * 60);
      setStartTime(Date.now());
      setAnswers({});
      setCurrentQ(0);
      setMockTestPersisted(true);

      try {
        const mockTest = await supabase
          .from("mock_tests")
          .insert({
            title: `${examType} Practice Test`,
            exam_type: examType,
            duration_minutes: 15,
            questions: questionsPayload,
            total_marks: questionsPayload.length,
          })
          .select("id")
          .single();

        if (mockTest.error || !mockTest.data?.id) {
          throw mockTest.error || new Error("Failed to create mock test record");
        }

        setCurrentMockTestId(mockTest.data.id);
      } catch (dbError: unknown) {
        const message = dbError instanceof Error ? dbError.message : String(dbError);
        toast.warning("Mock test generated but failed to persist. You can continue the test locally.");
        setMockTestPersisted(false);
        setCurrentMockTestId(crypto.randomUUID());
        console.warn("Mock test persistence failed:", message);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(message || "Failed to generate test");
    } finally {
      setIsGenerating(false);
    }
  };

  const submitTest = useCallback(async () => {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const correct = questions.filter((q) => answers[q.id] === q.correct_answer).length;
    const score = Math.round((correct / questions.length) * 100);

    if (user && mockTestPersisted) {
      try {
        const attemptPayload = {
          user_id: user.id,
          mock_test_id: currentMockTestId || crypto.randomUUID(),
          answers,
          score,
          total_questions: questions.length,
          correct_answers: correct,
          time_taken_seconds: timeTaken,
        };

        const { error } = await supabase.from("test_attempts").insert(attemptPayload);
        if (error) throw error;
        await loadHistory();
      } catch (e) {
        console.error("Failed to save test attempt", e);
        toast.warning("Test submitted, but could not save the attempt to history.");
      }
    } else {
      if (!user) {
        toast.info("Sign in to save your test attempt history.");
      } else {
        toast.info("Test completed locally because the mock test could not be persisted.");
      }
    }

    setTestState("review");
    toast.success(`Test submitted! Score: ${score}%`);
  }, [answers, questions, startTime, user, currentMockTestId, loadHistory, mockTestPersisted]);

  useEffect(() => {
    if (testState !== "taking" || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); submitTest(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [testState, timeLeft, submitTest]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviewPreviousAttempt = (attempt: any) => {
    const previousQuestions = parseQuestions(attempt.mock_tests.questions);
    const parsedAnswers: Record<number, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const [key, value] of Object.entries(attempt.answers as any)) {
      const questionId = Number(key);
      const answerIndex = Number(value);
      if (!Number.isNaN(questionId) && !Number.isNaN(answerIndex)) {
        parsedAnswers[questionId] = answerIndex;
      }
    }
    setQuestions(previousQuestions);
    setAnswers(parsedAnswers);
    setCurrentQ(0);
    setTestState("review");
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {testState === "setup" && (
          <>
            <div className="flex items-center gap-3 mb-8">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-5 w-5" /></Button>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">AI Mock Test</h1>
                <p className="text-muted-foreground text-sm">AI-generated practice tests tailored to your exam</p>
              </div>
            </div>
            <Card className="max-w-md mx-auto">
              <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-gold" />Start a Test</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Exam Type</label>
                  <Select value={examType} onValueChange={setExamType}>
                    <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                    <SelectContent>
                      {["NDA", "CDS", "AFCAT", "CAPF", "INET"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject (optional)</label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
                    <SelectContent>
                      {["General Knowledge", "Mathematics", "English", "Reasoning", "Science"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={generateTest} disabled={isGenerating} className="w-full bg-gold text-accent-foreground hover:bg-gold-light font-semibold shadow-gold">
                  {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating Questions...</> : "Start Mock Test (10 Questions)"}
                </Button>
              </CardContent>
            </Card>
            {history.length > 0 && (
              <section className="mt-10 max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">Past Mock Tests</h2>
                    <p className="text-sm text-muted-foreground">Review previous attempts and revisit mistakes to improve faster.</p>
                  </div>
                  {!loadingHistory && (
                    <Button variant="outline" size="sm" onClick={loadHistory}>Refresh</Button>
                  )}
                </div>
                <div className="grid gap-4">
                  {history.map((attempt, index) => {
                    return (
                      <Card key={attempt.id || index} className="border border-border">
                        <CardContent className="p-4 grid gap-4 sm:grid-cols-[1fr_auto] items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">{new Date(attempt.completed_at).toLocaleString()}</p>
                            <h3 className="font-semibold text-foreground">{attempt.mock_tests.title}</h3>
                            <p className="text-sm text-muted-foreground">Score: {attempt.score}% • Correct: {attempt.correct_answers}/{attempt.total_questions} • Time: {formatTime(attempt.time_taken_seconds)}</p>
                          </div>
                          <Button onClick={() => reviewPreviousAttempt(attempt)} className="bg-gold text-accent-foreground hover:bg-gold-light">
                            Review Attempt
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {testState === "taking" && questions.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-muted-foreground">Question {currentQ + 1} / {questions.length}</div>
              <div className="flex items-center gap-2 text-sm font-mono bg-destructive/10 text-destructive px-3 py-1 rounded-full">
                <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
              </div>
            </div>

            {/* Progress */}
            <div className="flex gap-1 mb-6">
              {questions.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i === currentQ ? "bg-gold" : answers[questions[i].id] !== undefined ? "bg-secondary" : "bg-muted"}`} />
              ))}
            </div>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-lg font-bold text-foreground mb-6">{questions[currentQ].question}</h2>
                <div className="space-y-3">
                  {questions[currentQ].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswers(prev => ({ ...prev, [questions[currentQ].id]: i }))}
                      className={`w-full text-left p-4 rounded-xl border transition-all text-sm ${
                        answers[questions[currentQ].id] === i
                          ? "border-gold bg-gold/10 text-foreground"
                          : "border-border hover:border-gold/50 text-foreground"
                      }`}
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="ghost" disabled={currentQ === 0} onClick={() => setCurrentQ(prev => prev - 1)}>Previous</Button>
                  {currentQ < questions.length - 1 ? (
                    <Button onClick={() => setCurrentQ(prev => prev + 1)} className="bg-gold text-accent-foreground hover:bg-gold-light">Next</Button>
                  ) : (
                    <Button onClick={submitTest} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Submit Test</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {testState === "review" && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">Test Results</h1>
              <div className="text-5xl font-display font-bold text-gold">
                {Math.round((questions.filter(q => answers[q.id] === q.correct_answer).length / questions.length) * 100)}%
              </div>
              <p className="text-muted-foreground mt-2">
                {questions.filter(q => answers[q.id] === q.correct_answer).length} / {questions.length} correct
              </p>
              <Button onClick={() => { setTestState("setup"); setQuestions([]); }} className="mt-4 bg-gold text-accent-foreground hover:bg-gold-light">
                Take Another Test
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((q, i) => {
                const isCorrect = answers[q.id] === q.correct_answer;
                return (
                  <Card key={i} className={`border-l-4 ${isCorrect ? "border-l-secondary" : "border-l-destructive"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2 mb-3">
                        {isCorrect ? <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />}
                        <span className="font-medium text-foreground text-sm">{q.question}</span>
                      </div>
                      <div className="ml-7 space-y-1 text-sm">
                        {q.options.map((opt, j) => (
                          <div key={j} className={`px-2 py-1 rounded ${
                            j === q.correct_answer ? "bg-secondary/10 text-secondary font-medium" :
                            j === answers[q.id] && !isCorrect ? "bg-destructive/10 text-destructive" :
                            "text-muted-foreground"
                          }`}>
                            {String.fromCharCode(65 + j)}. {opt}
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground mt-2 italic">{q.explanation}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
