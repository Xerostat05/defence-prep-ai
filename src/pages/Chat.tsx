import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Chat = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">AI Chat</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Use OliveBot in full view to ask questions, clarify concepts, and get exam-focused study guidance.
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="rounded-3xl border border-border bg-card shadow-sm p-8 text-center">
          <p className="text-muted-foreground mb-4">
            The chat panel is available at the bottom-right. If not visible, toggle it using the chat button.
          </p>
          <p className="text-sm text-muted-foreground">
            For a full page experience, use the full view button inside the chat panel header.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Chat;
