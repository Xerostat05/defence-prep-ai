import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles, BookOpen, Target, BarChart3, Shield, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`;

const quickActions = [
  { label: "📚 Study Plan", prompt: "Create a study plan for NDA exam, 4 weeks, 5 hours/day" },
  { label: "❓ Practice Qs", prompt: "Give me 3 practice questions for NDA Mathematics" },
  { label: "🎖️ SSB Tips", prompt: "Help me prepare for SSB interview WAT test" },
  { label: "🎯 Today's Plan", prompt: "What should I study today for my defence exam?" },
];

const ChatWidget = () => {
  const location = useLocation();
  const isFullPage = location.pathname === "/chat";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm **OliveBot** 🫒 — your agentic AI mentor.\n\nI can:\n- 📚 **Create study plans** tailored to your exam\n- ❓ **Generate practice questions** on any topic\n- 📊 **Analyze your performance** and suggest improvements\n- 🎖️ **Coach you for SSB** (WAT/TAT/SRT/GD/PI)\n- 🎯 **Give daily recommendations**\n\nTry the quick actions below or ask me anything!" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/chat") {
      setIsOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (overrideInput?: string) => {
    const text = overrideInput || input.trim();
    if (!text || isLoading) return;
    if (!user) {
      setMessages(prev => [...prev, { role: "assistant", content: "Please **log in** to chat with me! Click the button below." }]);
      return;
    }

    const userMsg: Msg = { role: "user", content: text };
    setInput("");
    setShowQuickActions(false);
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages.filter((_, i) => i !== 0), userMsg];

    try {
      const resp = await fetch(AGENT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get response");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > 1) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Sorry, I encountered an error: ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={
              `fixed z-50 bg-card border border-border shadow-card-hover flex flex-col overflow-hidden ${
                isFullPage
                  ? "inset-0 m-0 w-full h-full rounded-none"
                  : "bottom-20 right-4 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[75vh] rounded-2xl"
              }`
            }
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary border-b border-border">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bot className="h-5 w-5 text-gold" />
                  <Sparkles className="h-3 w-3 text-gold absolute -top-1 -right-1" />
                </div>
                <div>
                  <span className="font-display font-bold text-primary-foreground text-sm">OliveBot AI Agent</span>
                  <span className="block text-[10px] text-primary-foreground/40 -mt-0.5">Powered by agentic exam guidance</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/chat")}
                  className="inline-flex items-center gap-1 rounded-full border border-primary-foreground/20 bg-primary/10 px-3 py-1 text-[11px] text-primary-foreground hover:bg-primary/20"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Full view
                </button>
                <button onClick={() => setIsOpen(false)} className="text-primary-foreground/60 hover:text-primary-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-3 w-3 text-gold" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-gold text-accent-foreground"
                      : "bg-muted text-foreground"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-3 w-3 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {/* Quick Actions */}
              {showQuickActions && messages.length <= 1 && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      className="text-xs bg-gold/10 text-gold border border-gold/20 rounded-lg px-3 py-2 hover:bg-gold/20 transition-colors text-left font-medium"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-2 items-center">
                  <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                    <Bot className="h-3 w-3 text-gold" />
                  </div>
                  <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-gold animate-spin" />
                    <span className="animate-pulse">Agent thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              {!user ? (
                <Button onClick={() => navigate("/auth")} className="w-full bg-gold text-accent-foreground hover:bg-gold-light font-semibold">
                  Log In to Chat
                </Button>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything or try: 'Make me a study plan'..."
                    className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold/50 text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-gold text-accent-foreground hover:bg-gold-light h-9 w-9">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isFullPage && (
        <div className="fixed bottom-4 right-4 z-50">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="w-14 h-14 rounded-full bg-gold text-accent-foreground shadow-gold flex items-center justify-center hover:bg-gold-light transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 text-secondary-foreground" />
            </span>
          )}
          </motion.button>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
