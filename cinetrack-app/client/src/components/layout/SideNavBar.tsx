import React, { useState } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import { ConfirmModal } from "../common/ConfirmModal";
import {
  FiCompass,
  FiList,
  FiHeart,
  FiBarChart2,
  FiSettings,
  FiBell,
  FiGithub,
  FiLogOut,
  FiChevronLeft
} from "react-icons/fi";

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  label,
  icon,
  isActive,
  isCollapsed,
  onClick,
}) => (
  <li>
    <button
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`group flex items-center w-full px-3 py-2.5 my-0.5 rounded-lg transition-all duration-200 ${isActive
        ? "bg-brand-primary/15 text-brand-primary border-l-2 border-brand-primary"
        : "text-brand-text-dim hover:bg-white/5 hover:text-white"
        }`}
      aria-current={isActive ? "page" : undefined}
    >
      <div className={`flex-shrink-0 w-5 h-5 transition-transform duration-200 ${!isActive && "group-hover:scale-110"}`}>
        {icon}
      </div>
      {!isCollapsed && (
        <span className="ml-3 text-sm font-medium whitespace-nowrap">
          {label}
        </span>
      )}
      {isActive && !isCollapsed && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
      )}
    </button>
  </li>
);

interface SideNavBarProps {
  activeTab: "discover" | "lists" | "recommendations" | "stats";
  onTabChange: (tab: "discover" | "lists" | "recommendations" | "stats") => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
}) => {
  const { user, logout } = useAuthContext();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    {
      id: "discover",
      label: "Discover",
      icon: <FiCompass />,
    },
    {
      id: "lists",
      label: "My List",
      icon: <FiList />,
    },
    {
      id: "recommendations",
      label: "For You",
      icon: <FiHeart />,
    },
    {
      id: "stats",
      label: "Stats",
      icon: <FiBarChart2 />,
    },
  ];

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-brand-bg/95 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ease-out z-40 ${isCollapsed ? "w-16" : "w-56"
          }`}
      >
        {/* Header with logo and collapse toggle */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          {!isCollapsed && (
            <h1 className="font-display text-2xl tracking-wide text-white">
              SCENE<span className="text-brand-primary">STACK</span>
            </h1>
          )}
          <button
            onClick={onToggleCollapse}
            className={`p-2 rounded-lg text-brand-text-dim hover:bg-white/5 hover:text-white transition-all ${isCollapsed ? "mx-auto" : ""}`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <FiChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                isActive={activeTab === item.id}
                isCollapsed={isCollapsed}
                onClick={() => onTabChange(item.id as "discover" | "lists" | "recommendations" | "stats")}
              />
            ))}
          </ul>
        </nav>

        {/* Settings & Links */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={onOpenSettings}
            title={isCollapsed ? "Settings" : undefined}
            className="flex items-center w-full px-3 py-2.5 rounded-xl text-brand-text-dim hover:bg-white/5 hover:text-white transition-all"
          >
            <FiSettings className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3 text-sm font-medium">Settings</span>}
          </button>
          <button
            title={isCollapsed ? "Notifications" : undefined}
            className="flex items-center w-full px-3 py-2.5 rounded-xl text-brand-text-dim hover:bg-white/5 hover:text-white transition-all relative"
          >
            <FiBell className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3 text-sm font-medium">Notifications</span>}
            {/* Badge */}
            <span className={`absolute ${isCollapsed ? "top-2 right-2" : "top-2.5 left-6"} w-2 h-2 bg-brand-primary rounded-full`} />
          </button>
          <a
            href="https://github.com/Alameen1433"
            target="_blank"
            rel="noopener noreferrer"
            title={isCollapsed ? "GitHub" : undefined}
            className="flex items-center w-full px-3 py-2.5 rounded-xl text-brand-text-dim hover:bg-white/5 hover:text-white transition-all"
          >
            <FiGithub className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3 text-sm font-medium">GitHub</span>}
          </a>
        </div>

        {/* User section */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0 ml-2">
                  <p className="text-xs font-medium text-white truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-brand-text-dim hover:bg-red-500/20 hover:text-red-400 transition-all"
                  aria-label="Sign out"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmStyle="danger"
        onConfirm={() => {
          logout();
          setShowLogoutConfirm(false);
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};
