import { motion } from 'framer-motion';

const stats = [
  {
    value: '5',
    label: 'Sequential safety layers',
    description: 'Policy gate -> retrieval -> novelty -> 3-signal confidence -> sandbox canary. Any failure escalates.'
  },
  {
    value: '3',
    label: 'Independent confidence signals',
    description: 'Signal A/B/C all must pass category thresholds (default 0.85 / 0.60 / 0.70) before automation.'
  },
  {
    value: '8',
    label: 'IT support categories modeled',
    description: 'Auth/SSO, SAP, email, VPN, printer, software install, network, and permissions/access.'
  },
];

const PerspectiveBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Plum base tone */}
      <div className="absolute inset-0 bg-[#64004E]" />

      {/* Diagonal ambient dark overlays for depth */}
      <div
        className="absolute -left-[12%] top-0 h-full w-[45%]"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.42) 100%)',
          clipPath: 'polygon(0 0, 42% 0, 100% 100%, 20% 100%)',
        }}
      />

      {/* Main diagonal beam */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -left-[8%] -top-[6%] h-[112%] w-[92%]"
        style={{
          clipPath: 'polygon(0 0, 34% 0, 100% 100%, 22% 100%)',
          background:
            'linear-gradient(162deg, rgba(101,10,84,0.20) 0%, rgba(248,233,28,0.96) 44%, rgba(242,177,205,0.96) 76%, rgba(214,157,219,0.94) 100%)',
          filter: 'saturate(1.05)',
        }}
      />

      {/* Dashed guide lines */}
      <div className="absolute inset-0 opacity-55" style={{ transform: 'skewX(22deg) translateX(-22%)' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-[-8%] h-[120%] w-[1px] border-l border-dashed"
            style={{
              left: `${7 + i * 5.8}%`,
              borderColor: 'rgba(250, 191, 240, 0.65)',
            }}
          />
        ))}
      </div>

      {/* Vignette for contrast against card */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 130% at 70% 36%, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.16) 68%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* Label */}
      <div className="absolute top-[17%] left-[26%] -translate-x-1/2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-white/30 rotate-45" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-white/55 uppercase">Stats</span>
        </div>
      </div>
    </div>
  );
};

export const Features = () => {
  return (
    <section id="features" className="relative w-full overflow-hidden py-14 md:py-18 min-h-[520px] flex items-center">
      <PerspectiveBackground />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left Column: Heading */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-[64px] font-bold text-white tracking-tight leading-[1.05] max-w-xl">
              Confidence-first automation.
              <br />
              <span className="text-white/60">Human review when certainty drops.</span>
            </h2>
            <p className="mt-6 max-w-xl text-white/78 text-[16px] md:text-[17px] leading-relaxed font-medium">
              Argus is an IT support handling system with Employee and Agent portals, confidence-based HITL escalation,
              Evidence Cards for review, and a sandbox canary before any automated action is committed.
            </p>
          </motion.div>

          {/* Right Column: Stat Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative"
          >
            <div className="bg-[#FAF7ED] rounded-[20px] p-10 md:p-16 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-black/5">
              <div className="space-y-16">
                {stats.map((item, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-6 md:gap-12 md:items-start group transition-opacity duration-300">
                    <div className="w-full md:w-[180px] shrink-0">
                      <span className="text-6xl md:text-7xl font-bold text-[#64004E] tracking-tighter leading-none block">
                        {item.value}
                      </span>
                    </div>
                    <div className="pt-2">
                      <h4 className="text-[15px] font-bold text-[#64004E] mb-1.5 uppercase tracking-wide">
                        {item.label}
                      </h4>
                      <p className="text-[#64004E]/70 text-[15px] leading-relaxed font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -inset-4 bg-white/5 blur-2xl -z-10 rounded-[34px]" />
          </motion.div>

        </div>
      </div>
    </section>
  );
};
