import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  Search,
  Fingerprint,
  ArrowRight,
} from 'lucide-react';

type Stage = {
  num: string;
  label: string;
  sublabel: string;
  bgColor: string;
  textColor: string;
  visual: React.ReactNode;
  what: string;
  description: string;
};

const stages: Stage[] = [
  {
    num: '01',
    label: 'Policy Gate',
    sublabel: 'DETERMINISTIC LAYER',
    bgColor: '#93C5FD',
    textColor: '#0F172A',
    visual: (
      <div className="w-full max-w-md bg-white rounded-2xl border border-blue-200 shadow-2xl overflow-hidden font-mono text-sm leading-relaxed p-6 ml-auto mr-auto lg:mr-0 rotate-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <p><span className="text-pink-600">if</span> ticket.severity <span className="text-pink-600">in</span> [<span className="text-blue-600">"P1"</span>, <span className="text-blue-600">"P2"</span>]:</p>
        <p className="pl-4"><span className="text-pink-600">return</span> escalate(<span className="text-emerald-600">"high_sev"</span>)</p>
        <p className="mt-2"><span className="text-pink-600">if</span> check_active_incident():</p>
        <p className="pl-4"><span className="text-pink-600">return</span> escalate(<span className="text-emerald-600">"incident"</span>)</p>
        <p className="mt-4 text-slate-500"># Zero ML involved. Pure policy.</p>
      </div>
    ),
    what: 'Hard rules run before any AI.',
    description:
      'P1/P2 severity, VIP flags, active incidents, and change freezes are checked. These must NEVER auto-resolve regardless of model confidence.',
  },
  {
    num: '02',
    label: 'Embed & Retrieve',
    sublabel: 'SEMANTIC SEARCH',
    bgColor: '#FDE047',
    textColor: '#0F172A',
    visual: (
      <div className="w-full max-w-md bg-white rounded-2xl border border-yellow-200 shadow-2xl overflow-hidden p-6 ml-auto mr-auto lg:mr-0 -rotate-1">
        <div className="flex items-center gap-3 mb-6">
          <Search size={20} className="text-yellow-600" />
          <div className="h-6 w-3/4 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[0.98, 0.94, 0.89].map((score, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center font-bold text-yellow-700">
                {score}
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-2 w-full bg-slate-200 rounded" />
                <div className="h-2 w-2/3 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    what: 'Ticket text becomes a vector.',
    description:
      'Jina AI converts the text to a dense vector. Qdrant retrieves the top-5 nearest from historically resolved tickets based on cosine distance.',
  },
  {
    num: '03',
    label: 'Novelty Check',
    sublabel: 'SAFETY NET',
    bgColor: '#F9A8D4',
    textColor: '#831843',
    visual: (
      <div className="w-full max-w-md bg-white/40 backdrop-blur-md rounded-2xl border border-pink-200 shadow-2xl overflow-hidden p-8 ml-auto mr-auto lg:mr-0 text-center relative pointer-events-none">
        <div className="absolute inset-0 bg-pink-500/10 mix-blend-overlay animate-pulse" />
        <Fingerprint size={64} className="mx-auto mb-6 text-pink-700 opacity-90" />
        <div className="text-4xl font-mono font-bold tracking-tight mb-2 text-pink-900">0.42 &lt; 0.50</div>
        <div className="inline-block px-4 py-1.5 rounded-full bg-pink-600 text-white text-sm font-bold tracking-widest mt-2">
          NOVEL PATTERN
        </div>
      </div>
    ),
    what: 'Never-seen tickets flagged.',
    description:
      'If semantic similarity is below the novelty threshold (0.50), the ticket is classified as novel. Unknown patterns should never be auto-resolved.',
  },
  {
    num: '04',
    label: '3-Signal Engine',
    sublabel: 'CORE ENGINE',
    bgColor: '#A7F3D0',
    textColor: '#064E3B',
    visual: (
      <div className="w-full max-w-md bg-white rounded-2xl border border-emerald-200 shadow-2xl overflow-hidden p-8 ml-auto mr-auto lg:mr-0">
        <div className="space-y-6">
          {[
            { label: 'Semantic Average', val: 92 },
            { label: 'Cluster Consistency', val: 88 },
            { label: 'Category Accuracy', val: 95 },
          ].map((s, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                <span>{s.label}</span>
                <span>{s.val}%</span>
              </div>
              <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.val}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-4 border-t border-emerald-100 flex justify-between items-center bg-emerald-50 -mx-8 -mb-8 p-6">
          <span className="font-bold text-sm tracking-wide text-emerald-800">OVERALL STATUS</span>
          <span className="px-3 py-1 rounded bg-emerald-500 text-white font-bold text-xs">APPROVED</span>
        </div>
      </div>
    ),
    what: 'Three independent scores.',
    description:
      'A single score can be fooled. We require semantic similarity, cluster consistency, and historical accuracy to ALL pass category-specific thresholds.',
  },
  {
    num: '05',
    label: 'Sandbox Test',
    sublabel: 'LIVE PROOF',
    bgColor: '#C4B5FD',
    textColor: '#2E1065',
    visual: (
      <div className="w-full max-w-md bg-white rounded-2xl border border-purple-200 shadow-2xl overflow-hidden font-mono text-[13px] leading-relaxed p-6 ml-auto mr-auto lg:mr-0 rotate-1">
        <div className="text-purple-600 mb-4 space-y-1">
          <p className="font-bold">$ docker exec mock_env ./apply_fix.sh</p>
          <p className="opacity-70">Initializing sandbox...</p>
        </div>
        <div className="space-y-2 text-slate-700">
          <p className="flex justify-between"><span>[✔] DB connect</span> <span className="text-purple-600 font-bold">OK</span></p>
          <p className="flex justify-between"><span>[✔] Applying perm patch</span> <span className="text-purple-600 font-bold">OK</span></p>
          <p className="flex justify-between"><span>[✔] Verify target state</span> <span className="text-purple-600 font-bold">OK</span></p>
          <p className="flex justify-between"><span>[✔] Check side-effects</span> <span className="text-purple-600 font-bold">OK</span></p>
        </div>
        <div className="mt-6 border-t border-purple-100 pt-4 flex gap-2 items-center text-purple-800 font-bold">
          <ArrowRight size={16} /> <span>MERKLE HASH GENERATED</span>
        </div>
      </div>
    ),
    what: 'Isolated execution mock.',
    description:
      'The fix runs in a simulated IT environment first. If any assertion fails or causes destructive side-effects, the ticket escalates instantly.',
  },
];

const StageCard = ({
  stage,
  index,
  total,
}: {
  stage: Stage;
  index: number;
  total: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start start', 'end start'],
  });

  // Stacked-card depth:
  // - higher index cards sit more in front
  // - lower index cards shrink more as they move behind the stack
  const stackOffsetY = index * 16;
  const targetScale = 1 - (total - index - 1) * 0.04;
  const y = useTransform(
    scrollYProgress,
    [0, 0.7, 1],
    [70 + stackOffsetY, stackOffsetY, stackOffsetY - 12]
  );
  const scale = useTransform(scrollYProgress, [0, 0.7, 1], [1, targetScale, targetScale]);

  return (
    <div ref={cardRef} className={`relative ${index === total - 1 ? 'h-[62vh]' : 'h-[68vh]'}`}>
      <div className="sticky top-[9vh] h-[54vh]">
        <motion.article
          style={{
            y,
            scale,
            backgroundColor: stage.bgColor,
            color: stage.textColor,
            zIndex: index + 1,
          }}
          className="h-full rounded-[32px] overflow-hidden flex flex-col lg:flex-row shadow-[0_32px_70px_-20px_rgba(0,0,0,0.25)] border border-black/8"
        >
          <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-10 flex flex-col gap-3 justify-center relative z-10">
            <div>
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-[0.14em] uppercase opacity-75 mb-3 bg-black/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                {stage.num} · {stage.sublabel}
              </span>
            </div>

            <div>
              <h3 className="text-3xl sm:text-4xl lg:text-[42px] font-bold mb-3 tracking-tight leading-tight">
                {stage.label}
              </h3>
              <p className="text-lg sm:text-xl lg:text-[22px] opacity-90 leading-snug font-medium mb-3">
                {stage.what}
              </p>
              <p className="text-[14px] sm:text-[15px] opacity-80 leading-relaxed max-w-md">
                {stage.description}
              </p>
            </div>
          </div>

          <div
            className="w-full lg:w-1/2 relative flex items-center justify-center p-6 sm:p-8 lg:p-10 min-h-[280px]"
            style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none mix-blend-overlay" />
            <div className="relative z-10 w-full">{stage.visual}</div>
          </div>
        </motion.article>
      </div>
    </div>
  );
};

export const PipelineVisual = () => {
  return (
    <section id="pipeline" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[#1F3177]" />
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(52% 45% at 10% 92%, rgba(119, 197, 255, 0.88) 0%, rgba(119, 197, 255, 0) 70%),
            radial-gradient(56% 48% at 88% 88%, rgba(144, 132, 255, 0.72) 0%, rgba(144, 132, 255, 0) 72%),
            radial-gradient(58% 46% at 52% 4%, rgba(206, 158, 244, 0.82) 0%, rgba(206, 158, 244, 0) 74%),
            linear-gradient(180deg, #8A79CC 0%, #6B66BC 36%, #4A5AA8 68%, #283D8A 100%)
          `,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.26),transparent_58%)]" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-12">
        <div className="mb-12 lg:mb-24 max-w-3xl">
          <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-white tracking-tight leading-[1.05] mb-6">
            How Argus decides.
            <br />
            <span className="text-white/65">Five gated checks in sequence.</span>
          </h2>
          <p className="text-[18px] sm:text-[20px] text-white/78 font-medium leading-relaxed">
            Each ticket moves through policy, retrieval, novelty, confidence, and sandbox validation.
            Any failed gate routes to agent review with an Evidence Card.
          </p>
        </div>

        <div className="relative">
          {stages.map((stage, index) => (
            <StageCard
              key={stage.num}
              stage={stage}
              index={index}
              total={stages.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
