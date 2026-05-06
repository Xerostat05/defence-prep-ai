import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const PGTSimulatorSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-slate-950 text-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold tracking-widest text-gold uppercase">Live Simulator</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white mt-4 mb-4">
            PGT Simulator — practice Balli Fatta Rassi in real time
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-body">
            Move the balli, manage rassi tension, and learn to adapt across multiple obstacle layouts. The simulator now includes interactive drag controls and varied scenarios beyond the standard setup.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1.5fr_auto] items-center">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-semibold text-white">Real-time drag control</h3>
                <p className="text-sm text-muted-foreground">Drag the balli to feel real-time rope tension, balancing the load while avoiding OOB zones.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-semibold text-white">Multiple obstacle layouts</h3>
                <p className="text-sm text-muted-foreground">Each run can present a different bank configuration and OOB challenge, so you build adaptable planning skills.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-white">PGT mission readiness</h3>
              <p className="text-sm text-muted-foreground">Train for the progressive group task with both strategic planning and live execution feedback.</p>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <Button
              size="lg"
              className="bg-gold text-accent-foreground hover:bg-gold-light shadow-gold"
              onClick={() => { window.location.href = "/pgt-simulator/index.html"; }}
            >
              <Play className="mr-2 h-4 w-4" />
              Launch PGT Simulator
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PGTSimulatorSection;
