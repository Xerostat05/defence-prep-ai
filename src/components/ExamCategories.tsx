import { motion } from "framer-motion";
import { BookOpen, Shield, Swords, Plane, Anchor, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const exams = [
  { icon: Swords, name: "NDA", full: "National Defence Academy", subjects: ["Maths", "GAT", "SSB"], color: "from-navy to-navy-light", slug: "nda" },
  { icon: Shield, name: "CDS", full: "Combined Defence Services", subjects: ["English", "GK", "Maths"], color: "from-olive to-olive-light", slug: "cds" },
  { icon: Plane, name: "AFCAT", full: "Air Force Common Admission Test", subjects: ["GK", "English", "Maths", "Reasoning"], color: "from-navy-light to-olive", slug: "afcat" },
  { icon: Anchor, name: "INET", full: "Indian Navy Entrance Test", subjects: ["English", "Reasoning", "GK", "Maths"], color: "from-navy to-olive-light", slug: "inet" },
  { icon: Users, name: "SSB Interview", full: "Services Selection Board", subjects: ["OIR", "TAT", "WAT", "SRT", "GD", "PI"], color: "from-olive to-navy", slug: "ssb-interview" },
  { icon: BookOpen, name: "CAPF", full: "Central Armed Police Forces", subjects: ["GS", "Essay", "Comprehension"], color: "from-olive-light to-navy-light", slug: "capf" },
];

const ExamCategories = () => {
  return (
    <section id="exams" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-widest text-gold uppercase">Exam Categories</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
            Choose Your <span className="text-gradient-gold">Battlefield</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-body">
            Comprehensive preparation for every major defence examination in India
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam, i) => (
            <motion.div
              key={exam.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group relative overflow-hidden rounded-xl bg-card shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer border border-border"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${exam.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative p-6 lg:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gold/10 group-hover:bg-primary-foreground/10 transition-colors">
                    <exam.icon className="h-7 w-7 text-gold group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground group-hover:text-primary-foreground/60 uppercase transition-colors">
                    Practice Now
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground group-hover:text-primary-foreground mb-1 transition-colors">
                  {exam.name}
                </h3>
                <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/70 mb-4 transition-colors font-body">
                  {exam.full}
                </p>
                <div className="flex flex-wrap gap-2">
                  {exam.subjects.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground group-hover:bg-primary-foreground/10 group-hover:text-primary-foreground/80 transition-colors font-body"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExamCategories;
