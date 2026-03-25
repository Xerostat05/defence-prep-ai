import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { BookOpen, Target, BarChart3, Brain, LogOut, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const dashboardItems = [
  { title: "Mock Tests", desc: "AI-generated practice tests for NDA, CDS, AFCAT", icon: Target, path: "/mock-test", color: "bg-gold/10 text-gold" },
  { title: "Study Planner", desc: "Get a personalized AI study plan for your exam", icon: BookOpen, path: "/study-planner", color: "bg-secondary/10 text-secondary" },
  { title: "Study Materials", desc: "Curated notes & resources for all defence exams", icon: FileText, path: "/study-materials", color: "bg-olive/10 text-olive" },
  { title: "Performance Analysis", desc: "Track scores, accuracy, and improvement trends", icon: BarChart3, path: "/analysis", color: "bg-primary/10 text-primary" },
  { title: "AI Mentor", desc: "Chat with OliveBot for instant guidance and doubt solving", icon: Brain, path: "#", color: "bg-gold/10 text-gold", hint: "Use the chat widget →" },
];

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Welcome, {user?.user_metadata?.full_name || "Aspirant"}!
            </h1>
            <p className="text-muted-foreground text-sm">Your defence exam preparation hub</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {dashboardItems.map((item) => (
            <button
              key={item.title}
              onClick={() => item.path !== "#" && navigate(item.path)}
              className="bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all text-left group"
            >
              <div className={`p-3 rounded-xl w-fit mb-4 ${item.color}`}>
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
              {item.hint && <p className="text-xs text-gold mt-2">{item.hint}</p>}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
