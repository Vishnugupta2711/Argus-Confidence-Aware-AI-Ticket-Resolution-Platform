import { motion } from 'framer-motion';
import jinaLogo from '@/assets/jina-logo.png';
import openrouterLogo from '@/assets/openrouter-logo.png';

const techStack = [
  {
    name: 'OpenRouter',
    svg: (
      <img src={openrouterLogo} alt="OpenRouter logo" className="w-full h-full object-contain" />
    )
  },
  {
    name: 'Qdrant',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="57" height="64" fill="none" viewBox="0 0 57 64" className="w-[80%] h-[80%] mx-auto mt-[4px]">
        <g clipPath="url(#a)">
          <path fill="#dc244c" d="M28.335 0 .62 16v32l27.714 16 10.392-6V46l-10.392 6-17.32-10V22l17.32-10 17.32 10v40l10.393-6V16z"/>
          <path fill="#dc244c" d="M17.943 26v12l10.392 6 10.392-6V26l-10.392-6z"/>
          <path fill="#bd0c3e" d="M38.727 46v12l-10.392 6V52zm17.321-30v40l-10.393 6V22z"/>
          <path fill="#ff516b" d="m56.048 16-10.393 6-17.32-10-17.32 10L.62 16 28.335 0z"/>
          <path fill="#dc244c" d="M28.335 52v12L.62 48V16l10.394 6v20z"/>
          <path fill="#ff516b" d="m38.727 26-10.392 6-10.392-6 10.392-6z"/>
          <path fill="#dc244c" d="M28.335 32v12l-10.392-6V26z"/>
          <path fill="#bd0c3e" d="M38.727 26v12l-10.392 6V32z"/>
        </g>
        <defs>
          <clipPath id="a">
            <path fill="#fff" d="M.332 0h56v64h-56z"/>
          </clipPath>
        </defs>
      </svg>
    )
  },
  {
    name: 'Supabase',
    svg: (
      <svg viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint0_linear_supa)"/>
        <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint1_linear_supa)" fillOpacity="0.2"/>
        <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
        <defs>
          <linearGradient id="paint0_linear_supa" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
            <stop stopColor="#249361"/>
            <stop offset="1" stopColor="#3ECF8E"/>
          </linearGradient>
          <linearGradient id="paint1_linear_supa" x1="36.1558" y1="30.578" x2="54.4844" y2="65.0806" gradientUnits="userSpaceOnUse">
            <stop stopColor="#000" stopOpacity="0.5" />
            <stop offset="1" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: 'Jina',
    svg: (
      <img src={jinaLogo} alt="Jina logo" className="w-full h-full object-contain scale-[1.35]" />
    )
  },
  {
    name: 'React',
    svg: (
      <svg viewBox="-11.5 -10.23174 23 20.46348" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="0" cy="0" r="2.05" fill="#61dafb"/>
        <g stroke="#61dafb" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2"/>
          <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
          <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
        </g>
      </svg>
    )
  },
  {
    name: 'FastAPI',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-0.5" preserveAspectRatio="xMidYMid" viewBox="0 0 256 256">
        <path d="M128 0C57.33 0 0 57.33 0 128s57.33 128 128 128 128-57.33 128-128S198.67 0 128 0Zm-6.67 230.605v-80.288H76.699l64.128-124.922v80.288h42.966L121.33 230.605Z" fill="#009688"/>
      </svg>
    )
  },
  {
    name: 'Python',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="16 16 32 32" className="w-full h-full">
        <path fill="url(#py_a)" d="M31.885 16c-8.124 0-7.617 3.523-7.617 3.523l.01 3.65h7.752v1.095H21.197S16 23.678 16 31.876c0 8.196 4.537 7.906 4.537 7.906h2.708v-3.804s-.146-4.537 4.465-4.537h7.688s4.32.07 4.32-4.175v-7.019S40.374 16 31.885 16zm-4.275 2.454a1.394 1.394 0 1 1 0 2.79 1.393 1.393 0 0 1-1.395-1.395c0-.771.624-1.395 1.395-1.395z"/>
        <path fill="url(#py_b)" d="M32.115 47.833c8.124 0 7.617-3.523 7.617-3.523l-.01-3.65H31.97v-1.095h10.832S48 40.155 48 31.958c0-8.197-4.537-7.906-4.537-7.906h-2.708v3.803s.146 4.537-4.465 4.537h-7.688s-4.32-.07-4.32 4.175v7.019s-.656 4.247 7.833 4.247zm4.275-2.454a1.393 1.393 0 0 1-1.395-1.395 1.394 1.394 0 1 1 1.395 1.395z"/>
        <defs>
          <linearGradient id="py_a" x1="19.075" x2="34.898" y1="18.782" y2="34.658" gradientUnits="userSpaceOnUse">
            <stop stopColor="#387EB8"/>
            <stop offset="1" stopColor="#366994"/>
          </linearGradient>
          <linearGradient id="py_b" x1="28.809" x2="45.803" y1="28.882" y2="45.163" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFE052"/>
            <stop offset="1" stopColor="#FFC331"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: 'Tailwind CSS',
    svg: (
      <svg fill="none" viewBox="0 0 54 33" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#38bdf8]">
        <path fill="currentColor" fillRule="evenodd" d="M27 0c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C36.756 3.11 33.692 0 27 0zM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 29.29 20.308 32.4 27 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C23.256 19.31 20.192 16.2 13.5 16.2z" clipRule="evenodd" />
      </svg>
    )
  }
];

export const TechStackMarquee = () => {
  return (
    <section className="relative w-full py-8 md:py-12 bg-white border-b border-slate-100/50 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
      
      <div className="text-center mb-8">
        <span className="text-[12px] md:text-[13px] font-medium uppercase tracking-wider text-slate-400">
          Powered by industry leaders and state-of-the-art open source
        </span>
      </div>

      <div className="relative flex max-w-[1400px] mx-auto overflow-hidden">
        {/* Left and Right fade gradients for smooth entering/exiting */}
        <div className="absolute left-0 top-0 bottom-0 w-32 md:w-64 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 md:w-64 bg-gradient-to-l from-white to-transparent z-10" />

        <div className="flex w-fit whitespace-nowrap overflow-visible">
          <motion.div
            className="flex items-center gap-16 md:gap-24 pl-16 md:pl-24"
            animate={{ x: "-50%" }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 36,
            }}
          >
            {/* We map twice to create an infinite seamless loop */}
            {[...techStack, ...techStack].map((tech, idx) => (
              <div 
                key={`${tech.name}-${idx}`} 
                className="flex items-center gap-3 shrink-0 group grayscale-[30%] opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              >
                <div className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] flex items-center justify-center">
                  {tech.svg}
                </div>
                <span className="text-[16px] md:text-[18px] font-semibold text-slate-800 tracking-tight">
                  {tech.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
