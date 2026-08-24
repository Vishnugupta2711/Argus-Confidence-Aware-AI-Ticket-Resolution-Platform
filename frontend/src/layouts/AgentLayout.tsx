import { Outlet, Link, useLocation } from 'react-router-dom';
import { Layers, LayoutDashboard, Terminal, ChevronRight, Home, Sparkles, Archive, Activity, Settings2, ShieldCheck, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import argusLogo from '@/assets/argus-logo.png';

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  desc: string;
  section: 'agent' | 'system' | 'switch';
}

const navItems: NavItem[] = [
  // Agent Tools
  { name: 'Escalated Queue', path: '/agent', icon: Layers, desc: 'Pending review', section: 'agent' },
  { name: 'All Tickets', path: '/agent/history', icon: Archive, desc: 'Ticket history', section: 'agent' },
  { name: 'Metrics', path: '/agent/metrics', icon: LayoutDashboard, desc: 'System telemetry', section: 'agent' },
  { name: 'Simulator', path: '/agent/simulator', icon: Terminal, desc: 'What-if engine', section: 'agent' },
  // System Settings
  { name: 'System Health', path: '/agent/health', icon: Activity, desc: 'Service monitoring', section: 'system' },
  { name: 'System Config', path: '/agent/config', icon: Settings2, desc: 'Thresholds & policies', section: 'system' },
  // Switch
  { name: 'Employee View', path: '/employee', icon: Sparkles, desc: '', section: 'switch' },
  { name: 'Back to Home', path: '/', icon: Home, desc: '', section: 'switch' },
];

const SECTION_LABELS: Record<NavItem['section'], string> = {
  agent: 'Agent Tools',
  system: 'System Settings',
  switch: 'Switch Portal',
};

export const AgentLayout = () => {
  const location = useLocation();
  const activePathFallback = location.state?.from || '/agent';

  const pageTitle = navItems.find(item =>
    location.pathname === item.path ||
    (location.pathname.startsWith('/agent/ticket') && item.path === activePathFallback)
  )?.name || 'Agent Portal';

  // Group nav items by section
  const grouped = navItems.reduce<Record<NavItem['section'], NavItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<NavItem['section'], NavItem[]>);

  const sections: NavItem['section'][] = ['agent', 'system', 'switch'];

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--argus-bg)' }}>

      {/* ── Sidebar ── */}
      <aside
        className="w-[250px] flex flex-col flex-shrink-0 border-r"
        style={{
          background: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)'
        }}
      >
        {/* Logo header */}
        <div
          className="h-[60px] flex items-center px-5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <div className="flex items-center gap-3">
            <img
              src={argusLogo}
              alt="Argus logo"
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border"
              style={{ borderColor: 'var(--argus-border)' }}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className="font-bold text-[15px] tracking-tight"
                  style={{ color: 'var(--argus-text-primary)' }}
                >
                  ARGUS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          {sections.map((section) => (
            <div key={section} className="mb-5">
              <div
                className="text-[10px] font-semibold uppercase tracking-widest px-3 pb-2 pt-1"
                style={{ color: 'var(--argus-text-muted)' }}
              >
                {SECTION_LABELS[section]}
              </div>
              {grouped[section]?.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path ||
                  (location.pathname.startsWith('/agent/ticket') && item.path === activePathFallback);

                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="sidebar-link group mb-0.5"
                    style={{
                      background: isActive ? 'var(--argus-indigo-light)' : 'transparent',
                      color: isActive ? 'var(--argus-indigo)' : 'var(--sidebar-text)',
                    }}
                  >
                    <div
                      className="flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0"
                      style={{
                        background: isActive ? 'var(--argus-indigo-light)' : 'transparent',
                        color: isActive ? 'var(--argus-indigo)' : 'var(--sidebar-text)',
                      }}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px]">{item.name}</span>
                      {item.desc && (
                        <div
                          className="text-[10px] leading-tight mt-0.5"
                          style={{ color: 'var(--argus-text-muted)', opacity: isActive ? 1 : 0.7 }}
                        >
                          {item.desc}
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <ChevronRight size={12} className="flex-shrink-0" style={{ color: 'var(--argus-indigo)', opacity: 0.6 }} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div
          className="p-3 border-t"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          {/* Agent chip */}
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
            style={{ background: 'var(--argus-surface-2)' }}
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--argus-indigo)' }}
            >
              <ShieldCheck size={14} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold" style={{ color: 'var(--argus-text-primary)' }}>Agent Console</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header Bar */}
        <header
          className="h-[52px] flex items-center px-6 border-b flex-shrink-0 gap-4"
          style={{ borderColor: 'var(--argus-border)' }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link to="/agent" className="transition-colors hover:opacity-80" style={{ color: 'var(--argus-text-muted)' }}>
              Agent Portal
            </Link>
            <ChevronRight size={13} style={{ color: 'var(--argus-text-muted)', opacity: 0.5 }} />
            <span className="font-semibold" style={{ color: 'var(--argus-text-primary)' }}>{pageTitle}</span>
          </div>

          <div className="flex-1" />
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: 'var(--argus-bg)' }}
        >
          <div className="p-6 lg:p-8 max-w-[1400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
