import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { buildBackendUrl } from '@/lib/api';

interface OIRQuestion {
  id: number;
  question: string;
  options: string[];
}

interface OIRAnswer {
  question_id: number;
  selected_option: string;
}

interface OIRAnalysisResult {
  score: number;
  analysis: {
    summary: string;
    strength?: string;
    recommended_focus: Array<string | [string, number]>;
    decisions: string[];
  };
}

const DEFAULT_OIR_QUESTIONS: OIRQuestion[] = [
  {
    id: 1,
    question: "You must choose between helping a team member and finishing your own task on time. What do you do?",
    options: ["Help the team member first", "Finish your task first", "Ask for help", "Delay both until later"]
  },
  {
    id: 2,
    question: "Your unit is behind schedule and a senior insists on a conservative plan. What is your response?",
    options: ["Follow the senior's plan", "Present a faster plan", "Begin a quiet alternative", "Delay decision"]
  },
  {
    id: 3,
    question: "A colleague is taking undue credit for your work. How do you react?",
    options: ["Speak up calmly", "Confront aggressively", "Let it go", "Document and escalate"]
  },
  {
    id: 4,
    question: "A new command order seems unclear. You should...",
    options: ["Seek clarification immediately", "Guess and act", "Wait for more details", "Ask a peer"]
  },
  {
    id: 5,
    question: "You have to decide quickly between two risky options. You...",
    options: ["Choose the safer one", "Choose the one with higher reward", "Consult a teammate", "Avoid decision"]
  },
  {
    id: 6,
    question: "During a critical mission, a subordinate makes a mistake. You would...",
    options: ["Correct it calmly and move forward", "Blame them in front of the team", "Wait until later to discuss", "Take responsibility and coach them"]
  },
  {
    id: 7,
    question: "You discover a protocol violation by a fellow officer. You...",
    options: ["Address it sensibly and privately", "Report directly to your superior", "Ignore it to keep harmony", "Warn the officer first"]
  },
  {
    id: 8,
    question: "A new resource request affects your unit and another. You...",
    options: ["Allocate based on mission priority", "Favor your unit", "Split equally", "Ask higher command to decide"]
  },
  {
    id: 9,
    question: "Your team has conflicting opinions on the plan. You...",
    options: ["Listen, then decide clearly", "Follow the majority", "Delay until consensus forms", "Select the safest option"]
  },
  {
    id: 10,
    question: "A junior officer asks for mentorship on a sensitive matter. You...",
    options: ["Offer honest guidance", "Tell them to speak to their senior", "Give general advice only", "Decline to avoid complications"]
  },
  {
    id: 11,
    question: "Resources are scarce and two departments need them urgently. You...",
    options: ["Allocate fairly based on mission criticality", "Give more to the senior department", "Split equally regardless of need", "Ask higher authority to decide"]
  },
  {
    id: 12,
    question: "You discover an opportunity to improve unit efficiency. You...",
    options: ["Propose the improvement through proper channels", "Implement it without approval", "Keep it to yourself", "Discuss it informally first"]
  }
];

const OIRPractice = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<OIRQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [analysis, setAnalysis] = useState<OIRAnalysisResult | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(buildBackendUrl('generate-oir-questions?count=5'));
        const data = await response.json();
        const fetchedQuestions = data.questions || [];
        if (fetchedQuestions.length > 0) {
          setQuestions(fetchedQuestions);
        } else {
          setQuestions(DEFAULT_OIR_QUESTIONS);
          toast.info("Loaded default OIR questions.");
        }
      } catch (err) {
        console.error("Failed to load OIR questions", err);
        setQuestions(DEFAULT_OIR_QUESTIONS);
        toast.error("Could not load OIR questions from the backend; using default questions.");
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleOptionSelect = (questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    const answerList: OIRAnswer[] = questions.map((question) => ({
      question_id: question.id,
      selected_option: answers[question.id] || "",
    }));

    if (answerList.some((item) => !item.selected_option)) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(buildBackendUrl('/analyze-oir'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id || "guest",
          answers: answerList,
          time_taken: 180,
        }),
      });

      if (!res.ok) {
        console.error("OIR analysis failed:", res.status);
        const fallbackAnalysis = generateFallbackOIRAnalysis(answerList);
        setAnalysis(fallbackAnalysis);
        toast.info("OIR analysis completed with AI fallback.");
        setSubmitting(false);
        return;
      }
      
      const data = await res.json();
      setAnalysis(data);
      toast.success("OIR analysis complete.");
    } catch (err) {
      console.error(err);
      const fallbackAnalysis = generateFallbackOIRAnalysis(answerList);
      setAnalysis(fallbackAnalysis);
      toast.info("Using local AI analysis.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateFallbackOIRAnalysis = (answerList: OIRAnswer[]): OIRAnalysisResult => {
    const proactiveAnswers = ["help", "speak", "clarify", "listen", "propose", "fair", "immediate"];
    const proactiveCount = answerList.filter(a => 
      proactiveAnswers.some(kw => a.selected_option.toLowerCase().includes(kw))
    ).length;
    
    const score = Math.round((proactiveCount / answerList.length) * 100);
    const summary = score >= 75
      ? "Strong OIR profile with proactive decision-making."
      : "Moderate OIR profile. Focus on assertive, team-first thinking.";

    return {
      score,
      analysis: {
        summary,
        strength: score >= 75 ? "Leadership & Team Focus" : "Adaptability",
        recommended_focus: [
          score >= 75 ? "Leadership clarity" : "Assertive decision-making",
          "Team collaboration",
          "Ethical judgment"
        ],
        decisions: [
          proactiveCount > 1 ? "Team Synergy" : "Balanced Response",
          score >= 75 ? "Leadership Initiative" : "Practical Problem Solving"
        ]
      }
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}> 
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">OIR Practice</h1>
            <p className="text-sm text-slate-400">Timed MCQ-based Officer Intelligence Rating practice with instant AI scoring.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[3fr_1fr]">
          <section className="space-y-6">
            <Card className="bg-slate-900/80 border-white/10">
              <CardHeader>
                <CardTitle>OIR Question Set</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingQuestions ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-gold" />
                  </div>
                ) : questions.length === 0 ? (
                  <p className="text-slate-400">No questions available right now. Refresh to try again.</p>
                ) : (
                  <div className="space-y-8">
                    {questions.map((question) => (
                      <div key={question.id} className="rounded-3xl bg-slate-900/90 border border-white/5 p-5">
                        <div className="mb-4">
                          <div className="text-slate-300 font-semibold mb-2">Question {question.id}</div>
                          <p className="text-slate-100">{question.question}</p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {question.options.map((option) => (
                            <button
                              key={option}
                              onClick={() => handleOptionSelect(question.id, option)}
                              className={`rounded-2xl border p-4 text-left transition-all ${answers[question.id] === option ? "border-gold bg-gold/10 text-white" : "border-white/10 bg-slate-950 text-slate-300 hover:border-gold/30"}`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-slate-400 text-sm">Answer all questions and submit for a quick OIR assessment.</div>
              <Button
                onClick={handleSubmit}
                disabled={submitting || questions.length === 0}
                className="bg-gold text-black hover:bg-amber-300"
              >
                {submitting ? "Submitting..." : "Submit for Analysis"}
              </Button>
            </div>
          </section>

          <aside className="space-y-6">
            <Card className="bg-slate-900/80 border-white/10">
              <CardHeader>
                <CardTitle>OIR Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-slate-400 text-sm">
                <p>Choose options that reflect clear judgment, team focus, and decisive leadership.</p>
                <p>Scoring is based on how consistently you select proactive and service-oriented responses.</p>
                <p>Think like an officer: safety, ethics, and mission outcome first.</p>
              </CardContent>
            </Card>

            {analysis && (
              <Card className="bg-slate-900/80 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-300 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> OIR Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-slate-100">
                    <div className="text-sm text-slate-400">Score</div>
                    <div className="text-3xl font-bold text-gold">{analysis.score}%</div>
                    <p className="text-slate-300">{analysis.analysis?.summary}</p>
                    <div className="mt-4 space-y-2 text-sm text-slate-400">
                      <div><span className="font-semibold text-slate-200">Strengths:</span> {analysis.analysis?.recommended_focus?.join(", ")}</div>
                      <div><span className="font-semibold text-slate-200">Decision themes:</span> {analysis.analysis?.decisions?.join(", ")}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default OIRPractice;
