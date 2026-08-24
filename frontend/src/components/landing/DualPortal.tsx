import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const DualPortal = () => {
  return (
    <section className="py-24 lg:py-32 border-t border-slate-200/50 relative overflow-hidden">
      {/* Darker pale yellow/beige background matching Image 3 more closely */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundColor: '#Fbf6d9',
        }}
      />
      
      {/* Darker radiating dashed lines from top */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMin slice">
        <g stroke="#C88CBF" strokeWidth="1.5" fill="none" strokeDasharray="4 6">
          <path d="M500,0 L200,500" />
          <path d="M500,0 L300,500" />
          <path d="M500,0 L400,500" />
          <path d="M500,0 L500,500" />
          <path d="M500,0 L600,500" />
          <path d="M500,0 L700,500" />
          <path d="M500,0 L800,500" />
        </g>
      </svg>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="mb-14 max-w-2xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[2.5rem] sm:text-[3.2rem] font-medium text-[#2C1938] leading-[1.05] tracking-tight"
          >
            Solutions for Employees and IT Support Agents
          </motion.h2>
        </div>

        {/* The Two Portals (Touching Cards) */}
        <div className="flex flex-col lg:flex-row shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden">
          
          {/* LEFT CARD - Employee (Purple) */}
          <Link to="/employee" className="group relative flex-1 min-h-[500px] lg:min-h-[600px] bg-[#3e0b51] overflow-hidden flex flex-col justify-between p-10 lg:p-14 hover:bg-[#480c5e] transition-colors duration-500">
            
            {/* Abstract Background Graphic (Purple Waves) */}
            <div className="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none overflow-hidden flex items-end">
              <div 
                className="w-[150%] h-[200px] group-hover:scale-105 transition-transform duration-1000 ease-out origin-bottom"
                style={{
                  background: 'radial-gradient(ellipse at bottom, rgba(236,72,153,0.4) 0%, transparent 70%)',
                  transform: 'translateY(20px)',
                  filter: 'blur(30px)'
                }}
              />
              {/* Fake sweeping lines */}
              <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute bottom-0 w-full h-[60%] opacity-40 group-hover:scale-105 transition-transform duration-1000 origin-bottom">
                <path d="M0 50 Q 25 20, 50 35 T 100 20 L 100 50 Z" fill="none" stroke="url(#purpleGlow)" strokeWidth="0.5" strokeDasharray="1 2" />
                <path d="M0 50 Q 30 10, 60 40 T 100 10 L 100 50 Z" fill="none" stroke="url(#purpleGlow)" strokeWidth="0.3" strokeDasharray="1 3" />
                <path d="M-10 50 Q 20 0, 70 45 T 110 5 L 110 50 Z" fill="none" stroke="url(#purpleGlow)" strokeWidth="0.8" strokeDasharray="2 2" />
                <defs>
                  <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbcfe8" />
                    <stop offset="50%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#fda4af" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Content Top */}
            <div className="relative z-10">
              <div className="inline-block px-2.5 py-1 bg-white/10 border border-white/20 text-white text-[10px] font-mono font-bold uppercase tracking-[0.15em] rounded mb-8">
                For Employees
              </div>
              <h3 className="text-3xl sm:text-4xl font-normal text-white leading-[1.15] max-w-[300px] sm:max-w-sm">
                Resolve IT issues without waiting. Instantly.
              </h3>
            </div>

            {/* Content Bottom / CTA */}
            <div className="relative z-10 flex items-center gap-2 text-white/80 text-[12px] font-mono font-bold tracking-widest uppercase mt-12 group-hover:text-white transition-colors">
              <span className="border-b border-transparent group-hover:border-white transition-colors pb-0.5">Open Portal</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* RIGHT CARD - Agent (Dark Green) */}
          <Link to="/agent" className="group relative flex-1 min-h-[500px] lg:min-h-[600px] bg-[#02281a] overflow-hidden flex flex-col justify-between p-10 lg:p-14 hover:bg-[#033322] transition-colors duration-500 border-t lg:border-t-0 lg:border-l border-white/5">
            
            {/* Abstract Background Graphic (Green/Yellow Waves) */}
            <div className="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none overflow-hidden flex items-end">
              <div 
                className="w-[150%] h-[300px] right-0 translate-x-[10%] group-hover:scale-105 transition-transform duration-1000 ease-out origin-bottom-right"
                style={{
                  background: 'radial-gradient(ellipse at bottom right, rgba(163,230,53,0.3) 0%, transparent 60%)',
                  transform: 'translateY(40px)',
                  filter: 'blur(40px)'
                }}
              />
              {/* Fake sweeping lines */}
              <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute bottom-0 w-full h-[70%] opacity-50 group-hover:scale-105 transition-transform duration-1000 origin-bottom">
                <path d="M0 50 Q 40 30, 80 45 T 120 10" fill="none" stroke="url(#greenGlow)" strokeWidth="0.5" strokeDasharray="1 3" />
                <path d="M-10 50 Q 50 10, 90 40 T 130 -10" fill="none" stroke="url(#greenGlow)" strokeWidth="0.8" strokeDasharray="2 4" />
                <path d="M-20 50 Q 60 -10, 100 35 T 140 -20" fill="none" stroke="url(#greenGlow)" strokeWidth="1.2" strokeDasharray="2 2" />
                <defs>
                  <linearGradient id="greenGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="50%" stopColor="#bef264" />
                    <stop offset="100%" stopColor="#fde047" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Content Top */}
            <div className="relative z-10">
              <div className="inline-block px-2.5 py-1 bg-white/10 border border-white/20 text-[#bef264] text-[10px] font-mono font-bold uppercase tracking-[0.15em] rounded mb-8">
                For IT Agents
              </div>
              <h3 className="text-3xl sm:text-4xl font-normal text-white leading-[1.15] max-w-[300px] sm:max-w-sm">
                Multiply your team's support output overnight.
              </h3>
            </div>

            {/* Content Bottom / CTA */}
            <div className="relative z-10 flex items-center gap-2 text-white/80 text-[12px] font-mono font-bold tracking-widest uppercase mt-12 group-hover:text-white transition-colors">
              <span className="border-b border-transparent group-hover:border-white transition-colors pb-0.5">Open Dashboard</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>
      </div>
    </section>
  );
};
