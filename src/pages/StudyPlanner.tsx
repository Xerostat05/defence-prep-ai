import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { buildBackendUrl } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

type ScheduleItem = {
  week: number;
  day: string;
  date: string;
  topics: string[];
  duration_hours: number;
  priority: string;
  notes?: string;
};

type Plan = {
  id: string;
  user_id: string;
  title: string;
  exam_type: string;
  plan_data: ScheduleItem[];
  start_date: string;
  end_date: string | null;
  created_at: string;
};

const StudyPlanner = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [examType, setExamType] = useState("");
  const [examDate, setExamDate] = useState("");
  const [weakAreas, setWeakAreas] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("4");
  const [isGenerating, setIsGenerating] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("study_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch plans", error);
      return;
    }

    setPlans(data as Plan[]);
  };

  const generatePlan = async () => {
    if (!user) {
      toast.error("Please sign in to generate a study plan.");
      return;
    }

    setIsGenerating(true);

    const payload = {
      exam_type: examType,
      exam_date: examDate || null,
      weak_areas: weakAreas ? weakAreas.split(",").map((s) => s.trim()) : [],
      hours_per_day: parseInt(hoursPerDay, 10) || 4,
    };

    try {
      const response = await fetch(buildBackendUrl("/generate-study-plan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Study plan generation failed:", data);
        toast.error("Unable to generate study plan. See console for details.");
        return;
      }

      const planData = data.plan ?? data.schedule ?? [];
      if (!Array.isArray(planData) || planData.length === 0) {
        toast.error("AI returned an invalid plan. Try again with more detail.");
        return;
      }

      const planTitle = data.title || data.plan_title || `${examType || "Defence"} Study Plan`;
      const startDate = data.start_date || new Date().toISOString().slice(0, 10);
      const endDate = data.end_date || (examDate || null);

      const { data: inserted, error } = await supabase
        .from("study_plans")
        .insert([
          {
            user_id: user.id,
            title: planTitle,
            exam_type: examType,
            plan_data: planData,
            start_date: startDate,
            end_date: endDate,
          },
        ])
        .select("*")
        .single();

      if (error) {
        console.error("Saving study plan failed:", error);
        toast.error("Unable to save plan. Please try again.");
        return;
      }

      setPlans((prevPlans) => [inserted as Plan, ...prevPlans]);
      setActivePlan(inserted as Plan);
      toast.success("Your study plan is ready.");
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("An error occurred while generating the study plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const deletePlan = async (id: string) => {
    await supabase.from("study_plans").delete().eq("id", id);
    setPlans(prev => prev.filter(p => p.id !== id));
    if (activePlan?.id === id) setActivePlan(null);
    toast.success("Plan deleted");
  };

  const priorityColor = (p: string | undefined) => {
    if (p === "high") return "bg-destructive/10 text-destructive";
    if (p === "medium") return "bg-gold/10 text-gold";
    return "bg-secondary/10 text-secondary";
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">AI Study Planner</h1>
            <p className="text-muted-foreground text-sm">Generate personalized study plans powered by AI</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-gold" />Generate Plan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Exam Type</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                  <SelectContent>
                    {["NDA", "CDS", "AFCAT", "CAPF", "INET", "SSB"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam Date (optional)</Label>
                <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Weak Areas (optional)</Label>
                <Input placeholder="e.g., Maths, History" value={weakAreas} onChange={e => setWeakAreas(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hours/Day</Label>
                <Input type="number" min="1" max="12" value={hoursPerDay} onChange={e => setHoursPerDay(e.target.value)} />
              </div>
              <Button onClick={generatePlan} disabled={isGenerating || !examType} className="w-full bg-gold text-accent-foreground hover:bg-gold-light font-semibold shadow-gold">
                {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating...</> : "Generate Study Plan"}
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {activePlan ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-foreground">{activePlan.title}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActivePlan(null)}>← Back to Plans</Button>
                </div>
                <div className="grid gap-3">
                  {(activePlan.plan_data || []).map((item, i) => (
                    <Card key={`${item.date}-${i}`} className="border-border">
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="text-center min-w-[90px]">
                          <div className="text-xs text-muted-foreground">{item.day}</div>
                          <div className="font-display font-bold text-foreground text-sm">{item.date}</div>
                          <div className="text-xs text-muted-foreground">Week {item.week}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {item.topics.map((t, j) => (
                              <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>{item.duration_hours}h</span>
                            {item.priority && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor(item.priority)}`}>{item.priority}</span>
                            )}
                          </div>
                          {item.notes && <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-4">Your Study Plans</h2>
                {plans.length === 0 ? (
                  <Card className="border-dashed"><CardContent className="p-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No plans yet. Generate your first AI study plan!</p>
                  </CardContent></Card>
                ) : (
                  <div className="grid gap-3">
                    {plans.map(plan => (
                      <Card key={plan.id} className="cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => setActivePlan(plan)}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <h3 className="font-display font-bold text-foreground">{plan.title}</h3>
                            <p className="text-xs text-muted-foreground">
                                {plan.exam_type} • {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : "New Plan"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudyPlanner;