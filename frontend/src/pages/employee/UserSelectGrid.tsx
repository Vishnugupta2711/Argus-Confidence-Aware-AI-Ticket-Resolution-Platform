import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getUsers, type User } from "@/services/config";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle } from "lucide-react";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getTierStyles(tier: string): { bg: string; text: string; border: string; label: string } {
  const t = tier?.toLowerCase();
  if (t === "vip") {
    return {
      bg: "var(--argus-indigo-light)",
      text: "var(--argus-indigo)",
      border: "rgba(99,102,241,0.25)",
      label: "VIP",
    };
  }
  if (t === "contractor") {
    return {
      bg: "var(--argus-cyan-light)",
      text: "var(--argus-cyan)",
      border: "rgba(8,145,178,0.25)",
      label: "Contractor",
    };
  }
  return {
    bg: "var(--argus-surface-2)",
    text: "var(--argus-text-muted)",
    border: "var(--argus-border)",
    label: "Staff",
  };
}

export const UserSelectGrid = () => {
  const navigate = useNavigate();

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["employee-users"],
    queryFn: getUsers,
  });

  const handleSelect = (email: string) => {
    navigate(`/employee/submit?email=${encodeURIComponent(email)}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--argus-text-primary)" }}
          >
            Who are you?
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--argus-text-muted)" }}>
            Select your account to get started
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] rounded-xl animate-pulse"
              style={{
                background: "var(--argus-surface-2)",
                border: "1px solid var(--argus-border)",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !users) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--argus-red-light)" }}
        >
          <AlertCircle className="h-7 w-7" style={{ color: "var(--argus-red)" }} />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--argus-text-primary)" }}>
          Failed to load users
        </h3>
        <p className="text-sm" style={{ color: "var(--argus-text-muted)" }}>
          Could not reach the server. Please refresh to try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
          style={{ background: "var(--argus-indigo)" }}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--argus-text-primary)" }}
        >
          Who are you?
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--argus-text-muted)" }}>
          Select your account — your email will be pre-filled on the next step
        </p>
      </div>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {users.map((user: User) => {
          const initials = getInitials(user.name);
          const tier = getTierStyles(user.tier);

          return (
            <motion.button
              key={user.id}
              variants={cardVariant}
              whileHover={{ y: -3 }}
              onClick={() => handleSelect(user.email)}
              className="user-select-card group text-left rounded-xl border p-4 cursor-pointer w-full"
              style={{
                background: "var(--argus-surface)",
                borderColor: "var(--argus-border)",
                boxShadow: "var(--shadow-card)",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "rgba(99,102,241,0.35)";
                el.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--argus-border)";
                el.style.boxShadow = "var(--shadow-card)";
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                  style={{
                    background: tier.bg,
                    color: tier.text,
                    border: `1px solid ${tier.border}`,
                  }}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[13px] font-semibold leading-tight truncate"
                    style={{ color: "var(--argus-text-primary)" }}
                    title={user.name}
                  >
                    {user.name}
                  </p>
                  {user.department && (
                    <p
                      className="text-[11px] mt-0.5 truncate"
                      style={{ color: "var(--argus-text-muted)" }}
                    >
                      {user.department}
                    </p>
                  )}
                </div>
              </div>

              <p
                className="text-[10px] font-mono truncate mb-3"
                style={{ color: "var(--argus-text-muted)" }}
                title={user.email}
              >
                {user.email}
              </p>

              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: tier.bg,
                    color: tier.text,
                  }}
                >
                  {tier.label}
                </span>
                <ArrowRight
                  size={13}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                  style={{
                    color: "var(--argus-indigo)",
                    transform: "translateX(-4px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(0px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(-4px)";
                  }}
                />
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
};
