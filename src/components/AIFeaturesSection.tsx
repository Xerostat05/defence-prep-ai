import { motion } from "framer-motion";
import { Bot, Brain, Target, BarChart3, Zap, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: Bot, title: "AI Chatbot Mentor", slug: "ai-chatbot", description: "24/7 intelligent chatbot trained on defence exam patterns. Ask doubts, get explanations, and receive personalized guidance instantly." },
  { icon: Brain, title: "Agentic AI Study Planner", slug: "study-planner", description: "Our AI agent creates and adapts your daily study plan based on your performance, weak areas, and exam date countdown." },
  { icon: Target, title: "Smart Mock Tests", slug: "mock-tests", description: "AI-generated mock tests that adapt difficulty in real-time. Every test is unique and calibrated to push your limits." },
  { icon: BarChart3, title: "Performance Analytics", slug: "performance-analytics", description: "Deep AI-driven analysis of your test results. Track progress, identify weak topics, and get actionable improvement strategies." },
  { icon: Zap, title: "Instant Answer Evaluation", slug: "answer-evaluation", description: "Write answers for SSB or descriptive exams and get AI-powered evaluation with scoring, feedback, and model answers." },
  { icon: MessageCircle, title: "AI Interview Simulator", slug: "interview-simulator", description: "Practice SSB personal interviews with our AI. Get real-time feedback on your responses, body language tips, and confidence scoring." },
];

const AIFeaturesSection = () => {
  const navigate = useNavigate();
  return (
    <section id="ai-features" className="py-20 lg:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-widest text-gold uppercase">AI-Powered</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
            Intelligence That <span className="text-gradient-gold">Trains</span> You
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-body">
            Cutting-edge AI features designed specifically for defence aspirants
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative bg-card rounded-xl p-6 lg:p-8 border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div className="p-3 rounded-xl bg-gold/10 w-fit mb-5 group-hover:bg-gold/20 transition-colors">
                <feature.icon className="h-7 w-7 text-gold" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-body">
                {feature.description}
              </p>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gold/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIFeaturesSection;
