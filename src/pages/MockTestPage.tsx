import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

const MockTest = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="space-y-4 text-center py-20">
          <h1 className="text-4xl font-bold text-foreground">Mock Test</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The mock test page is temporarily unavailable. Please return to the dashboard or try another feature.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-gold-light"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
};

export default MockTest;
