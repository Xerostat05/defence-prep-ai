import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

type PlanItem = { week: number; day: string; topics: string[]; duration_hours: number; priority: string };
type Plan = { id: string; title: string; exam_type: string; plan_data: PlanItem[]; created_at: string };

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
    const { data } = await supabase
      .from("study_plans")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPlans(data as unknown as Plan[]);
  };

  const generatePlan = async () => {
    if (!examType) { toast.error("Select an exam type"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-study-plan", {
        body: { exam_type: examType, exam_date: examDate, weak_areas: weakAreas, hours_per_day: Number(hoursPerDay) },
      });
      if (error) throw error;
      
      const { error: insertErr } = await supabase.from("study_plans").insert({
        user_id: user!.id,
        title: data.title || `${examType} Study Plan`,
        exam_type: examType,
        plan_data: data.plan,
        end_date: examDate || null,
      });
      if (insertErr) throw insertErr;
      toast.success("Study plan generated!");
      fetchPlans();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate plan");
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

  const priorityColor = (p: string) => {
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
          {/* Generator */}
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
              <Button onClick={generatePlan} disabled={isGenerating} className="w-full bg-gold text-accent-foreground hover:bg-gold-light font-semibold shadow-gold">
                {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating...</> : "Generate Study Plan"}
              </Button>
            </CardContent>
          </Card>

          {/* Plans List / Active Plan */}
          <div className="lg:col-span-2">
            {activePlan ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-foreground">{activePlan.title}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActivePlan(null)}>← Back to Plans</Button>
                </div>
                <div className="grid gap-3">
                  {(activePlan.plan_data || []).map((item, i) => (
                    <Card key={i} className="border-border">
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-xs text-muted-foreground">Week {item.week}</div>
                          <div className="font-display font-bold text-foreground text-sm">{item.day}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {item.topics.map((t, j) => (
                              <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{item.duration_hours}h</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor(item.priority)}`}>{item.priority}</span>
                          </div>
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
                            <p className="text-xs text-muted-foreground">{plan.exam_type} • {new Date(plan.created_at).toLocaleDateString()}</p>
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
