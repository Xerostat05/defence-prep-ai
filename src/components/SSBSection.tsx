import { motion } from "framer-motion";
import { ClipboardList, MessageSquare, Users, Eye, Mic, PenTool } from "lucide-react";

const ssbModules = [
  { icon: Eye, name: "OIR Tests", desc: "Officer Intelligence Rating practice with timed sessions", path: "/oir-practice" },
  { icon: PenTool, name: "TAT Practice", desc: "Thematic Apperception Tests with AI narration feedback", path: "/tat-practice" },
  { icon: MessageSquare, name: "WAT Trainer", desc: "Word Association Tests under real exam pressure", path: "/wat-practice" },
  { icon: ClipboardList, name: "SRT Bank", desc: "1000+ Situation Reaction Tests with model responses", path: "/srt-practice" },
  { icon: Users, name: "GD Simulator", desc: "AI-powered Group Discussion practice and evaluation", path: "/gd-simulator" },
  { icon: Mic, name: "PI Preparation", desc: "Personal Interview prep with AI-generated PIQ questions", path: "/pi-preparation" },
];

const SSBSection = () => {
  return (
    <section id="ssb" className="py-20 lg:py-28 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-widest text-gold uppercase">SSB Interview</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mt-3 mb-4">
            Crack the <span className="text-gradient-gold">SSB</span> with Confidence
          </h2>
          <p className="text-primary-foreground/60 max-w-xl mx-auto font-body">
            Complete SSB preparation suite — practice every stage exactly like the real interview
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ssbModules.map((module, i) => (
            <motion.div
              key={module.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.03 }}
              className="group bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 rounded-xl p-6 hover:bg-primary-foreground/10 transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = module.path}
            >
              <module.icon className="h-8 w-8 text-gold mb-4" />
              <h3 className="font-display text-lg font-bold text-primary-foreground mb-2">
                {module.name}
              </h3>
              <p className="text-sm text-primary-foreground/50 font-body">{module.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SSBSection;
