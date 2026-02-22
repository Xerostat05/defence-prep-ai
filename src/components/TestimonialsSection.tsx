import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Capt. Arjun Sharma",
    role: "IMA, Dehradun — NDA Entry",
    text: "The AI mock tests adapted to my weak areas in Maths. Within 3 months, my scores jumped from 45% to 82%. The SSB simulator was a game-changer.",
    stars: 5,
  },
  {
    name: "Lt. Priya Nair",
    role: "OTA, Chennai — CDS Entry",
    text: "The AI chatbot helped me clear doubts at 2AM before my exam. The adaptive study plan kept me focused when I felt overwhelmed. Recommended to every aspirant!",
    stars: 5,
  },
  {
    name: "Fg. Off. Rahul Deshmukh",
    role: "AFA, Hyderabad — AFCAT Entry",
    text: "Best defence prep platform I've used. The TAT and WAT practice with AI feedback made my SSB interview feel like a breeze. Cleared in my first attempt!",
    stars: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-widest text-gold uppercase">Testimonials</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
            Warriors Who <span className="text-gradient-gold">Made It</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="bg-card rounded-xl p-6 lg:p-8 border border-border shadow-card"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-foreground/80 mb-6 leading-relaxed font-body text-sm">
                "{t.text}"
              </p>
              <div>
                <p className="font-display font-bold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground font-body">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
