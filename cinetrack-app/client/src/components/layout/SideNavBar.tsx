import React, { useState } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import { ConfirmModal } from "../common/ConfirmModal";

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
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: "lists",
      label: "My List",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
    },
    {
      id: "recommendations",
      label: "For You",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      id: "stats",
      label: "Stats",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
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
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
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
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {!isCollapsed && <span className="ml-3 text-sm font-medium">Settings</span>}
          </button>
          <button
            title={isCollapsed ? "Notifications" : undefined}
            className="flex items-center w-full px-3 py-2.5 rounded-xl text-brand-text-dim hover:bg-white/5 hover:text-white transition-all relative"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
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
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
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
