import React from "react";
import { useAuthContext } from "../../contexts/AuthContext";

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
      className={`group flex items-center w-full px-3 py-2.5 my-0.5 rounded-xl transition-all duration-200 ${isActive
          ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/20"
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
  activeTab: "discover" | "lists" | "recommendations";
  onTabChange: (tab: "discover" | "lists" | "recommendations") => void;
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

  const navItems = [
    {
      id: "discover",
      label: "Discover",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      ),
    },
    {
      id: "lists",
      label: "My List",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
      ),
    },
    {
      id: "recommendations",
      label: "For You",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
        </svg>
      ),
    },
  ] as const;

  return (
    <aside
      className={`hidden lg:flex flex-col fixed top-0 left-0 h-full bg-brand-bg/95 backdrop-blur-xl border-r border-white/5 z-30 transition-all duration-300 ease-out ${isCollapsed ? "w-[72px]" : "w-60"
        }`}
    >
      {/* Header */}
      <div className={`flex items-center shrink-0 h-16 px-4 border-b border-white/5 ${isCollapsed ? "justify-center" : "justify-between"}`}>
        {!isCollapsed && (
          <h1 className="text-xl font-black tracking-tight text-white">
            Scene<span className="text-brand-secondary">Stack</span>
          </h1>
        )}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-2 rounded-lg text-brand-text-dim hover:bg-white/5 hover:text-white transition-all"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-grow px-3 py-4 overflow-y-auto">
        {!isCollapsed && (
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-brand-text-dim/50">
            Menu
          </p>
        )}
        <ul className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activeTab === item.id}
              isCollapsed={isCollapsed}
              onClick={() => onTabChange(item.id)}
            />
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="px-3 py-3 border-t border-white/5">
        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title={isCollapsed ? "Settings" : undefined}
          className="flex items-center w-full px-3 py-2.5 mb-2 rounded-xl text-brand-text-dim hover:bg-white/5 hover:text-white transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!isCollapsed && (
            <span className="ml-3 text-sm font-medium">Settings</span>
          )}
        </button>

        {/* User Profile */}
        <div className={`flex items-center rounded-xl bg-white/5 p-2 ${isCollapsed ? "justify-center" : ""}`}>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0 ml-2">
                <p className="text-xs font-medium text-white truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
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
  );
};
