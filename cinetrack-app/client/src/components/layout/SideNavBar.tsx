import React from "react";

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
      className={`flex items-center w-full p-3 my-1 rounded-lg transition-colors duration-200 ${
        isActive
          ? "bg-brand-primary text-white shadow-lg"
          : "text-brand-text-dim hover:bg-brand-surface hover:text-brand-text-light"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="flex-shrink-0 w-6 h-6">{icon}</div>
      <span
        className={`ml-4 text-sm font-semibold whitespace-nowrap transition-opacity duration-200 ${
          isCollapsed ? "opacity-0" : "opacity-100"
        }`}
      >
        {label}
      </span>
    </button>
  </li>
);

interface SideNavBarProps {
  activeTab: "discover" | "lists" | "recommendations";
  onTabChange: (tab: "discover" | "lists" | "recommendations") => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    {
      id: "discover",
      label: "Discover",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v11.494m-9-5.747h18"
          />
        </svg>
      ),
    },
    {
      id: "lists",
      label: "My List",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      ),
    },
    {
      id: "recommendations",
      label: "For You",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
    },
  ] as const;

  return (
    <aside
      className={`hidden lg:flex flex-col fixed top-0 left-0 h-full bg-brand-bg border-r border-brand-surface/50 z-30 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex items-center shrink-0 px-4 h-20 transition-all duration-300 ease-in-out ${
          isCollapsed ? "justify-center" : "justify-start"
        }`}
      >
        {isCollapsed ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-brand-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
            />
          </svg>
        ) : (
          <h1 className="text-3xl font-black tracking-tighter text-white whitespace-nowrap">
            Scene<span className="text-brand-secondary">Stack</span>
          </h1>
        )}
      </div>
      <nav className="flex-grow px-3">
        <ul>
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
      <div className="px-3 py-4 border-t border-brand-surface/50">
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center w-full p-3 rounded-lg text-brand-text-dim hover:bg-brand-surface hover:text-brand-text-light"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className="flex-shrink-0 w-6 h-6">
            {isCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            )}
          </div>
          <span
            className={`ml-4 text-sm font-semibold whitespace-nowrap transition-opacity duration-200 ${
              isCollapsed ? "opacity-0" : "opacity-100"
            }`}
          >
            Collapse
          </span>
        </button>
      </div>
    </aside>
  );
};
