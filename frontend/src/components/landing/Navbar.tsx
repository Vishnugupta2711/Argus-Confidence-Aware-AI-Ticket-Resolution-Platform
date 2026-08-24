import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import argusLogo from '@/assets/argus-logo.png';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Architecture', href: '#architecture' },
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#pipeline' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          scrolled
            ? 'bg-white/60 backdrop-blur-2xl border-b border-white/20 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src={argusLogo}
                alt="Argus logo"
                className="w-7 h-7 rounded-md object-cover border border-slate-200"
              />
              <span className="font-bold text-[16px] tracking-tight text-slate-900">
                Argus
              </span>
            </Link>

            {/* Desktop Nav - Centered absolutely */}
            <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-1.5">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-[13.5px] font-medium text-slate-500 hover:text-slate-900 transition-colors rounded-lg"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Right CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/employee"
                className="text-[13.5px] font-medium text-slate-600 hover:text-slate-900 px-3.5 py-2 transition-colors"
              >
                Submit a ticket
              </Link>
              <Link
                to="/agent"
                className="group inline-flex items-center gap-2 px-4 py-2 text-[13.5px] font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Agent Dashboard
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-[60px] z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-lg md:hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-slate-100 mt-3 space-y-2">
                <Link to="/employee" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">
                  Submit a ticket
                </Link>
                <Link to="/agent" className="block px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg text-center">
                  Agent Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
