import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const updates = [
  {
    type: 'Featured',
    bg: 'bg-gradient-to-br from-violet-600 to-purple-500',
    textOverlay: true,
    title: 'Argus 2025 Annual Report',
    subtitle: 'AI-powered support resolved 2M+ tickets globally — read our findings.',
    wide: true,
  },
  {
    type: 'Product Update',
    bg: 'bg-[#0f1d32]',
    textOverlay: false,
    title: 'Merkle Chain v3',
    subtitle: 'Faster verification, smaller block sizes, better compliance exports.',
    wide: false,
  },
  {
    type: 'Integration',
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    textOverlay: false,
    title: 'Jira & ServiceNow',
    subtitle: 'Native integrations for enterprise ticketing platforms are now live.',
    wide: false,
  },
  {
    type: 'Blog',
    bg: 'bg-gradient-to-br from-slate-700 to-slate-800',
    textOverlay: false,
    title: '5-Layer Verification',
    subtitle: 'A deep-dive into how Argus achieves 73% auto-resolution with proof.',
    wide: false,
  },
  {
    type: 'Webinar',
    bg: 'bg-gradient-to-br from-indigo-600 to-violet-700',
    textOverlay: false,
    title: 'Live Demo — June 12',
    subtitle: 'Watch the Argus pipeline resolve a real P1 ticket in under a second.',
    wide: false,
  },
];

export const NewsUpdates = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 360 : -360, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  return (
    <section className="py-20 lg:py-28 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header row */}
        <div className="flex items-end justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[12px] font-semibold text-indigo-600 tracking-widest uppercase mb-2">Latest</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">What's happening</h2>
            <p className="text-slate-500 mt-1.5 text-[15px]">See the latest from Argus.</p>
          </motion.div>

          {/* Nav arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                canScrollLeft
                  ? 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  : 'border-slate-100 text-slate-300 cursor-default'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                canScrollRight
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  : 'border-slate-100 text-slate-300 cursor-default'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable cards */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-none -mx-6 px-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {updates.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`shrink-0 rounded-2xl overflow-hidden cursor-default group ${
                item.wide ? 'w-[340px] sm:w-[420px]' : 'w-[220px] sm:w-[260px]'
              }`}
            >
              {/* Image / gradient card */}
              <div className={`relative h-48 ${item.bg}`}>
                {item.textOverlay && (
                  <div className="absolute inset-0 flex flex-col justify-end p-5">
                    <span className="text-white/70 text-[11px] font-medium uppercase tracking-wider mb-1.5">{item.type}</span>
                    <span className="text-white text-[1.35rem] font-bold leading-tight">{item.title}</span>
                  </div>
                )}
                {!item.textOverlay && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/60 text-[11px] font-semibold uppercase tracking-widest border border-white/20 rounded-full px-3 py-1">{item.type}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 border border-t-0 border-slate-100 rounded-b-2xl -mt-px bg-white">
                {!item.textOverlay && (
                  <div className="text-[13px] font-bold text-slate-900 mb-1">{item.title}</div>
                )}
                <p className="text-[12.5px] text-slate-500 leading-snug">{item.subtitle}</p>
                <div className="mt-3 text-[12px] text-indigo-600 font-semibold group-hover:underline">
                  Read more →
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
