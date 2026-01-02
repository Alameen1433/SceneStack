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
    className="relative flex flex-col items-center justify-center w-full pt-2 pb-2"
    aria-current={isActive ? "page" : undefined}
  >
    {isActive && (
      <motion.div
        layoutId="nav-indicator"
        className="absolute inset-0 top-0 bottom-0 w-16 mx-auto bg-brand-primary/10 rounded-xl"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}

    <motion.div
      animate={{
        scale: isActive ? 1.1 : 1,
        color: isActive ? "var(--color-brand-primary)" : "var(--color-brand-text-dim)"
      }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="relative z-10"
    >
      {icon}
    </motion.div>

    <motion.span
      animate={{
        color: isActive ? "var(--color-brand-primary)" : "var(--color-brand-text-dim)",
        fontWeight: isActive ? 600 : 500
      }}
      className="text-[10px] mt-1 relative z-10"
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
    {
      id: "discover",
      label: "Discover",
      icon: <FiCompass className="h-6 w-6" />,
    },
    {
      id: "lists",
      label: "My List",
      icon: <FiList className="h-6 w-6" />,
    },
    {
      id: "recommendations",
      label: "For You",
      icon: <FiHeart className="h-6 w-6" />,
    },
    {
      id: "stats",
      label: "Stats",
      icon: <FiBarChart2 className="h-6 w-6" />,
    },
  ] as const;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-bg/90 backdrop-blur-xl border-t border-white/5 z-20 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex justify-around items-center max-w-xl mx-auto px-2 py-2">
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
    </nav>
  );
};
