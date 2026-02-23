import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";

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
      <nav className="border-b border-border bg-card px-4 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-gold" />
          <span className="font-display text-lg font-bold text-foreground">
            DefencePrep<span className="text-gold">AI</span>
          </span>
        </a>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }} className="gap-2">
            <LogOut className="h-4 w-4" /> Log Out
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Welcome, {user?.user_metadata?.full_name || "Aspirant"}!
        </h1>
        <p className="text-muted-foreground mb-8">Your dashboard is being built. Start exploring soon!</p>

        <div className="grid md:grid-cols-3 gap-6">
          {["Mock Tests", "AI Mentor", "SSB Practice"].map((item) => (
            <div key={item} className="bg-card rounded-xl border border-border p-6 shadow-card text-center">
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{item}</h3>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
