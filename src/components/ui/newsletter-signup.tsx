import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
// Loaded on demand — not part of the initial bundle
const fireConfetti = () =>
  import('canvas-confetti').then(({ default: confetti }) =>
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
  );
export interface NewsletterSignupProps {
  onSubmit: (email: string) => Promise<void>;
  className?: string;
}

export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  onSubmit,
  className = "",
}) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(email);
      setIsSubmitted(true);
      fireConfetti();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`bg-secondary/50 border border-primary/10 rounded-lg p-6 ${className}`}
    >
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div className="flex items-start justify-center gap-1 flex-col overflow-y-hidden">
              <motion.h2
                className="text-2xl font-bold text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Subscribe to our newsletter
              </motion.h2>
              <motion.p
                className="text-muted-foreground text-sm"
                initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.4 }}
              >
                Stay up to date with our latest news and updates.
              </motion.p>
            </div>
            <div className="space-y-2">
              <motion.label
                initial={{ opacity: 0, filter: "blur(3px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.6 }}
                className="font-medium text-sm text-foreground"
                htmlFor="newsletter-email"
              >
                Email address
              </motion.label>
              <motion.div
                className="flex flex-col gap-2 sm:flex-row"
                initial={{ opacity: 0, filter: "blur(3px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.7 }}
              >
                <input
                  type="email"
                  id="newsletter-email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  <span>Subscribe</span>
                </button>
              </motion.div>
            </div>
            <AnimatePresence>
              {error && (
                <motion.p
                  className="text-destructive text-sm"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Thank you for subscribing!
            </h2>
            <p className="text-muted-foreground">
              We've sent a confirmation email to your inbox.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
