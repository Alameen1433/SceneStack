import React from "react";
import { FiCompass, FiList, FiHeart, FiBarChart2 } from "react-icons/fi";
import { motion } from "framer-motion";

interface BottomNavBarProps {
  activeTab: "discover" | "lists" | "recommendations" | "stats";
  onTabChange: (tab: "discover" | "lists" | "recommendations" | "stats") => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className="relative flex flex-col items-center justify-center flex-1 py-2"
    aria-current={isActive ? "page" : undefined}
  >
    {isActive && (
      <motion.div
        layoutId="tab-indicator"
        className="absolute inset-1 bg-brand-primary/15 rounded-2xl"
        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
      />
    )}

    <motion.div
      animate={{
        scale: isActive ? 1.1 : 1,
        y: isActive ? -2 : 0,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="relative z-10"
    >
      <motion.div
        animate={{
          color: isActive ? "var(--color-brand-primary)" : "var(--color-brand-text-dim)",
        }}
      >
        {icon}
      </motion.div>
    </motion.div>

    <motion.span
      animate={{
        color: isActive ? "var(--color-brand-primary)" : "var(--color-brand-text-dim)",
        opacity: isActive ? 1 : 0.7,
      }}
      className="text-[10px] mt-1 relative z-10 font-medium"
    >
      {label}
    </motion.span>
  </button>
);

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navItems = [
    { id: "discover", label: "Discover", icon: <FiCompass className="h-5 w-5" /> },
    { id: "lists", label: "My List", icon: <FiList className="h-5 w-5" /> },
    { id: "recommendations", label: "For You", icon: <FiHeart className="h-5 w-5" /> },
    { id: "stats", label: "Stats", icon: <FiBarChart2 className="h-5 w-5" /> },
  ] as const;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 px-4 pb-[calc(env(safe-area-inset-bottom)+8px)]">
      <div
        className="relative overflow-hidden rounded-[28px] border border-white/10 shadow-2xl shadow-black/30"
        style={{
          background: 'linear-gradient(to bottom, rgba(22, 22, 24, 0.75), rgba(10, 10, 11, 0.85))',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        }}
      >
        <div className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 50%)',
          }}
        />

        <div className="relative flex justify-around items-center px-2 py-1">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};
