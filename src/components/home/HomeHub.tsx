import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bot, FileText, ArrowRight, Sparkles, Megaphone, HelpCircle, Mail, Zap } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FAQ_EN } from '@/lib/faq';

/* Quick-launch tools. */
const TOOLS = [
  { to: '/brand-visibility', icon: Search, title: 'Brand Scan', desc: 'See how AI models describe and recommend your brand.' },
  { to: '/automations',      icon: Bot,    title: 'Automations', desc: 'Set up monitoring and alerts by chat — no forms.' },
  { to: '/reports',          icon: FileText, title: 'Reports', desc: 'Revisit past analyses and track changes over time.' },
];

/* What's new — product updates surfaced on home. */
type Tag = 'New' | 'Improved' | 'Soon';
const TAG_STYLES: Record<Tag, string> = {
  New:      'bg-primary/15 text-primary border-primary/20',
  Improved: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
  Soon:     'bg-muted text-muted-foreground border-[hsl(var(--glass-border))]',
};

const NEWS: { tag: Tag; date: string; title: string; desc: string; to?: string }[] = [
  {
    tag: 'New', date: 'Jul 2026',
    title: 'Set up monitoring by chat',
    desc: 'The new Automations tool configures brands, competitors, schedules and alerts from a conversation — you review and confirm before anything saves.',
    to: '/automations',
  },
  {
    tag: 'Improved', date: 'Jul 2026',
    title: 'Brand Scan is now its own workspace',
    desc: 'Scanning moved out of Home into a dedicated Tools section, so your home stays a clean launchpad.',
    to: '/brand-visibility',
  },
  {
    tag: 'New', date: 'Jun 2026',
    title: 'Action plan on every scan',
    desc: 'Each report now ends with a prioritized, plain-English list of what to publish and optimize to get recommended.',
  },
  {
    tag: 'Soon', date: 'Coming soon',
    title: 'Weekly digest emails',
    desc: 'A short recap of how your AI visibility moved, delivered to your inbox every Monday.',
  },
];

export const HomeHub = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-medium text-primary mb-4 uppercase tracking-wider">
          <Sparkles className="w-3 h-3" /> Your workspace
        </div>
        <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-2">Welcome to Perceply</h1>
        <p className="text-muted-foreground text-sm max-w-xl">
          Pick a tool to get started, catch up on what's new, or find an answer below.
        </p>
      </motion.div>

      {/* Quick tools */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
        {TOOLS.map((tool, i) => (
          <motion.div
            key={tool.to}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              to={tool.to}
              className="group flex flex-col gap-3 p-5 rounded-2xl border border-[hsl(var(--glass-border))] bg-card/50 hover:border-primary/40 hover:bg-primary/5 transition-colors h-full"
            >
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10">
                <tool.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1">
                  {tool.title}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Two-column: What's new + FAQ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {/* What's new */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Megaphone className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-display text-foreground">What's new</h2>
          </div>

          <div className="relative pl-5 space-y-5 before:absolute before:left-[7px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-[hsl(var(--glass-border))]">
            {NEWS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                <span className="absolute -left-[18px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-background" />
                <div className="rounded-xl border border-[hsl(var(--glass-border))] bg-card/40 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${TAG_STYLES[item.tag]}`}>
                      {item.tag}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{item.date}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  {item.to && (
                    <Link to={item.to} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                      Try it <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <HelpCircle className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-display text-foreground">Frequently asked</h2>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-card/40 divide-y divide-[hsl(var(--glass-border))] overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_EN.slice(0, 6).map((item, idx) => (
                <AccordionItem key={idx} value={`q${idx}`} className="border-0 border-b border-[hsl(var(--glass-border))] last:border-b-0 px-5">
                  <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline py-4 [&>svg]:text-primary">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Help CTA */}
          <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">Still stuck?</p>
                <p className="text-xs text-muted-foreground truncate">We usually reply within a few hours.</p>
              </div>
            </div>
            <a
              href="mailto:kontakt@bitbrew.pl"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Contact <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {/* Upgrade nudge */}
          <Link
            to="/pricing"
            className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-primary" />
            Unlock all 6 AI models and competitor tracking — see plans
            <ArrowRight className="w-3 h-3" />
          </Link>
        </section>
      </div>
    </div>
  </div>
);

export default HomeHub;
