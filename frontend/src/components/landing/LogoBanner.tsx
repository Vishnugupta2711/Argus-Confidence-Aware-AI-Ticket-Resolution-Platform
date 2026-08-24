import { motion } from 'framer-motion';
import jinaLogo from '@/assets/jina-logo.png';
import openrouterLogo from '@/assets/openrouter-logo.png';

/* Real SVG logos */
const SupabaseLogo = () => (
  <svg viewBox="0 0 109 113" className="h-7 w-auto" fill="currentColor">
    <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fillOpacity="0.4" />
    <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fillOpacity="0.2" />
    <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04075L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" />
  </svg>
);

const QdrantLogo = () => (
  <svg viewBox="0 0 80 80" className="h-7 w-auto" fill="currentColor">
    <path d="M40 0L73.137 19.13v38.26L40 76.52 6.863 57.39V19.13L40 0zm0 8.696L13.726 23.478v29.564L40 67.824l26.274-14.782V23.478L40 8.696z" />
    <path d="M40 20l17.32 10v20L40 60 22.68 50V30L40 20z" fillOpacity="0.5" />
  </svg>
);

const JinaLogo = () => (
  <img src={jinaLogo} alt="Jina AI logo" className="h-7 w-auto object-contain scale-[1.25]" />
);

const OpenRouterLogo = () => (
  <img src={openrouterLogo} alt="OpenRouter logo" className="h-7 w-auto object-contain" />
);

const FastAPILogo = () => (
  <svg viewBox="0 0 154 154" className="h-7 w-auto" fill="currentColor">
    <circle cx="77" cy="77" r="77" fillOpacity="0.1" />
    <path d="M81.375 18.667l-38.75 70H77.5l-3.875 46.666 38.75-70H77.5l3.875-46.666z" />
  </svg>
);

const ReactLogo = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-auto" fill="currentColor">
    <circle cx="12" cy="12" r="2.05" />
    <path d="M12 21.5c-3.1 0-5.8-.7-7.7-1.8C2.4 18.6 1 16.7 1 14.5s1.4-4.1 3.3-5.2C6.2 8.2 8.9 7.5 12 7.5s5.8.7 7.7 1.8c1.9 1.1 3.3 3 3.3 5.2s-1.4 4.1-3.3 5.2c-1.9 1.1-4.6 1.8-7.7 1.8z" fill="none" stroke="currentColor" strokeWidth="1" />
    <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60 12 12)" fill="none" stroke="currentColor" strokeWidth="1" />
    <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120 12 12)" fill="none" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const PythonLogo = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-auto" fill="currentColor">
    <path d="M12 2C9.27 2 7.5 3.23 7.5 4.5v1.5H12v.5H5.25C3.87 6.5 2 8 2 12s1.87 5.5 3.25 5.5H7v-1.5c0-1.46 1.27-2.5 3-2.5h4c1.66 0 3 1.27 3 2.5v3.5c0 1.27-1.77 2.5-4.5 2.5S8 21.27 8 20v-.5h4.5v-.5H7.25C5.87 19 4 17.5 4 14s1.87-5.5 3.25-5.5H7v1.5c0 1.46 1.27 2.5 3 2.5h4c1.66 0 3-1.27 3-2.5v-4c0-1.27-1.77-2.5-4.5-2.5z" opacity="0.7" />
  </svg>
);

const logos = [
  { name: 'Supabase', Logo: SupabaseLogo },
  { name: 'Qdrant', Logo: QdrantLogo },
  { name: 'Jina AI', Logo: JinaLogo },
  { name: 'OpenRouter', Logo: OpenRouterLogo },
  { name: 'FastAPI', Logo: FastAPILogo },
  { name: 'React', Logo: ReactLogo },
  { name: 'Python', Logo: PythonLogo },
];

// Duplicate for seamless marquee loop
const allLogos = [...logos, ...logos];

export const LogoBanner = () => {
  return (
    <section className="relative py-14 bg-white border-t border-slate-100 overflow-hidden">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400 mb-10"
      >
        Trusted technologies powering Argus
      </motion.p>

      {/* Marquee container */}
      <div className="relative">
        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex items-center gap-16"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            x: {
              duration: 22,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
          style={{ width: 'max-content' }}
        >
          {allLogos.map(({ name, Logo }, i) => (
            <div
              key={`${name}-${i}`}
              className="flex items-center gap-3 text-slate-300 hover:text-slate-600 transition-colors duration-300 cursor-default shrink-0"
            >
              <Logo />
              <span className="text-[15px] font-semibold tracking-tight whitespace-nowrap">{name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
