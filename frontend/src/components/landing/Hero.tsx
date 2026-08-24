import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const PlusGrid = () => (
  <div 
    className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-multiply"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 46v8M46 50h8' stroke='%23000000' stroke-width='1.5' stroke-linecap='square' fill='none'/%3E%3C/svg%3E")`,
      backgroundSize: '100px 100px',
      backgroundPosition: 'center center'
    }}
  />
);

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[#FAFAFA]">
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-60"
        style={{
          background: 'radial-gradient(120% 120% at 50% 0%, rgba(255, 245, 214, 0.4) 0%, rgba(245, 181, 213, 0.3) 45%, rgba(180, 124, 247, 0.2) 100%)'
        }}
      />
      
      {/* Plus Grid Pattern */}
      <PlusGrid />
      <div className="absolute inset-0 z-0 pointer-events-none border-t border-black/5 mt-16" />

      {/* Main Content */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-6 mt-8">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex justify-center mb-10"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/[0.04] border border-black/10 text-[13px] font-semibold tracking-tight text-slate-800 backdrop-blur-md shadow-sm transition-colors hover:bg-black/[0.06] cursor-pointer">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white shadow-sm border border-black/5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              </span>
              Argus raises standard for IT support with 5-layer pipeline
              <span className="text-slate-500 ml-1">→</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-[4rem] sm:text-[5.5rem] md:text-[7rem] font-bold tracking-[-0.04em] text-slate-900 leading-[0.9] mb-8"
          >
            Resolve every ticket.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-[1.125rem] sm:text-[1.35rem] text-slate-800/80 leading-relaxed font-medium max-w-[620px] mx-auto mb-12 tracking-tight"
          >
            Argus helps your team focus on complex issues by auto-resolving repetitive tickets using mathematically proven safety and Human-in-the-Loop oversight.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/employee"
              className="px-8 py-3.5 rounded-full bg-slate-900 text-white font-semibold text-[14px] tracking-tight hover:bg-slate-800 transition-colors shadow-xl shadow-slate-900/20"
            >
              Get started
            </Link>
            <Link
              to="/agent"
              className="px-8 py-3.5 rounded-full bg-white/40 text-slate-900 border border-slate-900/10 font-semibold text-[14px] tracking-tight hover:bg-white/60 transition-colors backdrop-blur-md"
            >
              See agent portal
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
