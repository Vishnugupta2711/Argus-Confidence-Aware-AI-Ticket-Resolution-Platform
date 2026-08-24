import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const tabs = [
  {
    label: 'Enterprise',
    headline: 'Transform your enterprise\nwith AI-driven support.',
    desc: 'Large IT teams use Argus to cut escalation time by 73%, maintain a tamper-proof audit trail for compliance, and build a self-improving knowledge base that gets smarter with every ticket.',
    cta: 'Argus for enterprise',
    stats: [
      { value: '73%', label: 'Auto-resolved tickets' },
      { value: '0.8s', label: 'Avg pipeline time' },
      { value: '100%', label: 'Merkle-verified' },
    ],
    stories: [
      {
        name: 'TechCorp',
        initials: 'TC',
        color: 'bg-blue-600',
        text: 'TechCorp cut P1 escalation time from 4 hours to under 30 minutes with Argus.',
      },
      {
        name: 'FinanceHub',
        initials: 'FH',
        color: 'bg-indigo-600',
        text: 'FinanceHub achieved SOC 2 compliance using Argus audit chains.',
      },
    ],
  },
  {
    label: 'Startups',
    headline: 'Build a support system\nthat scales with you.',
    desc: 'From your first 10 employees to your 10,000th, Argus scales seamlessly. No complex setup — connect your existing tools, and start auto-resolving tickets on day one.',
    cta: 'Argus for startups',
    stats: [
      { value: 'Day 1', label: 'Time to first resolution' },
      { value: '5min', label: 'Setup time' },
      { value: '∞', label: 'Scales with growth' },
    ],
    stories: [
      {
        name: 'LaunchPad',
        initials: 'LP',
        color: 'bg-violet-600',
        text: 'LaunchPad support team of 2 handles 500+ tickets/month with Argus.',
      },
      {
        name: 'DevFlow',
        initials: 'DF',
        color: 'bg-emerald-600',
        text: 'DevFlow resolved their backlog in a week using Argus auto-classification.',
      },
    ],
  },
  {
    label: 'Platforms',
    headline: 'Turn your support into\na competitive advantage.',
    desc: "SaaS platforms embed Argus to offer their customers intelligent support as a feature. Your users get faster resolutions, you get deeper insights — everyone wins.",
    cta: 'Argus for platforms',
    stats: [
      { value: 'API', label: 'Full REST API access' },
      { value: 'White', label: 'Label ready' },
      { value: 'SDK', label: 'JavaScript & Python' },
    ],
    stories: [
      {
        name: 'CloudOps',
        initials: 'CO',
        color: 'bg-cyan-600',
        text: 'CloudOps embedded Argus into their SaaS — CSAT improved by 40%.',
      },
      {
        name: 'DevTools Co',
        initials: 'DT',
        color: 'bg-rose-600',
        text: 'DevTools Co ships Argus-powered support as a tier-1 feature.',
      },
    ],
  },
];

export const BusinessSize = () => {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <section className="py-24 lg:py-32 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section intro */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 items-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[12px] font-semibold text-indigo-600 tracking-widest uppercase mb-4">Teams</p>
            <h2 className="text-3xl sm:text-[2.5rem] font-bold text-slate-900 tracking-tight leading-tight">
              Powering teams of all sizes.{' '}
              <span className="text-slate-400 font-normal">
                Run your support on a reliable platform that adapts to your needs.
              </span>
            </h2>
          </motion.div>

          {/* Tab switcher */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2 lg:justify-end"
          >
            {tabs.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setActive(i)}
                className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition-all duration-200 ${
                  active === i
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] as const }}
          >
            {/* Top content row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8 pb-8 border-b border-slate-100">
              <div>
                <h3 className="text-[1.6rem] font-bold text-slate-900 leading-tight mb-4 whitespace-pre-line">
                  {tab.headline}
                </h3>
                <p className="text-[16px] text-slate-500 leading-relaxed mb-6">{tab.desc}</p>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[14px] font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                  {tab.cta} <ArrowRight size={14} />
                </button>
              </div>
              {/* Stats */}
              <div className="flex items-center gap-0 border border-slate-100 rounded-xl overflow-hidden">
                {tab.stats.map((s, i) => (
                  <div key={i} className={`flex-1 px-5 py-6 ${i < tab.stats.length - 1 ? 'border-r border-slate-100' : ''}`}>
                    <div className="text-[1.75rem] font-bold text-slate-900 tracking-tight mb-1">{s.value}</div>
                    <div className="text-[12.5px] text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Story cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tab.stories.map((story, i) => (
                <motion.div
                  key={story.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="flex items-start gap-4 p-5 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group cursor-default"
                >
                  <div className={`w-9 h-9 rounded-lg ${story.color} flex items-center justify-center text-white text-[12px] font-bold shrink-0`}>
                    {story.initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] text-slate-700 leading-snug">{story.text}</p>
                  </div>
                  <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-[13px]">→</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
