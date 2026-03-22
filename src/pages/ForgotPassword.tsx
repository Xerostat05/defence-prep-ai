import { useState } from "react";
import { motion } from "framer-motion";
import { Leaf, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Reset link sent! Check your email.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-6">
          <a href="/auth" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-gold transition-colors">
            <ArrowLeft className="h-4 w-4" /><span className="text-sm">Back to Login</span>
          </a>
        </div>
        <div className="bg-card rounded-2xl shadow-card-hover p-8 border border-border">
          <div className="text-center mb-8">
            <Leaf className="h-8 w-8 text-gold mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground">Reset Password</h1>
            <p className="text-muted-foreground text-sm mt-1">Enter your email to receive a reset link</p>
          </div>
          {sent ? (
            <p className="text-center text-muted-foreground">Check your inbox for the reset link. You can close this page.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="aspirant@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required maxLength={255} />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-gold text-accent-foreground hover:bg-gold-light font-semibold h-11 shadow-gold">
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
