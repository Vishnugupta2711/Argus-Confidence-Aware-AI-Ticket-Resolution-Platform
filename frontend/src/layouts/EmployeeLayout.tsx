import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, Home, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import argusLogo from "@/assets/argus-logo.png";

export const EmployeeLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isOnSubmitPage = location.pathname === "/employee/submit";

  return (
    <div className="employee-portal min-h-screen flex flex-col" style={{ background: "var(--argus-bg)" }}>

      {/* ── Top Navigation ── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ borderColor: "var(--argus-border)", background: "var(--argus-surface)" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left: Back arrow + Logo */}
          <div className="flex items-center gap-2">
            {isOnSubmitPage && (
              <button
                onClick={() => navigate("/employee")}
                className="emp-topbar-link cursor-pointer"
                title="Back to user selection"
              >
                <ArrowLeft size={14} />
              </button>
            )}
            <Link to="/employee" className="flex items-center gap-2.5">
              <img
                src={argusLogo}
                alt="Argus logo"
                className="w-7 h-7 rounded-lg object-cover border"
                style={{ borderColor: "var(--argus-border-subtle)" }}
              />
              <span className="text-[15px] font-bold tracking-tight" style={{ color: "var(--argus-text-primary)" }}>
                Argus
              </span>
              <span className="text-xs" style={{ color: "var(--argus-text-muted)" }}>/</span>
              <span className="text-[13px] font-medium" style={{ color: "var(--argus-text-secondary)" }}>
                Support
              </span>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link to="/" className="emp-topbar-link">
              <Home size={13} />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link to="/agent" className="emp-topbar-link">
              <span className="hidden sm:inline">Dashboard</span>
              <ArrowUpRight size={12} />
            </Link>
            <div className="w-px h-4 mx-1" style={{ background: "var(--argus-border)" }} />
          </div>
        </div>
      </header>

      {/* \u2500\u2500\u2500 Page Content \u2500\u2500\u2500 */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-10 lg:py-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* \u2500\u2500\u2500 Footer \u2500\u2500\u2500 */}
      <footer className="py-5 border-t" style={{ borderColor: 'var(--argus-border)' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-[11px] font-medium" style={{ color: 'var(--argus-text-muted)' }}>
            Argus IT Support
          </p>
          <p className="text-[11px]" style={{ color: 'var(--argus-text-muted)' }}>
            Intelligent Ticket Resolution
          </p>
        </div>
      </footer>
    </div>
  );
};
