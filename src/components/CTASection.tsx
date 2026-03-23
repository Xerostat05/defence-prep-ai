import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-20 lg:py-28 bg-muted/50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
            Ready to Begin Your{" "}
            <span className="text-gradient-gold">Defence Journey</span>?
          </h2>
          <p className="text-muted-foreground mb-10 text-lg font-body">
            Join thousands of aspirants already training with AI. 
            Your first step towards wearing the uniform starts now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-gold text-accent-foreground hover:bg-gold-light font-semibold text-base px-10 py-6 shadow-gold"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-foreground/20 text-foreground hover:bg-foreground/5 text-base px-10 py-6"
            >
              Talk to AI Mentor
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
