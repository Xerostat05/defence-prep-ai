import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Users, BookOpen, Target, Award, Brain } from "lucide-react";

const stats = [
  { icon: Users, value: 50000, suffix: "+", label: "Active Aspirants" },
  { icon: BookOpen, value: 10000, suffix: "+", label: "Practice Questions" },
  { icon: Target, value: 500, suffix: "+", label: "Mock Tests" },
  { icon: Award, value: 95, suffix: "%", label: "Success Rate" },
  { icon: Brain, value: 24, suffix: "/7", label: "AI Assistance" },
];

const Counter = ({ value, suffix }: { value: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref} className="text-3xl md:text-4xl font-display font-bold text-gold">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const StatsSection = () => {
  return (
    <section className="py-16 bg-primary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <stat.icon className="h-8 w-8 text-gold/60 mx-auto mb-3" />
              <Counter value={stat.value} suffix={stat.suffix} />
              <p className="text-sm text-primary-foreground/50 mt-1 font-body">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
