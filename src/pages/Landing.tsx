import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Zap, Eye, BarChart3, Shield, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

const features = [
  {
    icon: Eye,
    title: 'AI Visibility Audit',
    description: 'See exactly how GPT-4, Claude, and Gemini describe your brand to millions of users.',
  },
  {
    icon: BarChart3,
    title: 'Sentiment Tracking',
    description: 'Monitor how AI perception of your brand shifts over time across all major models.',
  },
  {
    icon: Shield,
    title: 'Source Fidelity',
    description: 'Verify the accuracy of AI-generated claims about your brand with confidence scores.',
  },
  {
    icon: Zap,
    title: 'Competitive Intelligence',
    description: 'Compare your AI visibility against competitors across every foundation model.',
  },
];

const Landing = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard?brand=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 text-xs text-primary border border-primary/20 rounded-lg bg-primary/5 mb-6 font-data uppercase tracking-wider">
              AI Visibility Platform
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display text-foreground mb-6 leading-[1.1]">
              How does AI see{' '}
              <span className="text-gradient-amber">your brand?</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              BitBrew audits how foundation models like GPT-4, Claude, and Gemini perceive, describe, and recommend your brand — giving you the visibility score that matters in the age of AI search.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card p-2 max-w-xl mx-auto flex items-center gap-2"
          >
            <Search className="w-5 h-5 text-muted-foreground ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter a brand name (e.g. Tesla, Apple)..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none py-3"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0"
            >
              Brew
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground/50 mt-4"
          >
            Try "Tesla" or "Apple" for a demo analysis
          </motion.p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-display text-center text-foreground mb-12"
          >
            Why AI Visibility matters
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-hover p-6"
              >
                <feature.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-base font-medium text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center glass-card p-12">
          <h2 className="text-2xl font-display text-foreground mb-3">Start your first brew</h2>
          <p className="text-muted-foreground text-sm mb-6">
            No credit card required. Get your first 3 brand analyses free.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            View Pricing
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--glass-border))] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2024 BitBrew. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
