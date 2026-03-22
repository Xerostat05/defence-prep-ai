import { Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary py-12 border-t border-gold/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-gold" />
              <span className="font-display text-lg font-bold text-primary-foreground">
                DefencePrep<span className="text-gold">AI</span>
              </span>
            </div>
            <p className="text-sm text-primary-foreground/50 font-body">
              India's AI-powered platform for defence exam & SSB preparation.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-primary-foreground mb-4">Written Exams</h4>
            <div className="flex flex-col gap-2">
              {["NDA", "CDS", "AFCAT", "CAPF", "INET"].map((e) => (
                <a key={e} href="#" className="text-sm text-primary-foreground/50 hover:text-gold transition-colors font-body">
                  {e} Preparation
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-primary-foreground mb-4">SSB Prep</h4>
            <div className="flex flex-col gap-2">
              {["OIR Practice", "TAT & WAT", "SRT Bank", "GD Simulator", "PI Questions"].map((e) => (
                <a key={e} href="#" className="text-sm text-primary-foreground/50 hover:text-gold transition-colors font-body">
                  {e}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-primary-foreground mb-4">Company</h4>
            <div className="flex flex-col gap-2">
              {["About Us", "Blog", "Contact", "Privacy Policy", "Terms of Service"].map((e) => (
                <a key={e} href="#" className="text-sm text-primary-foreground/50 hover:text-gold transition-colors font-body">
                  {e}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-6 text-center">
          <p className="text-sm text-primary-foreground/30 font-body">
            © 2026 DefencePrepAI. All rights reserved. Not affiliated with any government entity.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
