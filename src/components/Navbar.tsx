import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Exams", path: "/#exams" },
  { label: "AI Features", path: "/#ai-features" },
  { label: "SSB Prep", path: "/#ssb" },
  { label: "PGT Simulator", path: "/pgt-simulator/index.html" },
  { label: "About", path: "/about" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToHash = (hash: string) => {
    const id = hash.replace("#", "");
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNav = (path: string) => {
    if (path.endsWith('.html')) {
      window.location.href = path;
      return;
    }

    if (path.includes("#")) {
      const [pathname, hash] = path.split("#");
      const targetPath = pathname || "/";

      if (location.pathname === targetPath) {
        navigate(path, { replace: false });
        scrollToHash(`#${hash}`);
      } else {
        navigate(path, { replace: false });
      }
    } else {
      navigate(path, { replace: false });
    }
  };

  useEffect(() => {
    if (location.hash) {
      scrollToHash(location.hash);
    }
  }, [location.pathname, location.hash]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-primary/90 backdrop-blur-md border-b border-gold/20"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <a href="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="Olive Wings" className="h-8 w-8" />
            <span className="font-display text-xl font-bold text-primary-foreground tracking-wide">
              Olive<span className="text-gold">Wings</span>
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.path)}
                className="text-sm font-medium text-primary-foreground/80 hover:text-gold transition-colors duration-200"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" className="text-primary-foreground/80 hover:text-gold hover:bg-gold/10" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
                <Button className="bg-gold text-accent-foreground hover:bg-gold-light font-semibold shadow-gold" onClick={() => { signOut(); }}>
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-primary-foreground/80 hover:text-gold hover:bg-gold/10" onClick={() => navigate("/auth")}>
                  Log In
                </Button>
                <Button className="bg-gold text-accent-foreground hover:bg-gold-light font-semibold shadow-gold" onClick={() => navigate("/auth")}>
                  Get Started Free
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-primary-foreground"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden pb-4"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => { handleNav(link.path); setIsOpen(false); }}
                  className="text-primary-foreground/80 hover:text-gold py-2 transition-colors text-left"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t border-gold/20">
                {user ? (
                  <>
                    <Button variant="ghost" className="text-primary-foreground/80 hover:text-gold hover:bg-gold/10 justify-start" onClick={() => { navigate("/dashboard"); setIsOpen(false); }}>
                      Dashboard
                    </Button>
                    <Button className="bg-gold text-accent-foreground hover:bg-gold-light font-semibold" onClick={() => { signOut(); setIsOpen(false); }}>
                      Log Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="text-primary-foreground/80 hover:text-gold hover:bg-gold/10 justify-start" onClick={() => { navigate("/auth"); setIsOpen(false); }}>
                      Log In
                    </Button>
                    <Button className="bg-gold text-accent-foreground hover:bg-gold-light font-semibold" onClick={() => { navigate("/auth"); setIsOpen(false); }}>
                      Get Started Free
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
