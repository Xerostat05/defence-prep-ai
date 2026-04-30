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

// UPDATED TYPES: Matching your Python backend keys
type ScheduleItem = { day: string; topics: string[]; hours: number; week?: number; priority?: string };
type Plan = { 
  id: string; 
  plan_title: string; // Changed from title
  exam: string;       // Changed from exam_type
  schedule: ScheduleItem[]; // Changed from plan_data
  created_at: string;
  date?: string;
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
    const { data } = await supabase
      .from("study_plans")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPlans(data as unknown as Plan[]);
  };

  const generatePlan = async () => {
  setIsGenerating(true);
  
  const payload = {
    exam_type: examType,
    exam_date: examDate || null,
    weak_areas: weakAreas ? weakAreas.split(",").map((s) => s.trim()) : [],
    hours_per_day: parseInt(hoursPerDay, 10) || 4,
  };

  try {
    const response = await fetch("http://127.0.0.1:8000/generate-study-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    // If it still fails, this will show you exactly WHY Python is rejecting it
    if (!response.ok) {
      console.error("FastAPI Validation Error:", data);
      toast.error("Format error - see console");
      return;
    }

    if (data.status === "success") {
      setPlans((prevPlans) => [...prevPlans, data]);
      toast.success("Plan generated!");
    }
  } catch (error) {
    console.error("Fetch error:", error);
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
                  {/* FIX 3: Using plan_title instead of title */}
                  <h2 className="font-display text-xl font-bold text-foreground">{activePlan.plan_title}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActivePlan(null)}>← Back to Plans</Button>
                </div>
                <div className="grid gap-3">
                  {/* FIX 3: Mapping through 'schedule' instead of 'plan_data' */}
                  {(activePlan.schedule || []).map((item, i) => (
                    <Card key={i} className="border-border">
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-xs text-muted-foreground">Day</div>
                          <div className="font-display font-bold text-foreground text-sm">{item.day}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {item.topics.map((t, j) => (
                              <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{item.hours}h per day</span>
                            {item.priority && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor(item.priority)}`}>{item.priority}</span>
                            )}
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
                            {/* FIX 3: Use plan_title */}
                            <h3 className="font-display font-bold text-foreground">{plan.plan_title}</h3>
                            {/* FIX 2: Safe date formatting */}
                            <p className="text-xs text-muted-foreground">
                                {plan.exam} • {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : "New Plan"}
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