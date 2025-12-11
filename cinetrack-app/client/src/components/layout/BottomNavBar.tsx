import React from "react";
import { FiCompass, FiList, FiHeart, FiBarChart2 } from "react-icons/fi";

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
    className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors ${isActive
      ? "text-brand-primary"
      : "text-brand-text-dim hover:text-brand-text-light"
      }`}
    aria-current={isActive ? "page" : undefined}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
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
      icon: <FiCompass className="h-6 w-6 mb-1" />,
    },
    {
      id: "lists",
      label: "My List",
      icon: <FiList className="h-6 w-6 mb-1" />,
    },
    {
      id: "recommendations",
      label: "For You",
      icon: <FiHeart className="h-6 w-6 mb-1" />,
    },
    {
      id: "stats",
      label: "Stats",
      icon: <FiBarChart2 className="h-6 w-6 mb-1" />,
    },
  ] as const;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-bg/80 backdrop-blur-lg border-t border-brand-surface/50 z-20"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex justify-around items-start max-w-xl mx-auto">
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
