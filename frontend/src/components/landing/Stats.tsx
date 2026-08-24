import { animate, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const AnimatedNumber = ({ value, suffix = '', duration = 2 }: { value: number; suffix?: string; duration?: number }) => {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true);
          const motionVal = { val: 0 };
          const anim = animate(motionVal, { val: value }, {
            duration,
            ease: [0.25, 0.4, 0.25, 1],
            onUpdate: (latest) => setDisplayed(Math.round(latest.val)),
          });
          return () => anim.stop();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return <span ref={ref}>{displayed}{suffix}</span>;
};

const stats = [
  {
    value: 73,
    suffix: '%',
    label: 'Auto-resolution rate',
    desc: 'Tickets resolved without any human intervention',
    color: 'text-indigo-300',
  },
  {
    value: 500,
    suffix: '+',
    label: 'Knowledge vectors',
    desc: 'Resolved tickets embedded in self-improving store',
    color: 'text-purple-300',
  },
  {
    value: 100,
    suffix: '%',
    label: 'Audit coverage',
    desc: 'Every decision in a tamper-proof Merkle chain',
    color: 'text-cyan-300',
  },
  {
    value: 5,
    suffix: ' layers',
    label: 'Pipeline depth',
    desc: 'Independent verification stages before resolution',
    color: 'text-violet-300',
  },
];

export const Stats = () => {
  return (
    <section className="relative py-24 lg:py-28 overflow-hidden bg-[#0a0e1a]">
      {/* Animated fiber/wave graphic — Stripe-style */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      <motion.div
        className="absolute inset-x-0 -top-8 h-48 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(99,102,241,0.0) 0%, rgba(99,102,241,0.06) 50%, transparent 100%)',
        }}
      />
      {/* Radiating fiber lines — SVG */}
      <div className="absolute inset-x-0 bottom-0 h-56 overflow-hidden pointer-events-none opacity-30">
        <svg viewBox="0 0 1440 220" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {Array.from({ length: 18 }).map((_, i) => {
            const spread = (i - 8.5) * 9;
            return (
              <motion.line
                key={i}
                x1={720}
                y1={-20}
                x2={720 + spread * 5}
                y2={240}
                stroke={`hsl(${230 + i * 8}, 70%, 70%)`}
                strokeWidth="0.8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: [0, 0.8, 0.4] }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 1.5 }}
              />
            );
          })}
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-[2.5rem] lg:text-[3rem] font-bold text-white tracking-tight leading-tight mb-4">
            The backbone of<br className="hidden sm:block" /> intelligent support
          </h2>
          <p className="text-[16px] text-slate-400 max-w-lg mx-auto">
            Built on real data, verified through real testing, trusted by real teams.
          </p>
        </motion.div>

        {/* Stats strip — 4 cols like Stripe */}
        <div className="border-t border-white/[0.08]">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const }}
                className="px-6 py-10 border-b lg:border-b-0 border-r border-white/[0.06] last:border-r-0 first:pl-0"
              >
                <div className={`text-[2.8rem] sm:text-[3.5rem] font-bold tracking-tight leading-none mb-3 ${stat.color}`}>
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[14px] font-semibold text-white mb-1">{stat.label}</div>
                <div className="text-[13px] text-slate-500 leading-snug">{stat.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
