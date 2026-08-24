import { Link } from 'react-router-dom';
import argusLogo from '@/assets/argus-logo.png';

const CrossGridCorner = ({ position }: { position: string }) => {
  return (
    <div className={`absolute ${position} pointer-events-none opacity-[0.2]`} style={{ width: 15, height: 15 }}>
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-900 -translate-y-1/2" />
      <div className="absolute left-1/2 top-0 h-full w-[1px] bg-slate-900 -translate-x-1/2" />
    </div>
  );
};

export const Footer = () => {
  return (
    <footer className="relative bg-[#FDFCFF] overflow-hidden pt-20 pb-10">
      {/* Background Gradient matching the bottom of Hero slightly */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #FAECF9 50%, #F5F0FF 100%)'
        }}
      />
      
      {/* Decorative lines to create the grid effect */}
      <div className="absolute top-24 left-0 w-full h-[1px] bg-slate-200/50 z-0" />
      <div className="absolute top-[calc(100%-80px)] left-0 w-full h-[1px] bg-slate-200/50 z-0" />
      
      <div className="max-w-6xl mx-auto px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand */}
          <div className="md:col-span-4 relative pt-12">
            <CrossGridCorner position="-top-3 -left-3" />
            <CrossGridCorner position="-top-3 -right-3" />
            <div className="flex items-center gap-2.5 mb-2">
              <img
                src={argusLogo}
                alt="Argus logo"
                className="w-7 h-7 rounded-md object-cover border border-slate-300/90"
              />
              <span className="font-semibold text-[17px] tracking-tight text-slate-900">Argus</span>
            </div>
          </div>

          {/* Links Section */}
          <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-8 pt-12 relative">
            <CrossGridCorner position="-top-3 -left-3" />
            
            {/* Column 1 */}
            <div>
              <h4 className="text-[11px] font-semibold text-slate-500 mb-6 uppercase tracking-wider">Product</h4>
              <div className="space-y-4">
                <Link to="/employee" className="block text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">Employee Portal</Link>
                <Link to="/agent" className="block text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">Agent Dashboard</Link>
                <Link to="/agent/simulator" className="block text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">Simulator Sandbox</Link>
              </div>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="text-[11px] font-semibold text-slate-500 mb-6 uppercase tracking-wider">Hackathon</h4>
              <div className="space-y-4">
                <a href="https://unstop.com/p/srijan-2026-bigger-better-internship-opportunities-with-stipends-and-cash-rewards-atos-global-it-solutions-and-service-1632514" target="_blank" rel="noopener noreferrer" className="block text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">Hackathon Post</a>
                <a href="https://github.com/kr1shnasomani/argus" target="_blank" rel="noopener noreferrer" className="block text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">GitHub Repository</a>
                <a href="https://github.com/kr1shnasomani/argus" target="_blank" rel="noopener noreferrer" className="block text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">Project Source</a>
              </div>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="text-[11px] font-semibold text-slate-500 mb-6 uppercase tracking-wider">Information</h4>
              <div className="space-y-4">
                <a href="#pipeline" className="block text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">Pipeline Design</a>
                <a href="#architecture" className="block text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">Architecture</a>
              </div>
            </div>

            {/* Column 4 - Developers */}
            <div>
              <h4 className="text-[11px] font-semibold text-slate-500 mb-6 uppercase tracking-wider">Developers</h4>
              <div className="space-y-4">
                <a href="https://github.com/kr1shnasomani" target="_blank" rel="noopener noreferrer" className="block text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">Krishna Somani</a>
                <a href="https://github.com/ak8057" target="_blank" rel="noopener noreferrer" className="block text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">Abhay Kumar</a>
                <a href="https://github.com/Vishnugupta2711" target="_blank" rel="noopener noreferrer" className="block text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">Vishnu Gupta</a>
              </div>
            </div>

            <CrossGridCorner position="-top-3 -right-3" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-20 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative">
          <CrossGridCorner position="-top-3 -left-3" />
          <div className="text-[12px] font-medium text-slate-500">
            &copy; 2026 Argus Inc.
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/kr1shnasomani/argus" target="_blank" rel="noopener noreferrer" className="text-slate-900 hover:opacity-70 transition-opacity">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
          </div>
          <CrossGridCorner position="-top-3 -right-3" />
        </div>
      </div>
    </footer>
  );
};
