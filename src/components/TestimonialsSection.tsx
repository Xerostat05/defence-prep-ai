import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Review = {
  id: string;
  user_id: string;
  name: string;
  role: string;
  text: string;
  stars: number;
  created_at: string;
};

const DEFAULT_REVIEWS: Review[] = [
  {
    id: "sample-1",
    user_id: "00000000-0000-0000-0000-000000000000",
    name: "Ananya R.",
    role: "CDS aspirant",
    text: "The practice questions and study plan help me stay consistent every day. The app is still growing, but it already feels useful.",
    stars: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-2",
    user_id: "00000000-0000-0000-0000-000000000000",
    name: "Rahul M.",
    role: "NDA aspirant",
    text: "I like using the mock test interface for timed practice. The review section lets me track which topics I need to revisit.",
    stars: 4,
    created_at: new Date().toISOString(),
  },
];

const TestimonialsSection = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      const { data, error } = await supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Failed to load feedback", error);
        setLoading(false);
        return;
      }

      if (data?.length) {
        setReviews(data as Review[]);
      }
      setLoading(false);
    };

    loadReviews();
  }, []);

  const sortedReviews = useMemo(
    () => [...reviews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [reviews],
  );

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      alert("Please sign in to submit feedback.");
      return;
    }
    if (!feedback.trim()) {
      return;
    }

    const newReview = {
      user_id: user.id,
      name: name.trim() || "Anonymous",
      role: role.trim() || "Aspirant",
      text: feedback.trim(),
      stars: rating,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("user_feedback").insert(newReview).select("*").single();
    if (error) {
      console.error("Submit feedback failed", error);
      alert("Unable to submit feedback. Please try again.");
      return;
    }

    setReviews((current) => [data as Review, ...current]);
    setName("");
    setRole("");
    setFeedback("");
    setRating(5);
  };

  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold tracking-widest text-gold uppercase">Real Feedback</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
            Current users are sharing real prep reviews
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            This section collects feedback from authenticated users. Share your experience and help improve this project.
          </p>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="grid gap-6">
            {loading ? (
              <div className="rounded-3xl bg-card p-8 text-center text-muted-foreground">Loading reviews…</div>
            ) : (
              sortedReviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.45 }}
                  className="bg-card rounded-3xl p-6 border border-border shadow-card"
                >
                  <div className="flex items-center gap-2 mb-3">
                    {Array.from({ length: review.stars }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-foreground/85 leading-relaxed mb-6 font-body text-sm">"{review.text}"</p>
                  <div className="border-t border-border pt-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.role}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <motion.form
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            onSubmit={submitReview}
            className="bg-card rounded-3xl p-6 border border-border shadow-card"
          >
            <h3 className="font-display text-2xl font-bold text-foreground mb-4">Submit Your Feedback</h3>
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">Role</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. NDA aspirant"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">Rating</label>
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      className={`rounded-full p-2 transition ${starValue <= rating ? "bg-gold/10 text-gold" : "bg-muted text-muted-foreground"}`}
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mb-5">
              <label className="text-sm font-medium text-foreground mb-2 block">Feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share what helped you most"
                rows={5}
                className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-gold-light transition-colors"
            >
              Submit Feedback
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
