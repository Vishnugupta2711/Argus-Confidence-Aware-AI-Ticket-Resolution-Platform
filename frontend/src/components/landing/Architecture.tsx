import { motion } from 'framer-motion';
import { 
  SiSupabase, 
  SiFastapi, 
  SiReact, 
  SiGooglecloud,
  SiDocker
} from '@icons-pack/react-simple-icons';
import { ShieldCheck, ArrowRight } from 'lucide-react';

const technologies = [
  {
    name: 'Supabase',
    id: 'supabase',
    color: '#3ECF8E',
    bgColor: 'linear-gradient(145deg, #071510 0%, #030806 100%)',
    glowColor: 'rgba(62, 207, 142, 0.45)',
    icon: SiSupabase,
    logoText: 'Supabase',
    description: 'PostgreSQL handles raw ticketing data securely with RLS, while pgvector stores 1024-dimensional embeddings for lightning-fast retrieval.'
  },
  {
    name: 'FastAPI',
    id: 'fastapi',
    color: '#009688',
    bgColor: 'linear-gradient(145deg, #051614 0%, #020706 100%)',
    glowColor: 'rgba(0, 150, 136, 0.45)',
    icon: SiFastapi,
    logoText: 'FastAPI',
    description: 'The core Python inference engine. It routes embeddings, triggers safety guardrails, and manages async responses in under 400ms.'
  },
  {
    name: 'Google Gemma',
    id: 'gemma',
    color: '#4285F4',
    bgColor: 'linear-gradient(145deg, #070D18 0%, #030408 100%)',
    glowColor: 'rgba(66, 133, 244, 0.45)',
    icon: SiGooglecloud,
    logoText: 'Google Models',
    description: 'Gemma 2 (27B) ensures high-fidelity ticket resolution parsing, while Jina AI handles structural embeddings to power the comparison engine.'
  },
  {
    name: 'React + Tailwind',
    id: 'frontend',
    color: '#61DAFB',
    bgColor: 'linear-gradient(145deg, #0A131A 0%, #030608 100%)',
    glowColor: 'rgba(97, 218, 251, 0.35)',
    icon: SiReact,
    logoText: 'React / Vite',
    description: 'The admin and employee portals are statically built for zero-latency loads, utilizing Tailwind CSS v4 for absolute styling control.'
  },
  {
    name: 'Hardware Isolation',
    id: 'docker',
    color: '#2496ED',
    bgColor: 'linear-gradient(145deg, #05101A 0%, #020508 100%)',
    glowColor: 'rgba(36, 150, 237, 0.45)',
    icon: SiDocker,
    logoText: 'Sandbox Engine',
    description: 'Candidate fixes are executed in isolated, fully-mocked environments. Any destructive commands are intercepted and nullified immediately.'
  },
  {
    name: 'Zero-Trust Gate',
    id: 'security',
    color: '#EF4444',
    bgColor: 'linear-gradient(145deg, #1A0707 0%, #080202 100%)',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    icon: ShieldCheck,
    logoText: 'Argus Security',
    description: 'A deterministic if/else policy overlay that preempts the LLM. It guarantees P1 issues and novel patterns never see auto-resolution.'
  }
];

export const Architecture = () => {
  return (
    <section id="architecture" className="py-24 lg:py-32 border-y border-slate-200 relative overflow-hidden">
      {/* Windsurf-style pale green/yellow gradient background */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 0%, #e1fbe5 0%, #fefde7 50%, #e4faec 100%)'
        }}
      />
      
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Build a foundation with technology that enables immediate scale
            </h2>
            <p className="text-[17px] text-slate-500 font-medium leading-relaxed">
              From vector-native PostgreSQL to sandbox-isolated Python environments, the stack is 
              engineered for deterministic reliability and zero-latency resolution.
            </p>
          </div>
          
          <div className="flex shrink-0">
            <a href="#pipeline" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg text-[15px] font-semibold hover:bg-indigo-700 transition shadow-sm shadow-indigo-600/20">
              View the pipeline <ArrowRight size={18} />
            </a>
          </div>
        </div>

        {/* The Grid - Stripe Startup Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="flex flex-col group rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-500 cursor-pointer"
            >
              {/* Top Visual Half */}
              <div 
                className="relative h-[250px] flex items-center justify-center overflow-hidden"
                style={{ background: tech.bgColor }}
              >
                {/* Subtle Grid overlay */}
                <div 
                  className="absolute inset-0 opacity-[0.05] w-full h-full mix-blend-overlay"
                  style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
                />
                
                {/* Glowing Logo Centered */}
                <motion.div 
                  className="relative z-10 p-6 rounded-2xl flex items-center justify-center transition-transform duration-700 group-hover:scale-110"
                >
                  {/* Outer Glow */}
                  <div 
                    className="absolute inset-0 blur-3xl rounded-full opacity-60 mix-blend-screen transition-opacity duration-500 group-hover:opacity-100" 
                    style={{ background: tech.glowColor }}
                  />
                  {/* The Icon */}
                  <tech.icon size={80} color={tech.color} className="relative drop-shadow-xl" />
                </motion.div>

                {/* Bottom Badge exactly like Stripe */}
                <div className="absolute bottom-5 left-6 flex items-center gap-2.5 z-20">
                  <tech.icon size={18} color="white" />
                  <span className="text-white font-bold text-[17px] tracking-tight">{tech.logoText}</span>
                </div>
              </div>

              {/* Bottom White Half */}
              <div className="p-8 flex-1 flex flex-col bg-white">
                <p className="text-[16px] leading-[1.6] text-slate-600 font-medium h-full">
                  {tech.description}
                </p>
                <div className="mt-8 pt-5 border-t border-slate-100 flex items-center">
                  <span className="text-[14px] font-bold text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Explore component <ArrowRight size={14} className="stroke-[2.5]" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
